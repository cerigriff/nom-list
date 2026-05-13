// Nom List Service Worker — read cache strategy
const CACHE = 'nom-list-v26';
const PRECACHE = [
  '/nom-list/',
  '/nom-list/index.html',
  '/nom-list/manifest.json',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js'
];

// Install — cache shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first for shell, network first for Firebase API calls
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch Firebase/OpenAI calls from network
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('openai.com')
  ) {
    return; // let browser handle
  }

  // Cache-first for everything else (app shell, icons, CDN scripts)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('/nom-list/index.html')); // offline fallback
    })
  );
});
