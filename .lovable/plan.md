

## Fix PWA Service Worker Deployment Issues

The reported problem: users visiting the deployed site see a blank page because the service worker serves stale cached assets after a new deployment. The cached `index.html` references old JS/CSS filenames that no longer exist on the server.

### Root Cause

The current PWA config uses `registerType: "autoUpdate"` with broad caching (`globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"]`). When a new version is deployed:
1. The old service worker serves cached `index.html` pointing to old asset filenames
2. Those old assets return 404s from the server
3. The user sees a blank page until the service worker update cycle completes (which may never succeed if the page can't load enough to trigger it)

### What Changes

1. **Add `skipWaiting: true` to workbox config** -- forces the new service worker to activate immediately instead of waiting for all tabs to close.

2. **Add `clientsClaim: true`** -- makes the new service worker take control of existing pages right away.

3. **Narrow `globPatterns`** -- exclude overly broad patterns; only precache the essentials (`index.html`, icons, manifest).

4. **Add `cleanupOutdatedCaches: true`** -- removes old cache entries from previous service worker versions that no longer match.

5. **Exclude the Lovable preview token paths** -- add `navigateFallbackDenylist` entries for preview/token URLs that should never be cached.

### Technical Details

**File modified:** `vite.config.ts`

Changes to the `workbox` section of `VitePWA()`:

```
workbox: {
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
  navigateFallback: "index.html",
  navigateFallbackDenylist: [/^\/~oauth/, /\?__lovable_token=/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        },
        networkTimeoutSeconds: 5,
      },
    },
  ],
},
```

These three additions (`skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`) ensure that when a new version is deployed, users get fresh assets immediately instead of being stuck on a stale cache that shows a blank page.

