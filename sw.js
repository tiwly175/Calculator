// sw.js — แคชไฟล์หลักของแอปไว้ใช้งานออฟไลน์หลังโหลดครั้งแรก
const CACHE = 'fx991cw-v18';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];
// ไฟล์ 3D library เสริม (ไม่บังคับ) — ถ้ายังไม่มีไฟล์เหล่านี้ในโปรเจกต์ ระบบจะข้ามไปเฉยๆ
// ไม่กระทบการแคชไฟล์หลักด้านบน
const OPTIONAL_ASSETS = [
  './three.module.min.js',
  './OrbitControls.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      try { await cache.addAll(CORE_ASSETS); } catch (e) { /* ไม่ต้อง fail การติดตั้งถ้าบางไฟล์แคชไม่ได้ */ }
      for (const url of OPTIONAL_ASSETS) {
        try { await cache.add(url); } catch (e) { /* ไฟล์นี้ยังไม่มีในโปรเจกต์ ข้ามไปเฉยๆ */ }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// กลยุทธ์: cache-first สำหรับไฟล์ในแอป, ตกไป network ถ้าไม่เจอในแคช แล้วเก็บผลลัพธ์ไว้ใช้ครั้งถัดไป
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
            const resClone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, resClone));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
