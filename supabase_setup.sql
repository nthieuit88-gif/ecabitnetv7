-- SCRIPT CẤU HÌNH STORAGE & REALTIME & SECURITY (V6.2)

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
BEGIN;
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

-- 3. CẤU HÌNH DATABASE & RLS (QUAN TRỌNG CHO LỖI LOGIN)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_session_id text;

-- Enable RLS on users table if not already
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can read users (needed for login check and user list)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public Read Users') THEN
        CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
    END IF;
END
$$;

-- Policy 2: Allow users to update their own session_id (Fixes the "Cannot enter web" issue)
-- Note: In a real app, you would use (auth.uid() = id), but for this hybrid demo we allow public update to ensure functionality
-- or specifically allow updating 'current_session_id' for everyone to support the session logic.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow Session Update') THEN
        CREATE POLICY "Allow Session Update" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- Policy 3: Allow Insert for registration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow Insert') THEN
        CREATE POLICY "Allow Insert" ON public.users FOR INSERT WITH CHECK (true);
    END IF;
END
$$;
