-- Mỗi dòng: một mốc nhắc của một máy cho một ngôn ngữ.
CREATE TABLE IF NOT EXISTS moc (
  id TEXT NOT NULL,          -- băm của địa chỉ nhận thông báo + ngôn ngữ
  endpoint TEXT NOT NULL,    -- địa chỉ nhận thông báo của trình duyệt (do Google/Apple/Mozilla/Microsoft cấp)
  lang TEXT NOT NULL,        -- jp | kr | en
  t TEXT NOT NULL,           -- giờ địa phương HH:MM
  days TEXT NOT NULL,        -- ngày trong tuần, 0 = Thứ 2, ví dụ "0,1,2,3,4"
  tz TEXT NOT NULL,          -- múi giờ, ví dụ Asia/Ho_Chi_Minh
  utc_min INTEGER NOT NULL,  -- phút trong ngày theo giờ UTC, để tìm nhanh mỗi phút
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS moc_utc ON moc (utc_min);
CREATE INDEX IF NOT EXISTS moc_id ON moc (id);
-- Nhật ký 3 ngày gần nhất để kiểm tra khi thông báo không đến (không chứa địa chỉ đầy đủ).
CREATE TABLE IF NOT EXISTS nhat_ky (ts INTEGER NOT NULL, loai TEXT NOT NULL, id TEXT, host TEXT, ket_qua TEXT);
CREATE INDEX IF NOT EXISTS nhat_ky_ts ON nhat_ky (ts);
