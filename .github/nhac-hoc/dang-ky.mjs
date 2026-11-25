// Lưu hoặc xóa mã nhắc học gửi tới qua issue. Chỉ nhận issue do chủ kho mở.
import fs from "fs";
import {docMa} from "./ma.mjs";

const {ISSUE_TITLE = "", ISSUE_BODY = "", AUTHOR = "", OWNER = "", VAPID_PRIVATE_KEY = "", GITHUB_OUTPUT} = process.env;
const out = (k, v) => fs.appendFileSync(GITHUB_OUTPUT, k + "<<EOF_X\n" + v + "\nEOF_X\n");
const dir = new URL("./may/", import.meta.url);
fs.mkdirSync(dir, {recursive: true});
const NAME = {jp: "tiếng Nhật", kr: "tiếng Hàn", en: "tiếng Anh"};

if(AUTHOR.toLowerCase() !== OWNER.toLowerCase()){ out("msg", "Chỉ chủ kho mới đăng ký nhắc học được. Issue này không được lưu."); out("changed", "no"); process.exit(0); }
if(!VAPID_PRIVATE_KEY){ out("msg", "Kho chưa có secret VAPID_PRIVATE_KEY nên chưa đọc được mã. Thêm secret đó rồi mở lại issue."); out("changed", "no"); process.exit(0); }

const off = /TAT\s+([a-z0-9]{6,16})\s+(jp|kr|en)/.exec(ISSUE_BODY);
if(off){
  const f = new URL(off[1] + "-" + off[2] + ".txt", dir);
  if(fs.existsSync(f)){ fs.unlinkSync(f); out("msg", "Đã tắt nhắc " + NAME[off[2]] + " cho máy " + off[1] + "."); out("changed", "yes"); }
  else { out("msg", "Máy " + off[1] + " chưa bật nhắc " + NAME[off[2]] + ", không có gì để tắt."); out("changed", "no"); }
  process.exit(0);
}
const m = /HMN2\.[A-Za-z0-9_-]+/.exec(ISSUE_BODY);
if(!m){ out("msg", "Không tìm thấy mã nhắc học trong issue."); out("changed", "no"); process.exit(0); }
let c;
try{ c = docMa(m[0], VAPID_PRIVATE_KEY); }catch(e){ out("msg", "Mã không mở được (có thể khóa đã đổi). Bấm Bật nhắc học lại trong app."); out("changed", "no"); process.exit(0); }
if(!/^[a-z0-9]{6,16}$/.test(c.d || "") || !NAME[c.L]){ out("msg", "Mã thiếu thông tin máy hoặc ngôn ngữ."); out("changed", "no"); process.exit(0); }
fs.writeFileSync(new URL(c.d + "-" + c.L + ".txt", dir), m[0] + "\n");
const hrs = (c.h || []).map(h => String(h).padStart(2, "0") + ":00").join(", ");
out("msg", "Đã lưu nhắc " + NAME[c.L] + " cho máy " + c.d + ", giờ nhắc: " + hrs + " (giờ Việt Nam). Muốn thử ngay: tab Actions → Nhắc học → Run workflow.");
out("changed", "yes");
