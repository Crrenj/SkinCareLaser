-- Configuration boutique : nom, coordonnées, point de retrait, tarifs livraison.
--
-- Pattern single-row : la table contient toujours exactement une ligne
-- (id = 1, garanti par un CHECK). L'admin édite cette ligne via
-- /admin/settings au lieu de toucher au code / aux constantes.
--
-- Lecture publique (les pages /livraison, /pharmacies, /contact en ont
-- besoin pour afficher les infos boutique). Écriture admin uniquement.

CREATE TABLE IF NOT EXISTS public.shop_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- Identité boutique
  shop_name TEXT NOT NULL DEFAULT 'FARMAU',
  shop_tagline TEXT,

  -- Contacts
  contact_email TEXT,
  contact_phone TEXT,
  whatsapp_number TEXT,

  -- Point de retrait principal (single pickup pour l'instant — on peut
  -- migrer vers une table pickup_locations plus tard si besoin).
  pickup_name TEXT,
  pickup_address TEXT,
  pickup_hours TEXT,
  pickup_phone TEXT,

  -- Tarifs livraison (en DOP, entiers)
  shipping_santo_domingo INTEGER NOT NULL DEFAULT 300,
  shipping_interior INTEGER NOT NULL DEFAULT 600,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Insertion de la ligne unique avec valeurs par défaut alignées sur ce qui
-- était hardcodé jusqu'ici (Cerros de Gurabo Santiago, +1 809 412 2468).
INSERT INTO public.shop_settings (
  id,
  shop_name, shop_tagline,
  contact_email, contact_phone, whatsapp_number,
  pickup_name, pickup_address, pickup_hours, pickup_phone,
  shipping_santo_domingo, shipping_interior
)
VALUES (
  1,
  'FARMAU', 'La pharmacie dermatologique de référence en République Dominicaine',
  'contact@farmau.do', '+1 809 724 3940', '+18094122468',
  'Farmacia FARMAU Cerros de Gurabo',
  'Calle Jesús de Galíndez Esq. Calle 3, Cerros de Gurabo · Santiago',
  'Lun-Vie 6h30-17h · Sáb 8h-16h',
  '+1 809 724 3940',
  300, 600
)
ON CONFLICT (id) DO NOTHING;

-- updated_at trigger (réutilise la fonction existante update_updated_at_column
-- déjà déclarée dans le baseline et corrigée search_path session 7).
DROP TRIGGER IF EXISTS shop_settings_updated_at ON public.shop_settings;
CREATE TRIGGER shop_settings_updated_at
  BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS : lecture publique (anon + authenticated), écriture admin uniquement.
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read shop_settings" ON public.shop_settings;
CREATE POLICY "Public read shop_settings"
  ON public.shop_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin update shop_settings" ON public.shop_settings;
CREATE POLICY "Admin update shop_settings"
  ON public.shop_settings
  FOR UPDATE
  USING (public.is_user_admin((SELECT auth.uid())))
  WITH CHECK (public.is_user_admin((SELECT auth.uid())));

-- Pas de policy INSERT ni DELETE : la ligne unique est créée par cette
-- migration et ne doit jamais être supprimée. Seul le service-role peut
-- bypass RLS si on a besoin de réinitialiser.
