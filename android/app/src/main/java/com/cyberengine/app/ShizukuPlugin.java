package com.cyberengine.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

import rikka.shizuku.Shizuku;

@CapacitorPlugin(name = "ShizukuPlugin")
public class ShizukuPlugin extends Plugin {
    private static final String TAG = "ShizukuPlugin";
    private static final int SHIZUKU_REQ_CODE = 4401;

    private PluginCall pendingPermissionCall = null;
    private Shizuku.OnRequestPermissionResultListener permissionListener = null;

    @Override
    public void load() {
        super.load();
        permissionListener = new Shizuku.OnRequestPermissionResultListener() {
            @Override
            public void onRequestPermissionResult(int requestCode, int grantResult) {
                if (requestCode == SHIZUKU_REQ_CODE && pendingPermissionCall != null) {
                    boolean granted = (grantResult == PackageManager.PERMISSION_GRANTED);
                    JSObject ret = new JSObject();
                    ret.put("granted", granted);
                    ret.put("message", granted ? "Shizuku permission granted!" : "Shizuku permission denied by user");
                    pendingPermissionCall.resolve(ret);
                    pendingPermissionCall = null;
                }
            }
        };
        try {
            Shizuku.addRequestPermissionResultListener(permissionListener);
        } catch (Throwable t) {
            Log.w(TAG, "Could not add Shizuku permission listener: " + t.getMessage());
        }
    }

    private boolean isShizukuRunning() {
        try {
            return Shizuku.pingBinder();
        } catch (Throwable t) {
            return false;
        }
    }

    private boolean hasShizukuPermission() {
        try {
            if (!isShizukuRunning()) return false;
            return Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED;
        } catch (Throwable t) {
            return false;
        }
    }

    private boolean isRootAvailable() {
        try {
            Process p = Runtime.getRuntime().exec(new String[]{"su", "-c", "id"});
            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line = reader.readLine();
            int exit = p.waitFor();
            return (exit == 0 && line != null && line.contains("uid=0"));
        } catch (Throwable t) {
            return false;
        }
    }

    @PluginMethod
    public void checkStatus(PluginCall call) {
        JSObject ret = new JSObject();
        boolean running = isShizukuRunning();
        boolean perm = false;
        int version = -1;
        int uid = -1;

        if (running) {
            try {
                perm = (Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED);
                version = Shizuku.getVersion();
                uid = Shizuku.getUid();
            } catch (Throwable ignored) {}
        }

        boolean root = isRootAvailable();

        ret.put("isAndroid", true);
        ret.put("shizukuAvailable", running);
        ret.put("shizukuPermission", perm);
        ret.put("shizukuVersion", version);
        ret.put("shizukuUid", uid);
        ret.put("rootAvailable", root);

        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!isShizukuRunning()) {
            call.reject("Shizuku is not running. Please open the Shizuku app and start the service first.");
            return;
        }

