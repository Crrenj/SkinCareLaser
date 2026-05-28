# WS06 — PII & Conformité RD/RGPD (audit pré-V1, lecture seule)

> Date : 2026-05-28 · Périmètre : minimisation PII, RLS « own », rétention, droits Ley 172-13, info consommateur Ley 358-05, commerce électronique Ley 126-02, consentement cookies/newsletter.
> **Disclaimer** : l'auteur n'est pas avocat. Tout point de droit pur est marqué « à valider par juriste RD ». Tout point nécessitant la DB live (grants, colonnes réelles, default privileges) est marqué « à confirmer DB live » avec la requête exacte.

---

## Verdict

**Conformité technique : correcte sur les fondamentaux, mais NON prête pour V1 à cause de deux blocages.**

- L'architecture PII est saine : RLS « own » sur toutes les tables porteuses de PII, snapshot pattern propre sur `reservations`, table newsletter privée (service-role only), aucun log ne fuit de PII (les `logger.error` passent l'objet `error` Supabase, pas les champs utilisateur en clair — voir WS observabilité pour confirmation fine), pas de tracking tiers.
- **P0-1 : les liens de consentement du signup sont cassés** (`/cgv` + `/confidentialite` au lieu de `/legal/...`) → l'utilisateur accepte des CGU/politique qu'il ne peut pas ouvrir. Vice de consentement (172-13 art. 6 + 358-05 information préalable).
- **P0-2 : pages légales en français uniquement** sur un marché RD hispanophone (locale défaut FR par config mais public cible ES/EN). L'information consommateur (358-05) et la politique de données (172-13) doivent être accessibles dans la langue du consommateur — à valider par juriste RD, mais haut risque.
- Droit à la suppression/accès = `mailto:` manuel uniquement, sans traçabilité ni SLA enforced techniquement. Acceptable pour un V1 click&collect petit volume, mais à documenter et opérationnaliser.
- Newsletter : double opt-in OK quand `RESEND_API_KEY` présente, **mais l'email de confirmation n'a aucun lien de désinscription ni header `List-Unsubscribe`**, et le ré-abonnement authentifié pose `confirmed_at` directement (acceptable car identité prouvée).

Note transversale : la `CLAUDE.md` décrit le contact GET comme lisant la session ; le code réel (`src/app/api/contact/route.ts:120`) lit un `Authorization: Bearer` en header avec le client **anon** + RLS — pas une fuite PII (RLS filtre), mais doc obsolète.

---

## Inventaire PII

