# Học Nhật · Hàn · Anh

Web app luyện tiếng Nhật, tiếng Hàn, tiếng Anh mỗi ngày. Mở một lần khi có mạng, cài lên máy (Chrome/Edge/Android: nút **Cài lên máy**; iPhone: Safari → Chia sẻ → Thêm vào MH chính), sau đó dùng được cả khi không có mạng.

- `nhat/` — Luyện tiếng Nhật mỗi ngày, Nihongo N5 N4 N3, kho từ vựng/kanji/ngữ pháp, luyện viết kana kanji
- `han/` — Luyện tiếng Hàn mỗi ngày, ngữ pháp và từ vựng, luyện viết Hangeul
- `anh/` — Luyện tiếng Anh mỗi ngày, ngữ pháp và từ vựng A1–C2

Tiến độ học lưu trong trình duyệt của từng máy.

Nguồn dữ liệu và giấy phép ghi ở cuối từng trang. Phông chữ trong `fonts/` theo SIL Open Font License (gói Fontsource).

## Nhắc học

Người dùng bật nhắc học ngay trong app (tab **Kế hoạch** → **Nhắc học**): chọn giờ, chọn ngày, bấm **Bật nhắc học**, cho phép thông báo.

Thông báo do một máy chủ nhỏ trên Cloudflare Workers gửi (`worker/`). Máy chủ chỉ lưu địa chỉ nhận thông báo của trình duyệt và giờ nhắc, không lưu tên, email hay tiến độ học. Workflow **Cài máy chủ nhắc học** tự cài máy chủ khi `worker/` thay đổi và ghi địa chỉ vào `nhac-hoc.json`. Cần 3 secret: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VAPID_PRIVATE_KEY`.
