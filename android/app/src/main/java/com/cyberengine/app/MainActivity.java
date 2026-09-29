package com.cyberengine.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShizukuPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
