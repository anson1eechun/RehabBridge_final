import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rehabbridge.app',
  appName: 'RehabBridge',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    iosScheme: 'https',
  },
  /** 雅婷等第三方 API 在 WebView 內需原生層 HTTP；yatingTts 已對 isNativePlatform 使用 CapacitorHttp */
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
