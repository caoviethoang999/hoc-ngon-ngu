// Gửi thông báo nhắc học tới các máy đã bật nhắc.
// Mã lấy từ: các file trong .github/nhac-hoc/may/ (app gửi qua issue, đã mã hóa) và secret NHAC_HOC (mỗi dòng một mã).
// Mỗi mã có lịch: danh sách mốc {t:"HH:MM", d:[0..6]} (0 = Thứ 2) theo múi giờ tz.
// Lịch GitHub chạy khoảng 5 phút một lần nhưng có thể trễ, nên mỗi lần chạy gửi các mốc rơi vào
// khoảng (lần chạy trước, bây giờ]; thời điểm lần chạy trước lưu trong STATE_FILE (giữ qua actions/cache).
import webpush from "web-push";
import fs from "fs";
import {docMa} from "./ma.mjs";

const PUBLIC_KEY = "BEWtPm4FRTaujmsXT1ycCEMf5RPODwB-n7aqq-WW1aVA_YL1ZTT7j38jaIDu48vVbuhxpC1f1XjBwJDDF98VuRw";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const FORCE = process.env.GUI_NGAY === "true";
const STATE_FILE = process.env.STATE_FILE || "";
const NOW = process.env.NOW ? new Date(process.env.NOW) : new Date();
const MAX_BACK = 90 * 60 * 1000;   // mất lịch lâu hơn 90 phút thì bỏ các mốc cũ, không gửi dồn

const codes = (process.env.NHAC_HOC || "").split(/\s+/).filter(x => /^HMN[12]\./.test(x));
const dir = new URL("./may/", import.meta.url);
if(fs.existsSync(dir)) for(const f of fs.readdirSync(dir)) if(f.endsWith(".txt")) codes.push(fs.readFileSync(new URL(f, dir), "utf8").trim());

let last = null;
try{ last = new Date(JSON.parse(fs.readFileSync(STATE_FILE, "utf8")).last); }catch(e){}
if(!last || isNaN(last) || NOW - last > MAX_BACK || last > NOW) last = new Date(NOW - 6 * 60 * 1000);
const saveState = () => { if(STATE_FILE){ fs.mkdirSync(STATE_FILE.replace(/[^/]+$/, "") || ".", {recursive: true}); fs.writeFileSync(STATE_FILE, JSON.stringify({last: NOW.toISOString()})); } };

if(!PRIVATE_KEY){ console.log("Chưa có secret VAPID_PRIVATE_KEY — bỏ qua."); saveState(); process.exit(0); }
if(!codes.length){ console.log("Chưa có máy nào bật nhắc học — bỏ qua."); saveState(); process.exit(0); }
webpush.setVapidDetails("https://caoviethoang999.github.io/hoc-ngon-ngu/", PUBLIC_KEY, PRIVATE_KEY);

// giờ địa phương của một thời điểm theo múi giờ (không cần thư viện)
function parts(date, tz){
  const o = {}; for(const p of new Intl.DateTimeFormat("en-GB", {timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short"}).formatToParts(date)) o[p.type] = p.value;
  return o;
}
const offsetMin = (date, tz) => { const p = parts(date, tz); return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(date / 60000) * 60000) / 60000; };
// các thời điểm (UTC) của một mốc trong các ngày quanh khoảng cần xét
function instants(entry, tz){
  const out = [], [hh, mm] = entry.t.split(":").map(Number), days = entry.d || [0, 1, 2, 3, 4, 5, 6];
  for(let back = -1; back <= 2; back++){
    const ref = new Date(NOW - back * 864e5), p = parts(ref, tz);
    const wd = (new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay() + 6) % 7;
    if(!days.includes(wd)) continue;
    const guess = Date.UTC(+p.year, +p.month - 1, +p.day, hh, mm);
    out.push(new Date(guess - offsetMin(new Date(guess), tz) * 60000));
  }
  return out;
}
const schedOf = c => Array.isArray(c.s) && c.s.length ? c.s : (c.h || []).map(h => ({t: String(h).padStart(2, "0") + ":00", d: [0, 1, 2, 3, 4, 5, 6]}));

console.log("Xét các mốc trong khoảng", last.toISOString(), "→", NOW.toISOString(), FORCE ? "(gửi ngay)" : "");
let sent = 0, skipped = 0, failed = 0;
const seen = new Set();
for(const code of codes){
  let c;
  try{ c = docMa(code, PRIVATE_KEY); }catch(e){ console.log("Mã không đọc được, bỏ qua:", code.slice(0, 16) + "…"); failed++; continue; }
  if(seen.has(c.e + c.L)) continue; seen.add(c.e + c.L);
  const tz = c.tz || "Asia/Ho_Chi_Minh";
  const hit = FORCE ? "gửi ngay" : schedOf(c).flatMap(x => instants(x, tz).filter(t => t > last && t <= NOW).map(() => x.t))[0];
  if(!hit){ skipped++; continue; }
  try{
    await webpush.sendNotification({endpoint: c.e, keys: c.k}, JSON.stringify({L: c.L}), {TTL: 3 * 3600, urgency: "normal"});
    console.log("Đã gửi nhắc", c.L, "máy", c.d || "?", "mốc", hit); sent++;
  }catch(e){
    failed++;
    const gone = e.statusCode === 404 || e.statusCode === 410;
    console.log(gone ? "Máy " + (c.d || "?") + " đã tắt hoặc gỡ thông báo (" + c.L + "): bật lại nhắc trong app." : "Gửi lỗi (" + c.L + "): " + (e.statusCode || "") + " " + (e.body || e.message));
  }
}
saveState();
console.log("Kết quả:", sent, "đã gửi,", skipped, "chưa tới mốc,", failed, "lỗi.");
