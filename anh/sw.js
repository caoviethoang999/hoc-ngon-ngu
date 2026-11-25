/* Lưu sẵn toàn bộ trang và dữ liệu để dùng không cần mạng */
const VER = "anh-56318c7d34", FILES = ["./", "fonts/LICENSE.txt", "fonts/files/be-vietnam-pro-latin-400-normal.woff2", "fonts/files/be-vietnam-pro-latin-500-normal.woff2", "fonts/files/be-vietnam-pro-latin-600-normal.woff2", "fonts/files/be-vietnam-pro-latin-700-normal.woff2", "fonts/files/be-vietnam-pro-latin-ext-400-normal.woff2", "fonts/files/be-vietnam-pro-latin-ext-500-normal.woff2", "fonts/files/be-vietnam-pro-latin-ext-600-normal.woff2", "fonts/files/be-vietnam-pro-latin-ext-700-normal.woff2", "fonts/files/be-vietnam-pro-vietnamese-400-normal.woff2", "fonts/files/be-vietnam-pro-vietnamese-500-normal.woff2", "fonts/files/be-vietnam-pro-vietnamese-600-normal.woff2", "fonts/files/be-vietnam-pro-vietnamese-700-normal.woff2", "fonts/files/noto-sans-latin-400-normal.woff2", "fonts/files/noto-sans-latin-500-normal.woff2", "fonts/files/noto-sans-latin-600-normal.woff2", "fonts/files/noto-sans-latin-ext-400-normal.woff2", "fonts/files/noto-sans-latin-ext-500-normal.woff2", "fonts/files/noto-sans-latin-ext-600-normal.woff2", "fonts/files/noto-sans-vietnamese-400-normal.woff2", "fonts/files/noto-sans-vietnamese-500-normal.woff2", "fonts/files/noto-sans-vietnamese-600-normal.woff2", "fonts/fonts.css", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-mask-512.png", "index.html", "luyen/data/en.js", "luyen/data/enwords.js", "luyen/index.html", "manifest.webmanifest", "ngu-phap/data/en.js", "ngu-phap/index.html", "offline.js"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VER).then(async c => {
    for(let i = 0; i < FILES.length; i += 20) await c.addAll(FILES.slice(i, i + 20));
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request; if(r.method !== "GET") return;
  const u = new URL(r.url); if(u.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(VER);
    let hit = await c.match(r, {ignoreSearch:true});
    if(!hit && u.pathname.endsWith("/")) hit = await c.match(u.pathname + "index.html");
    if(hit) return hit;
    try{ const res = await fetch(r); if(res.ok) c.put(r, res.clone()); return res; }
    catch(err){ return (await c.match("./index.html")) || Response.error(); }
  })());
});
self.addEventListener("message", e => {
  if(e.data === "status") caches.open(VER).then(c => c.keys()).then(ks => e.source.postMessage({ver:VER, have:ks.length, total:FILES.length}));
});
