CREATE TABLE public.price_items (
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
CREATE POLICY "own price items" ON public.price_items FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);