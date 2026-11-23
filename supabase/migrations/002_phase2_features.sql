-- =====================================================================
-- Phase 2 Migration: Linked Friends, Chat, Galla, Chores, UPI
-- Run this in the Supabase SQL Editor AFTER the base schema.
-- =====================================================================

-- ─── 1. PROFILES: add upi_id ─────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id text NOT NULL DEFAULT '';

-- Allow any authenticated user to look up other profiles (for @username search)
CREATE POLICY "any auth can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Drop old restrictive policy (keep the new open one)
DROP POLICY IF EXISTS "own profile select" ON public.profiles;

-- ─── 2. FRIENDS: link to app user ────────────────────────────────────
ALTER TABLE public.friends ADD COLUMN IF NOT EXISTS friend_user_id uuid REFERENCES public.profiles(id);
CREATE INDEX IF NOT EXISTS friends_linked_user_idx ON public.friends(friend_user_id);

-- ─── 3. ENTRIES: add dispute status ──────────────────────────────────
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed'
  CHECK (status IN ('pending', 'confirmed', 'disputed', 'settled'));
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS proof_url text DEFAULT '';
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS dispute_reason text DEFAULT '';

-- Linked friend should be able to see entries where they are the linked friend
CREATE POLICY "linked friend can read entries"
  ON public.entries FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR friend_id IN (
      SELECT id FROM public.friends
      WHERE friend_user_id = auth.uid()
    )
  );

-- Linked friend can update entry status (confirm/dispute)
CREATE POLICY "linked friend can update entry status"
  ON public.entries FOR UPDATE TO authenticated
  USING (
    friend_id IN (
      SELECT id FROM public.friends
      WHERE friend_user_id = auth.uid()
    )
  )
  WITH CHECK (
    friend_id IN (
      SELECT id FROM public.friends
      WHERE friend_user_id = auth.uid()
    )
  );

-- Drop old restrictive policy and add new owner one
DROP POLICY IF EXISTS "own entries" ON public.entries;

CREATE POLICY "owner manages entries"
  ON public.entries FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);


-- ─── 4. NOTICES TABLE (Chat, Court Notices, Disputes, Due Requests) ──
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

CREATE POLICY "own notices" ON public.notices FOR ALL TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS notices_receiver_idx ON public.notices(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notices_sender_idx ON public.notices(sender_id, created_at DESC);


-- ─── 5. GALLA (Shared Room Pot) ──────────────────────────────────────
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

-- Galla: members can see/manage everything in their galla
CREATE POLICY "galla owner manages" ON public.galla FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "galla members can read" ON public.galla FOR SELECT TO authenticated
  USING (id IN (SELECT galla_id FROM public.galla_members WHERE user_id = auth.uid()));

CREATE POLICY "galla members manage memberships" ON public.galla_members FOR ALL TO authenticated
  USING (
    galla_id IN (SELECT id FROM public.galla WHERE owner_id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    galla_id IN (SELECT id FROM public.galla WHERE owner_id = auth.uid())
  );

CREATE POLICY "galla members read memberships" ON public.galla_members FOR SELECT TO authenticated
  USING (
    galla_id IN (SELECT galla_id FROM public.galla_members WHERE user_id = auth.uid())
  );

CREATE POLICY "galla members manage entries" ON public.galla_entries FOR ALL TO authenticated
  USING (
    galla_id IN (SELECT galla_id FROM public.galla_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    galla_id IN (SELECT galla_id FROM public.galla_members WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );


-- ─── 6. CHORES TABLE ─────────────────────────────────────────────────
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

CREATE POLICY "own chores" ON public.chores FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