| Table | Champs PII | Minim. | Rétention définie | RLS | Notes |
|---|---|---|---|---|---|
| `profiles` | `first_name`, `last_name`, `display_name`, `phone`, `birth_date`, `preferred_locale` | ⚠️ `birth_date` collectée sans finalité claire | Politique dit « 3 ans inactif » — **non automatisé** (à confirmer DB live : pas de cron) | ✅ `View/Update/Create own` + admin (`20260527100000`) | `phone` obligatoire (voir WS06-04). `birth_date` facultative mais sans usage. |
| `auth.users` (Supabase) | email, password hash, `last_sign_in_at`, IP/UA de session | ✅ géré par Supabase | géré par Supabase | géré par Supabase | email = source pour réservation/contact. |
| `contact_messages` | `user_email`, `user_id`, `subject`, `message`, `admin_notes` | ✅ | Politique : 2 ans — **non automatisé** | ✅ admin + `user_email = own email` (`20260527100000:75`) | INSERT RLS large (`user_email IN auth.users`) — voir WS03 F-ROUTE-1 ; non re-traité ici. |
| `newsletter_subscribers` | `email`, `lang`, `ip`, `user_agent`, `confirmation_token`, `token_expires_at`, `confirmed_at` | ⚠️ `ip` + `user_agent` stockés **sans purge définie** | « jusqu'au désabonnement » (email) — IP/UA non couverts | ✅ RLS active **sans policy** (anon/auth = 0 ligne), écriture service-role | Voir WS06-06 (IP/UA rétention). |
| `reservations` | snapshot `contact_phone`, `contact_email`, `contact_name`, `admin_notes` | ✅ snapshot justifié (fige l'état) | Politique : 5 ans (comptable) — **non automatisé**, mais `expires_at` + cron 24h purge les *pending* | ✅ `Users read own` + admin service-role | Pas d'INSERT/UPDATE user (RPC `create_reservation` SECURITY DEFINER, `authenticated` only). |
| `reservation_items` | `product_name` (snapshot produit, pas PII user) | ✅ | suit `reservations` (CASCADE) | ✅ via parent | Aucune PII utilisateur directe. |
| `wishlists` | `(user_id, product_id)` — PII indirecte (préférences santé/peau déduisibles) | ✅ | non définie | ✅ `Users manage own` (`20260527100000:172`) | Données de préférence → potentiellement sensibles (peau/santé) ; pas un blocage V1. |
| `carts` / `cart_items` | `user_id` ou `anonymous_id` (UUID cookie) | ✅ | non définie | ✅ « own » (user_id OU claim JWT `anonymous_id`) | Voir WS03 pour les RPC panier exposées à anon. |
| `rate_limit_buckets` | clé `endpoint:ip` (IP en clair dans la PK) | ⚠️ IP en clair | ✅ purge probabiliste >1h | RLS active sans policy (service-role) | Transitoire — acceptable. |
| `admin_users` | `user_id` admin | ✅ | n/a | ✅ via `is_user_admin` | — |

**PII collectée mais sans finalité explicite** : `birth_date`. Le formulaire signup la propose (facultative), `handle_new_user` la persiste, mais aucune fonctionnalité ne la consomme. → minimisation 172-13 art. 5 (« données adéquates, pertinentes et non excessives »).

---

## Conformité par loi

### Ley 172-13 (Protection des données personnelles)

| Exigence | État | Preuve |
|---|---|---|
| Information préalable / politique de confidentialité | ⚠️ Existe mais **FR seulement** + liens consentement cassés | `legal/confidentialite/page.tsx`, signup `:312-317` |
| Base légale par traitement | ✅ Documentée (tableau finalités) | `confidentialite/page.tsx:77-113` |
| Droit d'accès / rectification | ⚠️ Rectification OK (ProfileEditForm). Accès/export = `mailto:` manuel | `SecurityActions`, `account/security/page.tsx:111` |
| Droit à la suppression (oubli) | ⚠️ `mailto:` manuel, non tracé, pas de purge auto | `account/security/page.tsx:112-116` |
| Droit à la portabilité | ❌ Aucun export de données | — |
| Consentement retirable (newsletter) | ⚠️ DELETE auth-only ; **pas de lien désinscription dans l'email** | `api/newsletter/route.ts:158`, email `:104-119` |
| Sécurité (chiffrement, RLS) | ✅ TLS, RLS « own », rate-limit, search_path durci | RLS migrations, `confidentialite:220` |
| Rétention / purge | ⚠️ Durées **documentées mais non automatisées** (sauf réservations pending) | `confidentialite:158-192` |
| Transferts internationaux | ✅ Déclarés (Supabase SG/US, Vercel US) | `confidentialite:148-156` |
| Mineurs (< 18 ans) | ⚠️ Clause d'exclusion, mais `birth_date` facultative ⇒ pas de blocage technique | `confidentialite:240-246`, signup `:253` |

### Ley 358-05 (Protection du consommateur)

| Exigence | État | Preuve |
|---|---|---|
| Identité de l'éditeur (RNC, capital, repr. légal) | ❌ **Placeholders `[à compléter]`** | `mentions-legales/page.tsx:52-55` |
| Prix TTC + ITBIS affiché | ✅ Mention « TTC, ITBIS 18 % inclus » | `cgv/page.tsx:116-123` ⚠️ à confirmer que l'affichage produit le reflète (prix = 100 DOP placeholder) |
| Information produit (INCI, usage, contre-indic.) | ⚠️ Cadre OK mais champs vides en DB sur 353 produits | `cgv:159-171` |
| Droit de rétractation / annulation | ✅ Annulation pré-retrait gratuite ; pas de vente en ligne donc rétractation N/A | `cgv:145-157` |
| Conditions de retrait / paiement | ✅ Click&collect, paiement en pharmacie décrit | `cgv:116-143` |
| Coordonnées de réclamation | ✅ Email + WhatsApp | `mentions-legales:59-65` |

### Ley 126-02 (Commerce électronique / signature numérique)

| Exigence | État | Preuve |
|---|---|---|
| Qualification du service (pas de vente à distance) | ✅ Explicitement « pas de transaction financière à distance » | `cgv:45-57` |
| Hébergeur identifié | ✅ Vercel + Supabase, adresses | `mentions-legales:76-93` |
| Formation/preuve du contrat | ✅ « vente formée au retrait » → 126-02 sur la vente à distance largement N/A | `cgv:96-100` |
| Conservation preuve réservation | ✅ Snapshot + référence `FAR-XXXXXXXX` | `reservations_schema.sql` |

→ 126-02 est le moins exposé : le modèle click&collect évite la signature numérique et le paiement à distance. **À valider par juriste RD** : la qualification exacte d'une « réservation » avec référence persistée vis-à-vis de 126-02.

---

## Findings

### WS06-01 · **P0** · Liens de consentement cassés au signup · confirmé
**Preuve** : `src/app/[locale]/(auth)/signup/page.tsx:312` `<Link href="/cgv">` et `:317` `<Link href="/confidentialite">`. Les routes réelles sont `/legal/cgv` et `/legal/confidentialite` (`src/app/[locale]/legal/`). Avec `localePrefix:'always'`, le `Link` next-intl produit `/{locale}/cgv` → **404**. (Le Footer, lui, pointe correctement vers `/legal/*` — `Footer.tsx:123-124`.)
**Impact** : l'utilisateur « accepte » des CGU et une politique de confidentialité qu'il ne peut pas consulter → consentement non éclairé (172-13 art. 6 ; 358-05 information préalable). Risque juridique direct sur la validité de tous les comptes créés.
**Reco** : remplacer par `href="/legal/cgv"` et `href="/legal/confidentialite"`.
**Effort** : trivial (2 lignes).

### WS06-02 · **P0** · Pages légales en FR uniquement sur marché RD hispanophone · confirmé (droit : à valider juriste)
**Preuve** : les 4 pages `legal/*/page.tsx` ont leur contenu en dur en français (`intro`, `LegalSection` title/body). Seuls `title`/`description` SEO sont traduits (`Legal.pageMeta.*`). UI tri-langue mais corps juridique mono-langue. HANDOFF le note déjà comme « bloqueur prod ».
**Impact** : 358-05 (information consommateur) et 172-13 (information du traité de données) exigent une information compréhensible par le destinataire. Marché cible RD = espagnol. Un hispanophone consent à un texte FR → opposabilité fragile.
**Reco** : traduire ES (prioritaire) puis EN les 4 pages + le `CookieBanner`. Faire relire par un juriste RD (le disclaimer « à valider par juriste » est déjà présent dans le contenu).
**Effort** : moyen (traduction + relecture juridique).

### WS06-03 · **P1** · Placeholders d'identité éditeur dans les mentions légales · confirmé
**Preuve** : `mentions-legales/page.tsx:52-55` — `RNC : [à compléter]`, `Capital social : [à compléter]`, `Représentant légal : [Nom, qualité]`, et même « FARMAU SRL (à confirmer) » `:47`.
**Impact** : 358-05 impose l'identification complète du fournisseur (RNC notamment en RD). Mentions incomplètes = non-conformité.
**Reco** : renseigner RNC réel, raison sociale exacte, représentant légal avant V1.
**Effort** : faible (contenu fourni par le client).

### WS06-04 · **P1** · Téléphone obligatoire — minimisation à justifier · confirmé
**Preuve** : obligatoire à 3 niveaux — `signup/page.tsx:57`, `ProfileEditForm.tsx:52`, RPC `create_reservation` ERRCODE P0002 (`rpc_create_reservation.sql:64`). Stocké dans `profiles.phone` + snapshot `reservations.contact_phone`.
**Impact** : la minimisation (172-13 art. 5) tolère une donnée obligatoire **si elle est nécessaire à la finalité**. Ici le téléphone sert au contact WhatsApp pour la collecte → finalité réelle. Mais il est exigé **au signup** (avant toute réservation), donc collecté même pour un simple compte favoris/newsletter.
**Reco** : soit rendre le téléphone obligatoire **au moment de réserver** seulement (déjà le cas côté RPC), soit documenter explicitement la finalité dans la politique (déjà mentionné « contact WhatsApp »). Acceptable si la finalité est assumée ; sinon découpler signup/réservation.
**Effort** : faible (décision produit) à moyen (refacto formulaire).

### WS06-05 · **P1** · Droit d'accès/suppression = `mailto:` manuel, non opérationnalisé · confirmé
**Preuve** : `account/security/page.tsx:111-121` — unique mécanisme = lien `mailto:skin@skinlacercenter.net` pré-rempli. Aucun export de données (portabilité 172-13 absente). Aucune purge auto des comptes inactifs (rétention « 3 ans » documentée mais non implémentée — à confirmer DB live : pas de cron de purge profils).
**Impact** : 172-13 garantit accès, rectification, suppression, portabilité dans un délai (la politique annonce 30 jours, `confidentialite:212`). Le `mailto:` n'enregistre rien, ne garantit pas le délai, dépend d'un traitement manuel.
**Reco** : V1 acceptable avec un registre interne des demandes + procédure documentée. Post-V1 : route `/api/account/delete` (soft-delete + anonymisation) et `/api/account/export` (JSON). À valider par juriste RD pour le délai/process.
**Effort** : moyen (post-V1).

### WS06-06 · **P1** · Newsletter — IP/UA stockés sans purge + email de confirmation sans lien de désinscription · confirmé
**Preuve** : `newsletter_subscribers.ip` + `user_agent` persistés à l'insert (`api/newsletter/route.ts:75-85`), aucune durée de rétention pour ces champs (la politique ne couvre que « l'inscription jusqu'au désabonnement », `confidentialite:185`). L'email de confirmation (`:104-119`) ne contient **ni lien de désinscription ni header `List-Unsubscribe`**.
**Impact** : (a) IP = donnée personnelle (172-13) conservée sans base/durée → minimisation. (b) Bonne pratique anti-spam + 172-13 : tout email marketing doit offrir un retrait simple en un clic. Le désabonnement existe uniquement via `/account` connecté (DELETE auth-only) — inaccessible à un abonné non-membre.
**Reco** : (a) justifier la rétention IP/UA (preuve de consentement) avec une durée + purge, ou ne stocker que la date+méthode de consentement. (b) Ajouter un lien `/api/newsletter/unsubscribe?token=...` public + header `List-Unsubscribe` aux emails.
**Effort** : moyen.

### WS06-07 · **P2** · Ré-abonnement authentifié contourne le double opt-in · confirmé (faible risque)
**Preuve** : `api/newsletter/route.ts:69` `useDoubleOptIn = !!resend && !!body.email` ; le flow sans `body.email` (re-sub depuis `/account/preferences`, session connue) pose `confirmed_at` directement `:80`.
**Impact** : acceptable car l'identité de l'email est prouvée par la session — pas d'opt-in d'un tiers. À noter pour cohérence documentaire.
**Reco** : RAS (comportement justifié). Documenter dans la politique que l'abonnement depuis le compte est un consentement direct.
**Effort** : nul.

### WS06-08 · **P2** · `birth_date` collectée sans finalité · confirmé
**Preuve** : `signup/page.tsx:253`, `handle_new_user_phone_metadata.sql:28`, `ProfileEditForm.tsx:214`. Aucun consommateur applicatif (grep : pas d'usage métier de `birth_date`).
**Impact** : minimisation 172-13. La politique la mentionne « facultative », mais collecter sans usage est excessif. Sert potentiellement à vérifier la majorité (clause 18 ans `cgv:54`) mais ce n'est pas implémenté.
**Reco** : soit retirer le champ, soit l'utiliser réellement (contrôle 18 ans) et le documenter.
**Effort** : faible.

### WS06-09 · **P2** · Cookie banner sans granularité ni gestion post-choix · confirmé (cohérent avec « cookies essentiels uniquement »)
**Preuve** : `CookieBanner.tsx` — boutons « accepter/rejeter » écrivent `farmau:cookies:consent` en localStorage ; aucun choix réel n'est appliqué (pas de tracking à bloquer). Pas de re-accès au choix (pas de lien « gérer les cookies »). L'iframe Google Maps (Contact/À propos) peut poser des cookies tiers **avant** consentement (`cookies/page.tsx:116-128` le reconnaît).
**Impact** : faible. Tant qu'il n'y a aucun cookie non essentiel (confirmé : pas de GA/Plausible/Matomo), le bandeau est purement informatif et 172-13 n'exige pas de consentement préalable pour l'essentiel. **Mais** Google Maps en iframe dépose des cookies tiers sans consentement → à surveiller.
**Reco** : V1 OK. Si Maps reste, charger l'iframe en lazy/post-consentement ou via lien externe. Ajouter un point d'entrée « gérer mes cookies » dans le footer pour rouvrir le bandeau.
**Effort** : faible.

### WS06-10 · **P2** · Affichage prix ITBIS — mention CGV vs réalité produit · suspecté
**Preuve** : CGV affirme « DOP, TTC, ITBIS 18 % inclus » (`cgv:116-123`). Mais les 353 produits sont à **100 DOP placeholder** (CLAUDE.md / HANDOFF). Aucune mention « TTC/ITBIS inclus » sur la fiche produit ou le panier n'a été vérifiée dans ce WS.
**Impact** : 358-05 exige un prix final clair au consommateur. La promesse CGV doit être tenue à l'affichage.
**Reco** : à confirmer côté UI (ProductClient/CartClient — hors périmètre WS06) qu'une mention « ITBIS inclus » accompagne le prix. Renseigner les prix réels avant V1.
**Effort** : faible (UI) + contenu.

### WS06-11 · **P3** · `newsletter_subscribers` — exposition anon à confirmer DB live · suspecté
**Preuve** : baseline `GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon` (`baseline.sql:611`) s'exécute **avant** la création de `newsletter_subscribers` (migration ultérieure `20260520085055`), et **aucun `ALTER DEFAULT PRIVILEGES`** n'existe (grep : 0 résultat). Donc anon ne devrait PAS avoir le grant SELECT sur cette table ; et même si elle l'avait, RLS active sans policy ⇒ 0 ligne. Double protection plausible.
**Impact** : nul si confirmé. PII (emails) protégée.
**Reco** : confirmer en DB live le grant réel.
**Effort** : nul.
**Requête de confirmation** :
```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'newsletter_subscribers' AND grantee IN ('anon','authenticated');
-- attendu : aucune ligne pour anon (ou si présente, RLS sans policy neutralise)
SELECT polname, cmd FROM pg_policies WHERE tablename = 'newsletter_subscribers';
-- attendu : aucune policy
```

---

## Tableau récap

| ID | Sév. | Sujet | Loi | Statut |
|---|---|---|---|---|
| WS06-01 | **P0** | Liens consentement signup cassés (`/cgv`→`/legal/cgv`) | 172-13, 358-05 | confirmé |
| WS06-02 | **P0** | Pages légales FR seulement (marché ES) | 172-13, 358-05 | confirmé (droit à valider) |
| WS06-03 | P1 | Placeholders identité éditeur (RNC, capital) | 358-05 | confirmé |
| WS06-04 | P1 | Téléphone obligatoire au signup — minimisation | 172-13 | confirmé |
| WS06-05 | P1 | Accès/suppression = mailto manuel, pas d'export ni purge auto | 172-13 | confirmé |
| WS06-06 | P1 | Newsletter : IP/UA sans purge + email sans lien désinscription | 172-13 | confirmé |
| WS06-07 | P2 | Re-sub authentifié contourne double opt-in (justifié) | 172-13 | confirmé |
| WS06-08 | P2 | `birth_date` collectée sans finalité | 172-13 | confirmé |
| WS06-09 | P2 | Cookie banner sans granularité + iframe Maps pré-consentement | 172-13 | confirmé |
| WS06-10 | P2 | Mention ITBIS CGV vs affichage produit | 358-05 | suspecté |
| WS06-11 | P3 | Grant anon sur `newsletter_subscribers` | 172-13 | suspecté |

**Bloquants V1** : WS06-01 (fix trivial) + WS06-02 (traduction + relecture juriste). Les P1 sont à traiter avant ou juste après le lancement selon arbitrage juridique RD.

---

## À confirmer DB live (requêtes exactes)

```sql
-- 1. Colonnes réelles de profiles (vérifier birth_date, preferred_locale, is_admin droppée)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Grants anon/authenticated sur tables PII
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('newsletter_subscribers','contact_messages','profiles','reservations','rate_limit_buckets')
  AND grantee IN ('anon','authenticated')
ORDER BY table_name, grantee;

-- 3. Policies effectives sur les tables PII
SELECT tablename, polname, cmd, qual
FROM pg_policies
WHERE tablename IN ('profiles','contact_messages','newsletter_subscribers','reservations','reservation_items','wishlists','carts','cart_items');

-- 4. Cron de purge ? (rétention 172-13 — attendu : seul expire-stale-reservations)
SELECT jobname, schedule, command FROM cron.job;

-- 5. Présence réelle de colonnes ip/user_agent + remplissage newsletter
SELECT COUNT(*) AS total, COUNT(ip) AS with_ip, COUNT(user_agent) AS with_ua
FROM public.newsletter_subscribers;

-- 6. Réservations : PII snapshot conservée combien de temps ? (rétention 5 ans annoncée, non auto)
SELECT MIN(created_at), MAX(created_at), COUNT(*) FROM public.reservations;
```
