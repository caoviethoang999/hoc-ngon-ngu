/* Lưu sẵn toàn bộ trang và dữ liệu để dùng không cần mạng */
const VER = "anh-372dc45e0b", FILES = ["./", "fonts/LICENSE.txt", "fonts/files/be-vietnam-pro-latin-400-normal.woff2", "fonts/files/be-vietnam-pro-latin-500-normal.woff2", "fonts/files/be-vietnam-pro-latin-600-normal.woff2", "fonts/files/be-vietnam-pro-latin-700-normal.woff2", "fonts/files/be-vietnam-pro-latin-ext-400-normal.woff2", "fonts/files/be-vietnam-pro-latin-ext-500-normal.woff2", "fonts/files/be-vietnam-pro-latin-ext-600-normal.woff2", "fonts/files/be-vietnam-pro-latin-ext-700-normal.woff2", "fonts/files/be-vietnam-pro-vietnamese-400-normal.woff2", "fonts/files/be-vietnam-pro-vietnamese-500-normal.woff2", "fonts/files/be-vietnam-pro-vietnamese-600-normal.woff2", "fonts/files/be-vietnam-pro-vietnamese-700-normal.woff2", "fonts/files/noto-sans-latin-400-normal.woff2", "fonts/files/noto-sans-latin-500-normal.woff2", "fonts/files/noto-sans-latin-600-normal.woff2", "fonts/files/noto-sans-latin-ext-400-normal.woff2", "fonts/files/noto-sans-latin-ext-500-normal.woff2", "fonts/files/noto-sans-latin-ext-600-normal.woff2", "fonts/files/noto-sans-vietnamese-400-normal.woff2", "fonts/files/noto-sans-vietnamese-500-normal.woff2", "fonts/files/noto-sans-vietnamese-600-normal.woff2", "fonts/fonts.css", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-mask-512.png", "index.html", "luyen/data/en.js", "luyen/data/enwords.js", "luyen/index.html", "manifest.webmanifest", "ngu-phap/data/en.js", "ngu-phap/index.html", "offline.js"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VER).then(async c => {
    for(let i = 0; i < FILES.length; i += 20) await c.addAll(FILES.slice(i, i + 20));
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  const pre = VER.split("-")[0] + "-";
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(pre) && k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
/* nhắc học: nội dung lấy từ tóm tắt tiến độ app lưu gần nhất */
const LANG = {"L": "en", "name": "Tiếng Anh"};
const dnum = d => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
async function remindNote(L){
  let st = null;
  try{ const r = await (await caches.open("hm-state")).match(self.location.origin + "/__hm-state-" + L); if(r) st = await r.json(); }catch(e){}
  const name = LANG.name, title = "Học " + name.charAt(0).toLowerCase() + name.slice(1);
  if(!st) return {title, body:"Đến giờ học rồi. Bấm để mở bài hôm nay."};
  const now = new Date(), td = dnum(now), off = Math.max(0, Math.min(14, td - st.td));
  const sameDay = off === 0, wd = (now.getDay() + 6) % 7;
  const streakNow = st.streak && (sameDay || (off === 1)) ? st.streak : 0;
  if(sameDay && (st.doneToday || st.left === 0) && st.doneN > 0)
    return {title, body:"Hôm nay bạn đã học xong." + (streakNow ? " Chuỗi " + streakNow + " ngày, mai giữ tiếp nhé." : "")};
  const due = st.due ? st.due[off] : 0;
  if(st.planOn && st.week){
    const q = st.week[wd];
    if(!q.n) return {title, body:"Hôm nay là ngày nghỉ trong kế hoạch." + (due ? " Có khoảng " + due + " câu đến hạn ôn nếu bạn muốn." : "")};
    const parts = [];
    if(q.rev !== 0 && due) parts.push("ôn " + (q.rev > 0 ? Math.min(q.rev, due) : due) + " câu");
    if(q.w) parts.push(q.w + " từ mới"); if(q.g) parts.push(q.g + " mẫu ngữ pháp"); if(q.k) parts.push(q.k + " kanji");
    if(q.o) parts.push(q.o + " câu luyện thêm");
    const left = sameDay && st.left ? "Còn " + st.left + " câu trong kế hoạch hôm nay. " : "";
    return {title, body:((left || "Hôm nay: " + parts.join(", ") + ". ") + (streakNow ? "Chuỗi đang là " + streakNow + " ngày." : "")).trim()};
  }
  const left = sameDay ? st.left : st.goal;
  return {title, body:"Còn " + left + " câu là đủ mục tiêu hôm nay" + (due ? ", trong đó khoảng " + due + " câu đến hạn ôn" : "") + "." + (streakNow ? " Chuỗi đang là " + streakNow + " ngày." : "")};
}
async function showRemind(L){
  const n = await remindNote(L);
  return self.registration.showNotification(n.title, {body:n.body, icon:"icons/icon-192.png", badge:"icons/icon-192.png", tag:"nhac-hoc-" + L, renotify:true, data:{url:"luyen/index.html"}, lang:"vi"});
}
self.addEventListener("push", e => {
  let L = LANG.L; try{ const d = e.data && e.data.json(); if(d && d.L) L = d.L; }catch(err){}
  e.waitUntil(showRemind(L));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "luyen/index.html", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:"window", includeUncontrolled:true}).then(cs => {
    for(const c of cs){ if(c.url.startsWith(self.registration.scope) && "focus" in c){ c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
self.addEventListener("message", e => {
  if(e.data && e.data.remindTest){ e.waitUntil(showRemind(e.data.remindTest)); return; }
  if(e.data === "status") caches.open(VER).then(c => c.keys()).then(ks => e.source.postMessage({ver:VER, have:ks.length, total:FILES.length}));
});
