

## Add PWA / Installable Web App Support

Turn ICHEN Manuscript into an installable app that works offline and feels native on any device.

### What You Get
- Users can "Add to Home Screen" from their browser -- it looks and feels like a real app
- The editor works offline (localStorage already saves every keystroke, so writing never stops)
- Fast loading with cached assets
- Works on all phones and tablets (iPhone, Android, desktop)
- No app store submission needed

### How It Works

1. **Install `vite-plugin-pwa`** -- this handles service worker generation and the web app manifest automatically.

2. **Configure the PWA in `vite.config.ts`**:
   - App name: "ICHEN Manuscript"
   - Theme color matching the brand
   - Cache all static assets (JS, CSS, fonts, images) for offline use
   - Network-first strategy for Supabase API calls (so data syncs when online, falls back to cache when offline)
   - Exclude `/~oauth` from caching so login redirects always work

3. **Add PWA icons** to `/public`:
   - 192x192 and 512x512 PNG icons (generated from existing logo)
   - Apple touch icon for iOS

4. **Update `index.html`** with mobile meta tags:
   - `apple-mobile-web-app-capable`
   - `apple-mobile-web-app-status-bar-style`
   - Theme color meta tag

5. **Create an `/install` page** with:
   - Instructions for installing on iOS (Share > Add to Home Screen) and Android (browser menu > Install)
   - A "Install App" button that triggers the browser's native install prompt (on supported browsers)
   - Link from the landing page

6. **Add an offline indicator** in the editor header:
   - Show "Offline" badge when disconnected
   - Auto-sync to Supabase when connection returns
   - This pairs with the existing localStorage backup strategy

### Technical Details

**New dependency:** `vite-plugin-pwa`

**Files created:**
- `public/pwa-192x192.png` and `public/pwa-512x512.png` -- app icons
- `src/pages/Install.tsx` -- install instructions page

**Files modified:**
- `vite.config.ts` -- add VitePWA plugin config with manifest, workbox settings, and `navigateFallbackDenylist: [/^\/~oauth/]`
- `index.html` -- add apple-mobile-web-app meta tags and theme-color
- `src/App.tsx` -- add `/install` route
- `src/pages/Index.tsx` -- add "Install App" link
- `src/pages/Editor.tsx` -- add offline/online status indicator in header

**Offline behavior:**
- Writing always works (localStorage saves every keystroke -- already built)
- When back online, existing auto-save logic syncs to Supabase automatically
- AI features gracefully show "You're offline" instead of failing silently

