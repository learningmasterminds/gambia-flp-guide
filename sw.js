const CACHE_NAME = 'gambia-flp-wolof-v5';

// Only the app shell and the primary audio source per track. The duplicate
// fallback encodings are fetched on demand rather than bloating install.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './data/wolof_ecd2_term1.json',
  './audio/wolof/wol_ecd2_w01_letter_a.ogg',
  './audio/wolof/wol_ecd2_w01_song.m4a',
  './audio/wolof/wol_ecd2_w01_vocab.ogg',
  './audio/wolof/wol_ecd2_w01_story.ogg'
];

// Audio is large and immutable, so it is served cache-first. Everything else
// is code or content that must be allowed to change: serving index.html
// cache-first made the ?v= cache-buster inert for returning teachers, because
// the very file carrying the new version tag came from the old cache.
function isImmutableAsset(url) {
  return /\.(ogg|m4a|mp4|mp3|wav|png|jpg|jpeg|svg|woff2?)$/i.test(url.pathname);
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache addAll non-fatal warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  if (!url.protocol.startsWith('http')) return;

  // Cache-first for immutable media.
  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for the app shell and lesson data, falling back to cache
  // when offline. This is what lets a new deploy actually reach a device that
  // already has the service worker installed.
  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) return cached;
        // Navigation requests fall back to the cached shell.
        const accept = request.headers.get('accept') || '';
        if (request.mode === 'navigate' || accept.includes('text/html')) {
          return caches.match('./index.html');
        }
        return Response.error();
      });
    })
  );
});
