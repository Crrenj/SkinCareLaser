-- Script pour mettre à jour les types de bannières
-- À exécuter dans Supabase SQL Editor

-- Supprimer l'ancienne contrainte
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_banner_type_check;

-- Ajouter la nouvelle contrainte avec les nouveaux types
ALTER TABLE banners ADD CONSTRAINT banners_banner_type_check 
CHECK (banner_type IN ('image_left', 'image_right', 'image_full', 'card_style', 'minimal', 'gradient_overlay'));

-- Mettre à jour le commentaire
COMMENT ON COLUMN banners.banner_type IS 'Type de bannière: image_left, image_right, image_full, card_style, minimal, gradient_overlay';

-- Insérer des exemples des nouveaux styles
INSERT INTO banners (title, description, image_url, link_url, link_text, banner_type, position, is_active, start_date) VALUES

-- Style carte
('Produit Vedette', 
 'Découvrez notre produit le plus populaire avec des résultats exceptionnels.', 
 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop&crop=center',
 '/catalogue', 
 'Voir le produit', 
 'card_style', 
 10, 
 true, 
 CURRENT_DATE),

-- Style minimal
('Conseil Expert', 
 'Nos dermatologues recommandent cette routine pour une peau éclatante.', 
 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=64&h=64&fit=crop&crop=center',
 '/a-propos', 
 'En savoir plus', 
 'minimal', 
 11, 
 true, 
 CURRENT_DATE),

-- Style gradient overlay
('Nouvelle Collection', 
 'Explorez notre nouvelle gamme de soins anti-âge avec des ingrédients innovants.', 
 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=400&fit=crop&crop=center',
 '/catalogue?collection=antiage', 
 'Découvrir la collection', 
 'gradient_overlay', 
 12, 
 true, 
 CURRENT_DATE);

-- Vérifier les nouveaux types
SELECT id, title, banner_type, position, is_active FROM banners WHERE banner_type IN ('card_style', 'minimal', 'gradient_overlay') ORDER BY position; 