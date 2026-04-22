import type { CapacitorConfig } from '@capacitor/cli';

// For production mobile builds, leave CAP_SERVER_URL unset so the app
// runs from the bundled `dist/` assets. Only set a URL for live-reload
// development against a remote dev server.
const devServerUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.ichen.manuscript',
  appName: 'ICHEN Manuscript',
  webDir: 'dist',
  ...(devServerUrl
    ? {
        server: {
          url: devServerUrl,
          cleartext: false,
        },
      }
    : {}),
};

export default config;
