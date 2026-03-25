import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rehabbridge.app',
  appName: 'RehabBridge',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    iosScheme: 'https',
  },
};

export default config;
