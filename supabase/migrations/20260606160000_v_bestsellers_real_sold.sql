-- Phase 6 — Ressuscite v_bestsellers.sold_30d à partir des VENTES réelles.
-- Depuis le drop des `orders` (20260527110000), sold_30d valait 0 pour tous les
-- produits → le tri "bestsellers" tombait sur is_featured/created_at. Désormais
-- on a une vraie source de ventes : les réservations `collected` (= retirées).
--
-- sold_30d = somme des quantités des reservation_items dont la réservation est
-- collected dans les 30 derniers jours (collected_at). Lignes libres
-- (product_id NULL, ventes comptoir hors catalogue) ignorées.
--
-- La vue reste en SECURITY DEFINER (reloptions vide, défaut) : l'agrégat doit
-- être calculé pour anon (home/catalogue) en bypassant la RLS de
-- reservation_items. La vue n'expose QUE des colonnes produit + un compteur —
-- aucune donnée perso de réservation. CREATE OR REPLACE préserve les GRANTs.

CREATE OR REPLACE VIEW v_bestsellers AS
SELECT
  p.id, p.name, p.slug, p.description, p.price, p.currency,
  p.stock, p.is_active, p.created_at, p.updated_at,
  p.volume, p.pharmacist_advice, p.pharmacist_name,
  p.benefits, p.usage, p.inci, p.technical_pdf_url,
  p.skin_type, p.texture, p.old_price, p.is_new, p.is_featured,
  COALESCE(s.sold_30d, 0)::bigint AS sold_30d
FROM products p
LEFT JOIN (
  SELECT ri.product_id, SUM(ri.quantity) AS sold_30d
  FROM reservation_items ri
  JOIN reservations r ON r.id = ri.reservation_id
  WHERE r.status = 'collected'
    AND r.collected_at > now() - interval '30 days'
    AND ri.product_id IS NOT NULL
  GROUP BY ri.product_id
) s ON s.product_id = p.id
WHERE p.is_active IS DISTINCT FROM false
ORDER BY
  COALESCE(s.sold_30d, 0) DESC,
  p.is_featured DESC NULLS LAST,
  p.created_at DESC;
