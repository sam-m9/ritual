// Offline support. App files are precached; Google Fonts are cached on first use.
// Bump VERSION whenever app files change so phones pick up the update.

const VERSION = 'ritual-v1.17.0';
const FONT_CACHE = 'ritual-fonts';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/app.css',
  './fonts/JetBrainsMono-Regular.ttf',
  './fonts/JetBrainsMono-SemiBold.ttf',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './src/main.js',
  './src/store.js',
  './src/sync.js',
  './src/domain.js',
  './src/seed.js',
  './src/util.js',
  './src/icons.js',
  './src/views/train.js',
  './src/views/nutrition.js',
  './src/views/progress.js',
  './src/views/settings.js',
  './src/views/run.js',
  './src/runplan.js',
  './src/runner.js',
  './src/muscles.js',
  './src/packs/austin-2026-11.js',
  './src/packs/austin-2026-11b.js',
  './src/packs/austin-2026-11c.js',
  './src/packs/global-2026-11.js',
  './src/packs/global-2026-11b.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fonts: cache-first, filled on first online load.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // App shell: cache-first, then network; navigation falls back to the cached index.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    }),
  );
});
