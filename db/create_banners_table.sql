-- Script SQL pour créer la table bannières
-- Exécuter dans Supabase SQL Editor

-- Créer la table bannières
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    link_text VARCHAR(100),
    banner_type VARCHAR(20) NOT NULL DEFAULT 'image_left' 
        CHECK (banner_type IN ('image_left', 'image_right', 'image_full')),
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    click_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur position pour l'ordre d'affichage
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);

-- Créer un index sur is_active pour les requêtes de bannières actives
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);

-- Créer un index composé pour les bannières actives ordonnées
CREATE INDEX IF NOT EXISTS idx_banners_active_position ON banners(is_active, position);

-- Créer une fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger pour mettre à jour updated_at
CREATE TRIGGER update_banners_updated_at 
    BEFORE UPDATE ON banners 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer quelques données de test
INSERT INTO banners (title, description, image_url, link_url, link_text, banner_type, position, is_active, start_date) VALUES
('Promo Été 2024', 'Jusqu''à 30% de réduction sur tous les produits solaires', '/image/femme_produit_bras.png', '/catalogue?category=solaire', 'Voir les produits', 'image_left', 1, true, CURRENT_DATE),
('Nouveau Sérum Anti-Âge', 'Découvrez notre nouveau sérum révolutionnaire avec des résultats visibles en 4 semaines', '/image/produit_test.png', '/product/serum-anti-age', 'Découvrir', 'image_right', 2, true, CURRENT_DATE),
('Expertise FARMAU', 'Nos pharmaciens-dermatologues vous accompagnent avec des conseils personnalisés', '/image/equipe.png', '/contact', 'Prendre rendez-vous', 'image_full', 3, true, CURRENT_DATE);

-- Créer les politiques RLS (Row Level Security)
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture publique des bannières actives
CREATE POLICY "Public can view active banners" ON banners
    FOR SELECT USING (is_active = true);

-- Politique pour admin (lecture/écriture complète)
CREATE POLICY "Admin can manage all banners" ON banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@farmau.com'
        )
    );

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE banners IS 'Table pour gérer les bannières affichées sur le site';
COMMENT ON COLUMN banners.banner_type IS 'Type de bannière: image_left, image_right, image_full';
COMMENT ON COLUMN banners.position IS 'Position d''affichage (ordre croissant)';
COMMENT ON COLUMN banners.click_count IS 'Nombre de clics sur la bannière';
COMMENT ON COLUMN banners.view_count IS 'Nombre d''affichages de la bannière'; 