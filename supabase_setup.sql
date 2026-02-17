-- SCRIPT CẤU HÌNH STORAGE & REALTIME (V6.1)

-- 1. CẤU HÌNH STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'eCabinet Full Access V6'
    ) THEN
        CREATE POLICY "eCabinet Full Access V6"
        ON storage.objects FOR ALL
        USING ( bucket_id = 'documents' )
        WITH CHECK ( bucket_id = 'documents' );
    END IF;
END
$$;

-- 2. CẤU HÌNH REALTIME (QUAN TRỌNG CHO TÍNH NĂNG SINGLE DEVICE)
-- Bắt buộc phải chạy lệnh này thì App mới tự động đá user cũ ra được
BEGIN;
  -- Kiểm tra xem bảng users đã được add vào publication chưa, nếu chưa thì add
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'users'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;
  END
  $$;
COMMIT;

-- 3. Đảm bảo cột current_session_id tồn tại
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_session_id text;
