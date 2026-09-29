import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cyberengine.app',
  appName: 'Cyber Engine V2',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
};

export default config;
