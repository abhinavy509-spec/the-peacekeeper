-- =====================================================================
-- Hostel Hisaab / The Peacekeeper - Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up or update the database.
-- =====================================================================

-- 1. PROFILES TABLE (Mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  upi_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure upi_id column exists if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id text NOT NULL DEFAULT '';

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile select" ON public.profiles;
CREATE POLICY "any auth can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger to automatically populate profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. FRIENDS TABLE
CREATE TABLE IF NOT EXISTS public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  friend_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '😎',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.friends ADD COLUMN IF NOT EXISTS friend_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friends TO authenticated;
GRANT ALL ON public.friends TO service_role;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own friends" ON public.friends;
CREATE POLICY "own friends" ON public.friends FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS friends_owner_idx ON public.friends(owner_id);
CREATE INDEX IF NOT EXISTS friends_linked_user_idx ON public.friends(friend_user_id);


-- 3. ENTRIES TABLE (Debts, Dues, Splits with Dispute Support)
CREATE TABLE IF NOT EXISTS public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  friend_id uuid NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('debt', 'due', 'split')),
  direction text NOT NULL CHECK (direction IN ('they_owe', 'i_owe')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  note text NOT NULL DEFAULT '',
  group_id uuid,
  settled boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'disputed', 'settled')),
  proof_url text DEFAULT '',
  dispute_reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'disputed', 'settled'));
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS proof_url text DEFAULT '';
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS dispute_reason text DEFAULT '';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO authenticated;
GRANT ALL ON public.entries TO service_role;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own entries" ON public.entries;
DROP POLICY IF EXISTS "owner manages entries" ON public.entries;
CREATE POLICY "owner manages entries" ON public.entries FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "linked friend can read entries" ON public.entries;
CREATE POLICY "linked friend can read entries" ON public.entries FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR friend_id IN (
    SELECT id FROM public.friends WHERE friend_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "linked friend can update entry status" ON public.entries;
CREATE POLICY "linked friend can update entry status" ON public.entries FOR UPDATE TO authenticated
USING (
  friend_id IN (
    SELECT id FROM public.friends WHERE friend_user_id = auth.uid()
  )
)
WITH CHECK (
  friend_id IN (
    SELECT id FROM public.friends WHERE friend_user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS entries_owner_idx ON public.entries(owner_id);
CREATE INDEX IF NOT EXISTS entries_friend_idx ON public.entries(friend_id);


-- 4. PRICE ITEMS TABLE (Canteen / Rate list overrides and custom items)
CREATE TABLE IF NOT EXISTS public.price_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  item_key text NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🧾',
  category text NOT NULL DEFAULT 'custom',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, item_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_items TO authenticated;
GRANT ALL ON public.price_items TO service_role;
ALTER TABLE public.price_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own price items" ON public.price_items;
CREATE POLICY "own price items" ON public.price_items FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);


-- 5. NOTICES TABLE (Chat, Court Notices, Disputes, Due Requests)
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  receiver_id uuid NOT NULL REFERENCES public.profiles(id),
  type text NOT NULL CHECK (type IN ('court_notice', 'chat', 'sticker', 'dispute', 'due_request', 'confirm')),
  message text NOT NULL DEFAULT '',
  sticker text,
  amount numeric(12,2),
  entry_id uuid REFERENCES public.entries(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own notices" ON public.notices;
CREATE POLICY "own notices" ON public.notices FOR ALL TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS notices_receiver_idx ON public.notices(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notices_sender_idx ON public.notices(sender_id, created_at DESC);


-- 6. GALLA (Shared Room Pot)
CREATE TABLE IF NOT EXISTS public.galla (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.galla TO authenticated;
GRANT ALL ON public.galla TO service_role;
ALTER TABLE public.galla ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.galla_members (
  galla_id uuid NOT NULL REFERENCES public.galla(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  PRIMARY KEY (galla_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.galla_members TO authenticated;
GRANT ALL ON public.galla_members TO service_role;
ALTER TABLE public.galla_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.galla_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  galla_id uuid NOT NULL REFERENCES public.galla(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount numeric(12,2) NOT NULL,
  note text DEFAULT '',
  type text NOT NULL CHECK (type IN ('contribute', 'expense')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.galla_entries TO authenticated;
GRANT ALL ON public.galla_entries TO service_role;
ALTER TABLE public.galla_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "galla owner manages" ON public.galla;
CREATE POLICY "galla owner manages" ON public.galla FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "galla members can read" ON public.galla;
CREATE POLICY "galla members can read" ON public.galla FOR SELECT TO authenticated
  USING (id IN (SELECT galla_id FROM public.galla_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "galla members manage memberships" ON public.galla_members;
CREATE POLICY "galla members manage memberships" ON public.galla_members FOR ALL TO authenticated
  USING (
    galla_id IN (SELECT id FROM public.galla WHERE owner_id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    galla_id IN (SELECT id FROM public.galla WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "galla members read memberships" ON public.galla_members;
CREATE POLICY "galla members read memberships" ON public.galla_members FOR SELECT TO authenticated
  USING (
    galla_id IN (SELECT galla_id FROM public.galla_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "galla members manage entries" ON public.galla_entries;
CREATE POLICY "galla members manage entries" ON public.galla_entries FOR ALL TO authenticated
  USING (
    galla_id IN (SELECT galla_id FROM public.galla_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    galla_id IN (SELECT galla_id FROM public.galla_members WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );


-- 7. CHORES TABLE
CREATE TABLE IF NOT EXISTS public.chores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  label text NOT NULL,
  emoji text NOT NULL DEFAULT '🧹',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chores TO authenticated;
GRANT ALL ON public.chores TO service_role;
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own chores" ON public.chores;
CREATE POLICY "own chores" ON public.chores FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
