// Gửi thông báo nhắc học tới các máy đã bật nhắc.
// Mã lấy từ: các file trong .github/nhac-hoc/may/ (app gửi qua issue, đã mã hóa) và secret NHAC_HOC (mỗi dòng một mã).
import webpush from "web-push";
import fs from "fs";
import {docMa} from "./ma.mjs";

const PUBLIC_KEY = "BEWtPm4FRTaujmsXT1ycCEMf5RPODwB-n7aqq-WW1aVA_YL1ZTT7j38jaIDu48vVbuhxpC1f1XjBwJDDF98VuRw";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const FORCE = process.env.GUI_NGAY === "true";
const codes = (process.env.NHAC_HOC || "").split(/\s+/).filter(x => /^HMN[12]\./.test(x));
const dir = new URL("./may/", import.meta.url);
if(fs.existsSync(dir)) for(const f of fs.readdirSync(dir)) if(f.endsWith(".txt")) codes.push(fs.readFileSync(new URL(f, dir), "utf8").trim());

if(!PRIVATE_KEY){ console.log("Chưa có secret VAPID_PRIVATE_KEY — bỏ qua."); process.exit(0); }
if(!codes.length){ console.log("Chưa có máy nào bật nhắc học — bỏ qua."); process.exit(0); }
webpush.setVapidDetails("https://caoviethoang999.github.io/hoc-ngon-ngu/", PUBLIC_KEY, PRIVATE_KEY);

const hourIn = tz => +new Intl.DateTimeFormat("en-GB", {timeZone: tz, hour: "2-digit", hourCycle: "h23"}).format(new Date());
let sent = 0, skipped = 0, failed = 0;
const seen = new Set();
for(const code of codes){
  let c;
  try{ c = docMa(code, PRIVATE_KEY); }catch(e){ console.log("Mã không đọc được, bỏ qua:", code.slice(0, 16) + "…"); failed++; continue; }
  if(seen.has(c.e + c.L)) continue; seen.add(c.e + c.L);
  const h = hourIn(c.tz || "Asia/Ho_Chi_Minh");
  if(!FORCE && !(c.h || []).includes(h)){ skipped++; continue; }
  try{
    await webpush.sendNotification({endpoint: c.e, keys: c.k}, JSON.stringify({L: c.L}), {TTL: 3 * 3600, urgency: "normal"});
    console.log("Đã gửi nhắc", c.L, "máy", c.d || "?", "lúc", h + "h"); sent++;
  }catch(e){
    failed++;
    const gone = e.statusCode === 404 || e.statusCode === 410;
    console.log(gone ? "Máy " + (c.d || "?") + " đã tắt hoặc gỡ thông báo (" + c.L + "): bật lại nhắc trong app." : "Gửi lỗi (" + c.L + "): " + (e.statusCode || "") + " " + (e.body || e.message));
  }
}
console.log("Kết quả:", sent, "đã gửi,", skipped, "chưa tới giờ,", failed, "lỗi.");
