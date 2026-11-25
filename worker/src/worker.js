// Máy chủ nhắc học: nhận đăng ký từ web app và mỗi phút gửi thông báo đẩy tới các máy đến giờ nhắc.
// Thông báo gửi không kèm nội dung; service worker trên máy tự dựng nội dung từ tiến độ học của người đó.
// Máy chủ chỉ lưu địa chỉ nhận thông báo của trình duyệt và lịch nhắc, không lưu tên, email hay tiến độ.

const VAPID_PUBLIC = "BEWtPm4FRTaujmsXT1ycCEMf5RPODwB-n7aqq-WW1aVA_YL1ZTT7j38jaIDu48vVbuhxpC1f1XjBwJDDF98VuRw";
const SUBJECT = "https://caoviethoang999.github.io/hoc-ngon-ngu/";
const ORIGINS = ["https://caoviethoang999.github.io", "http://localhost:8790"];
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /\.notify\.windows\.com$/, /^push\.services\.mozilla\.com$/];
const LANGS = ["jp", "kr", "en"];
const MAX_MOC = 8;

const cors = req => {
  const o = req.headers.get("Origin") || "";
  return {"Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin"};
};
const json = (req, status, obj) => new Response(JSON.stringify(obj), {status, headers: {"Content-Type": "application/json; charset=utf-8", ...cors(req)}});

const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
async function sha(s){ return b64u(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))).slice(0, 22); }

/* giờ địa phương -> phút trong ngày theo UTC (múi giờ không đổi giờ mùa hè như Việt Nam thì chính xác) */
function offsetMin(tz, date = new Date()){
  const p = {}; for(const x of new Intl.DateTimeFormat("en-GB", {timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"}).formatToParts(date)) p[x.type] = x.value;
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(date / 60000) * 60000) / 60000);
}
const toUtcMin = (t, tz) => { const [h, m] = t.split(":").map(Number); return (((h * 60 + m - offsetMin(tz)) % 1440) + 1440) % 1440; };
function localWeekday(tz, date){ const p = {}; for(const x of new Intl.DateTimeFormat("en-GB", {timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"}).formatToParts(date)) p[x.type] = x.value; return (new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay() + 6) % 7; }

/* chữ ký VAPID (ES256) bằng Web Crypto */
let keyP = null;
function vapidKey(env){
  if(!keyP){
    const pub = unb64u(VAPID_PUBLIC);
    keyP = crypto.subtle.importKey("jwk", {kty: "EC", crv: "P-256", d: env.VAPID_PRIVATE_KEY, x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), ext: true}, {name: "ECDSA", namedCurve: "P-256"}, false, ["sign"]);
  }
  return keyP;
}
async function vapidAuth(env, endpoint){
  const aud = new URL(endpoint).origin, enc = o => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = enc({typ: "JWT", alg: "ES256"}) + "." + enc({aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SUBJECT});
  const sig = await crypto.subtle.sign({name: "ECDSA", hash: "SHA-256"}, await vapidKey(env), new TextEncoder().encode(unsigned));
  return "vapid t=" + unsigned + "." + b64u(sig) + ", k=" + VAPID_PUBLIC;
}
async function push(env, endpoint){
  const r = await fetch(endpoint, {method: "POST", headers: {"Authorization": await vapidAuth(env, endpoint), "TTL": "10800", "Urgency": "normal", "Content-Length": "0"}});
  return r.status;
}

function okEndpoint(e){
  try{ const u = new URL(e); return u.protocol === "https:" && PUSH_HOSTS.some(re => re.test(u.hostname)) && e.length < 1000; }catch(x){ return false; }
}
function cleanSched(s){
  if(!Array.isArray(s) || !s.length) return null;
  const out = [];
  for(const x of s.slice(0, MAX_MOC)){
    if(!x || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.t)) return null;
    const d = [...new Set((x.d || []).map(Number).filter(n => n >= 0 && n <= 6))].sort();
    if(!d.length) return null;
    out.push({t: x.t, d});
  }
  return out;
}

async function subscribe(req, env){
  let b; try{ b = await req.json(); }catch(e){ return json(req, 400, {error: "Dữ liệu không đọc được."}); }
  const endpoint = b && b.endpoint, lang = b && b.lang, tz = (b && b.tz) || "Asia/Ho_Chi_Minh", s = cleanSched(b && b.s);
  if(!okEndpoint(endpoint)) return json(req, 400, {error: "Địa chỉ nhận thông báo không hợp lệ."});
  if(!LANGS.includes(lang)) return json(req, 400, {error: "Ngôn ngữ không hợp lệ."});
  try{ new Intl.DateTimeFormat("en", {timeZone: tz}); }catch(e){ return json(req, 400, {error: "Múi giờ không hợp lệ."}); }
  if(!s) return json(req, 400, {error: "Lịch nhắc không hợp lệ."});
  const id = await sha(endpoint + "|" + lang), now = Date.now();
  const stmts = [env.DB.prepare("DELETE FROM moc WHERE id = ?").bind(id)];
  for(const x of s) stmts.push(env.DB.prepare("INSERT INTO moc (id, endpoint, lang, t, days, tz, utc_min, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, endpoint, lang, x.t, x.d.join(","), tz, toUtcMin(x.t, tz), now));
  await env.DB.batch(stmts);
  return json(req, 200, {ok: true, moc: s.length});
}
async function unsubscribe(req, env){
  let b; try{ b = await req.json(); }catch(e){ return json(req, 400, {error: "Dữ liệu không đọc được."}); }
  if(!b || !okEndpoint(b.endpoint) || !LANGS.includes(b.lang)) return json(req, 400, {error: "Thiếu thông tin."});
  await env.DB.prepare("DELETE FROM moc WHERE id = ?").bind(await sha(b.endpoint + "|" + b.lang)).run();
  return json(req, 200, {ok: true});
}

async function tick(env, when){
  const now = new Date(when), m = now.getUTCHours() * 60 + now.getUTCMinutes();
  const {results} = await env.DB.prepare("SELECT id, endpoint, days, tz FROM moc WHERE utc_min = ?").bind(m).all();
  const done = new Set(), gone = new Set();
  await Promise.all(results.map(async r => {
    if(done.has(r.id)) return; 
    if(!r.days.split(",").map(Number).includes(localWeekday(r.tz, now))) return;
    done.add(r.id);
    try{ const st = await push(env, r.endpoint); if(st === 404 || st === 410) gone.add(r.id); }catch(e){}
  }));
  if(gone.size) await env.DB.batch([...gone].map(id => env.DB.prepare("DELETE FROM moc WHERE id = ?").bind(id)));
  return {phut: m, gui: done.size, xoa: gone.size};
}

export default {
  async fetch(req, env){
    const url = new URL(req.url);
    if(req.method === "OPTIONS") return new Response(null, {status: 204, headers: cors(req)});
    if(req.method === "POST" && url.pathname === "/dang-ky") return subscribe(req, env);
    if(req.method === "POST" && url.pathname === "/huy") return unsubscribe(req, env);
    if(url.pathname === "/") return json(req, 200, {ok: true, ten: "Máy chủ nhắc học", vapid: VAPID_PUBLIC});
    return json(req, 404, {error: "Không có đường dẫn này."});
  },
  async scheduled(ev, env, ctx){ ctx.waitUntil(tick(env, ev.scheduledTime)); }
};
export {tick, toUtcMin, cleanSched, okEndpoint};
