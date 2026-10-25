const CACHE = 'daily-focus-shell-v2';
const SHELL = ['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./assets/favicon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // config.js không cache: chỉnh thông số Supabase xong phải nhận bản mới.
  if (new URL(req.url).pathname.endsWith('/config.js')) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(req).then(response => { if (response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache => cache.put(req,copy)).catch(()=>{}); } return response; }).catch(() => caches.match(req)));
});
