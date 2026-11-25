// Gửi thông báo nhắc học tới các máy đã bật nhắc.
// Mỗi dòng trong secret NHAC_HOC là một mã "HMN1.…" do app tạo khi bấm "Bật nhắc học".
import webpush from "web-push";

const PUBLIC_KEY = "BEWtPm4FRTaujmsXT1ycCEMf5RPODwB-n7aqq-WW1aVA_YL1ZTT7j38jaIDu48vVbuhxpC1f1XjBwJDDF98VuRw";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const CODES = (process.env.NHAC_HOC || "").split(/\s+/).filter(x => x.startsWith("HMN1."));
const FORCE = process.env.GUI_NGAY === "true";

if(!PRIVATE_KEY){ console.log("Chưa có secret VAPID_PRIVATE_KEY — bỏ qua."); process.exit(0); }
if(!CODES.length){ console.log("Chưa có mã nào trong secret NHAC_HOC — bỏ qua."); process.exit(0); }
webpush.setVapidDetails("https://caoviethoang999.github.io/hoc-ngon-ngu/", PUBLIC_KEY, PRIVATE_KEY);

const hourIn = tz => +new Intl.DateTimeFormat("en-GB", {timeZone: tz, hour: "2-digit", hourCycle: "h23"}).format(new Date());
let sent = 0, skipped = 0, failed = 0;
for(const code of CODES){
  let c;
  try{ c = JSON.parse(Buffer.from(code.slice(5).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")); }
  catch(e){ console.log("Mã không đọc được, bỏ qua:", code.slice(0, 16) + "…"); failed++; continue; }
  const h = hourIn(c.tz || "Asia/Ho_Chi_Minh");
  if(!FORCE && !(c.h || []).includes(h)){ skipped++; continue; }
  try{
    await webpush.sendNotification({endpoint: c.e, keys: c.k}, JSON.stringify({L: c.L}), {TTL: 3 * 3600, urgency: "normal"});
    console.log("Đã gửi nhắc", c.L, "lúc", h + "h"); sent++;
  }catch(e){
    failed++;
    const gone = e.statusCode === 404 || e.statusCode === 410;
    console.log(gone ? "Máy này đã tắt hoặc gỡ thông báo (" + c.L + "): bật lại nhắc trong app rồi cập nhật NHAC_HOC." : "Gửi lỗi (" + c.L + "): " + (e.statusCode || "") + " " + (e.body || e.message));
  }
}
console.log("Kết quả:", sent, "đã gửi,", skipped, "chưa tới giờ,", failed, "lỗi.");
