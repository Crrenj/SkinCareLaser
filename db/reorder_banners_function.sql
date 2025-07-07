-- Fonction pour réorganiser les positions des bannières
-- À exécuter dans Supabase SQL Editor

CREATE OR REPLACE FUNCTION reorder_banners(
    banner_id UUID,
    old_position INTEGER,
    new_position INTEGER
)
RETURNS void AS $$
BEGIN
    -- Si on déplace vers le haut (position plus petite)
    IF new_position < old_position THEN
        -- Décaler vers le bas toutes les bannières entre new_position et old_position-1
        UPDATE banners 
        SET position = position + 1 
        WHERE position >= new_position 
        AND position < old_position 
        AND id != banner_id;
    
    -- Si on déplace vers le bas (position plus grande)
    ELSIF new_position > old_position THEN
        -- Décaler vers le haut toutes les bannières entre old_position+1 et new_position
        UPDATE banners 
        SET position = position - 1 
        WHERE position > old_position 
        AND position <= new_position 
        AND id != banner_id;
    END IF;
    
    -- Mettre à jour la position de la bannière déplacée
    UPDATE banners 
    SET position = new_position 
    WHERE id = banner_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer et réorganiser toutes les positions
CREATE OR REPLACE FUNCTION cleanup_banner_positions()
RETURNS void AS $$
DECLARE
    banner_record RECORD;
    new_pos INTEGER := 1;
BEGIN
    -- Parcourir toutes les bannières triées par position actuelle
    FOR banner_record IN 
        SELECT id FROM banners ORDER BY position ASC, created_at ASC
    LOOP
        UPDATE banners 
        SET position = new_pos 
        WHERE id = banner_record.id;
        
        new_pos := new_pos + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Exécuter le nettoyage initial
SELECT cleanup_banner_positions(); 