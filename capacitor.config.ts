import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.watchvault.app',
  appName: 'WatchVault',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