        if (hasShizukuPermission()) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            ret.put("message", "Permission already granted");
            call.resolve(ret);
            return;
        }

        try {
            pendingPermissionCall = call;
            Shizuku.requestPermission(SHIZUKU_REQ_CODE);
        } catch (Throwable t) {
            pendingPermissionCall = null;
            call.reject("Failed to request Shizuku permission: " + t.getMessage());
        }
    }

    @PluginMethod
    public void pasteFiles(PluginCall call) {
        String targetDir = call.getString("targetDir");
        if (targetDir == null || targetDir.trim().isEmpty()) {
            call.reject("Target directory is required");
            return;
        }

        targetDir = targetDir.trim().replaceAll("/+$", "");
        JSArray filesArray = call.getArray("files");
        if (filesArray == null || filesArray.length() == 0) {
            call.reject("No files provided to paste");
            return;
        }

        boolean shizukuReady = isShizukuRunning() && hasShizukuPermission();
        boolean rootReady = !shizukuReady && isRootAvailable();

        // 1. If Shizuku is authorized -> Execute via Shizuku binder shell
        if (shizukuReady) {
            executeViaShizuku(call, targetDir, filesArray);
            return;
        }

        // 2. If Root is available -> Execute via su shell
        if (rootReady) {
            executeViaRoot(call, targetDir, filesArray);
            return;
        }

        // 3. Fallback: Direct Java File I/O (for standard accessible paths)
        executeViaDirectIO(call, targetDir, filesArray);
    }

    private void executeViaShizuku(PluginCall call, String targetDir, JSArray filesArray) {
        try {
            Process process = Shizuku.newProcess(new String[]{"sh"}, null, null);
            DataOutputStream os = new DataOutputStream(process.getOutputStream());

            os.writeBytes("mkdir -p \"" + targetDir + "\"\n");

            for (int i = 0; i < filesArray.length(); i++) {
                JSONObject fileObj = filesArray.getJSONObject(i);
                String fileName = fileObj.getString("name");
                String content = fileObj.getString("content");
                boolean isBase64 = fileObj.optBoolean("isBase64", false);

                String base64Data = isBase64 ? content : Base64.encodeToString(content.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
                String destinationPath = targetDir + "/" + fileName;

                os.writeBytes("mkdir -p \"$(dirname \"" + destinationPath + "\")\"\n");
                os.writeBytes("cat << 'EOF' | base64 -d > \"" + destinationPath + "\"\n");
                os.writeBytes(base64Data + "\n");
                os.writeBytes("EOF\n");
                os.writeBytes("chmod 666 \"" + destinationPath + "\"\n");
            }

            os.writeBytes("exit\n");
            os.flush();

            int exitCode = process.waitFor();

            BufferedReader errReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            StringBuilder errOutput = new StringBuilder();
            String errLine;
            while ((errLine = errReader.readLine()) != null) {
                errOutput.append(errLine).append("\n");
            }

            if (exitCode == 0) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("method", "shizuku");
                ret.put("count", filesArray.length());
                ret.put("targetDir", targetDir);
                ret.put("message", "Files successfully pasted into destination via Shizuku!");
                call.resolve(ret);
            } else {
                call.reject("Shizuku shell failed with exit code " + exitCode + ": " + errOutput.toString());
            }
        } catch (Throwable t) {
            call.reject("Shizuku execution failed: " + t.getMessage());
        }
    }

    private void executeViaRoot(PluginCall call, String targetDir, JSArray filesArray) {
        try {
            Process process = Runtime.getRuntime().exec(new String[]{"su"});
            DataOutputStream os = new DataOutputStream(process.getOutputStream());

            os.writeBytes("mkdir -p \"" + targetDir + "\"\n");

            for (int i = 0; i < filesArray.length(); i++) {
                JSONObject fileObj = filesArray.getJSONObject(i);
                String fileName = fileObj.getString("name");
                String content = fileObj.getString("content");
                boolean isBase64 = fileObj.optBoolean("isBase64", false);

                String base64Data = isBase64 ? content : Base64.encodeToString(content.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
                String destinationPath = targetDir + "/" + fileName;

                os.writeBytes("mkdir -p \"$(dirname \"" + destinationPath + "\")\"\n");
                os.writeBytes("cat << 'EOF' | base64 -d > \"" + destinationPath + "\"\n");
                os.writeBytes(base64Data + "\n");
                os.writeBytes("EOF\n");
                os.writeBytes("chmod 666 \"" + destinationPath + "\"\n");
            }

            os.writeBytes("exit\n");
            os.flush();

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("method", "root");
                ret.put("count", filesArray.length());
                ret.put("targetDir", targetDir);
                ret.put("message", "Files successfully pasted via Root (su)!");
                call.resolve(ret);
            } else {
                call.reject("Root shell failed with exit code " + exitCode);
            }
        } catch (Throwable t) {
            call.reject("Root execution failed: " + t.getMessage());
        }
    }

    private void executeViaDirectIO(PluginCall call, String targetDir, JSArray filesArray) {
        try {
            File dir = new File(targetDir);
            if (!dir.exists() && !dir.mkdirs()) {
                throw new Exception("Unable to create target directory: " + targetDir + ". Permission denied by Android Scoped Storage. Please start Shizuku and authorize CYBER ENGINE.");
            }

            for (int i = 0; i < filesArray.length(); i++) {
                JSONObject fileObj = filesArray.getJSONObject(i);
                String fileName = fileObj.getString("name");
                String content = fileObj.getString("content");
                boolean isBase64 = fileObj.optBoolean("isBase64", false);

                byte[] bytes = isBase64 ? Base64.decode(content, Base64.DEFAULT) : content.getBytes(StandardCharsets.UTF_8);
                File file = new File(dir, fileName);
                File parent = file.getParentFile();
                if (parent != null && !parent.exists()) {
                    parent.mkdirs();
                }

                try (FileOutputStream fos = new FileOutputStream(file)) {
                    fos.write(bytes);
                    fos.flush();
                }
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("method", "direct");
            ret.put("count", filesArray.length());
            ret.put("targetDir", targetDir);
            ret.put("message", "Files pasted via direct file system!");
            call.resolve(ret);
        } catch (Throwable t) {
            call.reject("Pasting failed: " + t.getMessage() + ". For Android/data folders, please launch Shizuku and grant permission.");
        }
    }

    @PluginMethod
    public void openShizuku(PluginCall call) {
        Context context = getContext();
        try {
            Intent intent = context.getPackageManager().getLaunchIntentForPackage("moe.shizuku.privileged.api");
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("opened", true);
                call.resolve(ret);
                return;
            }
        } catch (Throwable ignored) {}

        try {
            Intent marketIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=moe.shizuku.privileged.api"));
            marketIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(marketIntent);
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Throwable t) {
            JSObject ret = new JSObject();
            ret.put("opened", false);
            ret.put("message", "Shizuku app not found on device");
            call.resolve(ret);
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (permissionListener != null) {
            try {
                Shizuku.removeRequestPermissionResultListener(permissionListener);
            } catch (Throwable ignored) {}
        }
    }
}
