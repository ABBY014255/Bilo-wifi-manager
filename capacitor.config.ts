import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bilowifi.managerpro',
  appName: 'Bilo wifi manager Pro',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
