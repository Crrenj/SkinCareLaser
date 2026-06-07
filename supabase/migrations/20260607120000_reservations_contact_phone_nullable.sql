-- Rend le téléphone client FACULTATIF sur reservations.
-- Permet d'enregistrer une vente comptoir ou une réservation manuelle pour un
-- client anonyme (qui ne laisse aucune coordonnée) : la référence #FAR-… sert
-- d'identifiant. Les flux publics (compte / invité via create_guest_reservation)
-- continuent de fournir un téléphone et sont inchangés.
-- Non destructif : toutes les lignes existantes ont déjà un téléphone.
ALTER TABLE public.reservations ALTER COLUMN contact_phone DROP NOT NULL;
