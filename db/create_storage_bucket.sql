-- ======================================================================
-- Création du bucket pour les images de produits
-- ======================================================================

-- Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-image',
  'product-image', 
  true, -- bucket public
  5242880, -- limite 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[];

-- Créer une policy pour permettre la lecture publique
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-image');

-- Créer une policy pour permettre aux admins d'uploader/modifier/supprimer
CREATE POLICY "Admin can upload" ON storage.objects
FOR INSERT
TO authenticated
USING (
  bucket_id = 'product-image' 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin can update" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-image'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin can delete" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-image'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
); 