-- Migration : autoriser les réservations manuelles (créées par l'admin)
--
-- Contexte : l'écran /admin/reservations expose un bouton « Nouvelle manuelle »
-- pour enregistrer une réservation au nom d'un client walk-in / téléphone qui
-- n'a PAS de compte. Or jusqu'ici :
--   - reservations.user_id est NOT NULL REFERENCES auth.users  -> impossible sans compte
--   - reservations.contact_email est NOT NULL                 -> walk-in sans email impossible
--
-- On relâche ces deux contraintes (changement purement additif) :
--   - user_id devient NULLABLE. La FK ON DELETE CASCADE reste (NULL = pas de
--     référence à vérifier). La policy RLS « Users read own reservations »
--     (auth.uid() = user_id) ne matche jamais une ligne user_id IS NULL → les
--     réservations manuelles restent invisibles côté compte client (admin-only,
--     via supabaseAdmin service-role qui bypasse RLS). Le partial unique index
--     uniq_active_reservation_per_user(user_id) WHERE status IN (pending,confirmed)
--     traite les NULL comme distincts (NULLS DISTINCT par défaut) → plusieurs
--     réservations manuelles actives sont autorisées.
--   - contact_email devient NULLABLE (téléphone reste obligatoire pour le WhatsApp).
--
-- Le flux client normal (RPC create_reservation) fournit toujours user_id +
-- email : il n'est pas affecté.

ALTER TABLE public.reservations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reservations ALTER COLUMN contact_email DROP NOT NULL;

COMMENT ON COLUMN public.reservations.user_id IS
  'Compte client propriétaire. NULL pour les réservations manuelles créées par l''admin (client walk-in / téléphone sans compte).';
COMMENT ON COLUMN public.reservations.contact_email IS
  'Email de contact (snapshot). Peut être NULL pour une réservation manuelle walk-in.';
