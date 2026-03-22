import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ichen.manuscript',
  appName: 'ICHEN Manuscript',
  webDir: 'dist',
  server: {
    url: 'https://448a2886-f0c2-460b-9254-1ec1721a6ea5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
