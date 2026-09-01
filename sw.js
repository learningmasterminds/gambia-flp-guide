const CACHE_NAME = 'gambia-flp-wolof-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './data/wolof_ecd2_term1.json',
  './audio/wolof/wol_ecd2_w01_letter_a.ogg',
  './audio/wolof/wol_ecd2_w01_letter_a.mp3.ogg',
  './audio/wolof/wol_ecd2_w01_song.m4a',
  './audio/wolof/wol_ecd2_w01_song.mp4',
  './audio/wolof/wol_ecd2_w01_vocab.ogg',
  './audio/wolof/wol_ecd2_w01_vocab.mp3.ogg',
  './audio/wolof/wol_ecd2_w01_story.ogg',
  './audio/wolof/wol_ecd2_w01_story.mp3.ogg'
];

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
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === 'GET' && event.request.url.startsWith('http')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
