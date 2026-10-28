/* 강호록 서비스 워커 — 홈 화면 설치(앱처럼 실행)용
   - 인터넷이 되면 늘 새로 받음 (새 버전이 바로 보임), 받은 것은 저장해 두었다가 인터넷이 안 될 때 꺼내 씀
   - 다른 주소(구글 로그인 · 서버 저장 등)는 손대지 않음 */
const CACHE = 'ganghorok-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./') : undefined)))
  );
});
