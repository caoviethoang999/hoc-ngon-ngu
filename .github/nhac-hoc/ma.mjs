// Đọc mã nhắc học do app tạo.
// HMN2.… : mã đã mã hóa (ECDH P-256 với khóa VAPID của kho + HKDF-SHA256 + AES-256-GCM), chỉ kho này mở được.
// HMN1.… : mã cũ, chưa mã hóa (chỉ dùng khi dán thẳng vào secret NHAC_HOC).
import crypto from "crypto";
const b64 = s => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
export function docMa(code, privateKey){
  if(code.startsWith("HMN1.")) return JSON.parse(b64(code.slice(5)).toString("utf8"));
  if(!code.startsWith("HMN2.")) throw new Error("không phải mã nhắc học");
  const raw = b64(code.slice(5)), eph = raw.subarray(0, 65), iv = raw.subarray(65, 77), ct = raw.subarray(77);
  const ecdh = crypto.createECDH("prime256v1"); ecdh.setPrivateKey(b64(privateKey));
  const key = Buffer.from(crypto.hkdfSync("sha256", ecdh.computeSecret(eph), Buffer.alloc(0), Buffer.from("hmn-nhac-hoc"), 32));
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv); d.setAuthTag(ct.subarray(ct.length - 16));
  return JSON.parse(Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8"));
}
