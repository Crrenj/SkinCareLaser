-- Script pour créer des bannières de démonstration
-- À exécuter dans Supabase SQL Editor

-- Supprimer les bannières existantes de test
DELETE FROM banners WHERE title LIKE 'Test%' OR title LIKE 'Démo%';

-- Insérer des bannières de démonstration
INSERT INTO banners (title, description, image_url, link_url, link_text, banner_type, position, is_active, start_date) VALUES

-- Bannière image à gauche
('Promo Été 2024', 
 'Profitez de jusqu''à 30% de réduction sur tous nos produits solaires. Protection optimale pour votre peau pendant les vacances.', 
 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop&crop=center',
 '/catalogue?category=solaire', 
 'Voir les produits', 
 'image_left', 
 1, 
 true, 
 CURRENT_DATE),

-- Bannière image à droite
('Nouveau Sérum Anti-Âge', 
 'Découvrez notre nouveau sérum révolutionnaire avec des résultats visibles en 4 semaines. Technologie avancée pour une peau plus jeune.', 
 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=300&fit=crop&crop=center',
 '/catalogue?category=serum', 
 'Découvrir', 
 'image_right', 
 2, 
 true, 
 CURRENT_DATE),

-- Bannière image pleine largeur
('Expertise FARMAU', 
 'Première pharmacie 100% dermatologique de République Dominicaine. Nos experts vous accompagnent pour une peau parfaite.', 
 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=500&fit=crop&crop=center',
 '/a-propos', 
 'En savoir plus', 
 'image_full', 
 3, 
 true, 
 CURRENT_DATE);

-- Vérifier les bannières créées
SELECT id, title, banner_type, position, is_active FROM banners ORDER BY position; 