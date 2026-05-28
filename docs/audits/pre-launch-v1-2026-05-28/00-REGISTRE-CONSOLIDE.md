# Registre consolidé — Audit re-vérification pré-V1 FARMAU

**Date** : 2026-05-28 · **Branche** : `main` · **Mode** : lecture seule (aucune modif code/DB/config) · **Projet Supabase** : `adxpoxcynrpnbbxnncsk`
**Méthode** : 18 workstreams audités en parallèle (1 agent Opus chacun) + recoupement DB live via MCP Supabase **read-only** (`execute_sql` SELECT, `get_advisors`, `cron.job`, `pg_proc`).
**Rapports détaillés** : `WS01..WS18-*.md` dans ce dossier. Ce fichier déduplique et recalibre les sévérités ; le détail (preuves fichier:ligne) vit dans chaque WS.

> **Échelle** : **P0** = bloquant V1 (sécu/PII exposée, argent, perte de données, flow critique cassé, non-conformité RD Ley 172-13/358-05/126-02). **P1** = important, à corriger avant ou juste après lancement. **P2/P3** = mineur / polish / dette.
> Quand un agent et la consolidation divergent sur la sévérité, la valeur retenue ici est justifiée (les WS gardent leur notation d'origine).

---

## 1. Synthèse chiffrée

| Sévérité | Nombre (consolidé, dédupliqué) | Dont confirmés DB live |
|---|---|---|
| **P0** | **3 clusters** | 2 |
| **P1** | ~18 | 6 |
| **P2** | ~55 | 8 |
| **P3 / info** | ~15 | 3 |

**Verdict** : **NO-GO en l'état → GO conditionné** à la correction des 3 clusters P0 + d'un lot P1 court (sécu RPC, contraste, fuite favoris). Détail dans `00-VERDICT-V1.md`.

L'audit historique « 145 findings fermés / sécurité 0 ouvert » **ne tient plus** : la re-vérification confirme les 10 findings RPC du WS03 (2026-05-28) **et en ajoute** (grants DML larges, vues SECURITY DEFINER, bug panier, SSG inexistant, contraste AA, FR-only légal).

---

## 2. Confirmations DB live (ce qui était « suspecté » → tranché)

Source : MCP Supabase read-only, 2026-05-28.

| # | Question | Verdict live | Impacte |
|---|---|---|---|
| DB-A | `anon` peut-il exécuter les RPC panier/messages ? | **OUI** — `proacl` = `anon=X` sur `add_to_cart`, `get_or_create_cart`, `remove_from_cart`(3-arg), `create_contact_message`, `get_messages_stats`, `mark_message_as_read`, `is_user_admin`, `merge_anon_cart_to_user`. Advisor Supabase remonte 11 `anon_security_definer_function_executable`. | WS02/WS03 (F-RPC-1→8) **confirmés** |
| DB-B | RPC sensibles verrouillées ? | **OUI** — `create_reservation`, `check_rate_limit`, `expire_stale_reservations` : `anon=false`, grant `authenticated`/`service_role` only. | WS04 sain confirmé |
| DB-C | Grants table pour `anon` ? | **anon a TOUS les droits** (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) sur `carts`, `cart_items`, `contact_messages`, `profiles`, `reservations`, `newsletter_subscribers`. WS03 supposait « anon = SELECT seul » → **infirmé**. RLS = unique frontière. | **Nouveau systémique (P1)** |
| DB-D | `newsletter_subscribers` accessible anon ? | RLS ON **sans policy** → 0 ligne pour anon/auth malgré le grant ALL ; service_role bypasse. | WS07 « service-role only » confirmé |
| DB-E | `sold_30d` réel ? | **`(0)::bigint` codé en dur** dans `v_bestsellers`. Tri « ventes » = constante. | WS09-05 confirmé |
| DB-F | Trigger de décrément de stock ? | **AUCUN** (seuls triggers `update_updated_at`). Stock jamais réservé/décrémenté. | WS04-04 / WS09-06 confirmés (survente par design) |
| DB-G | `reservations` persiste-t-elle la livraison ? | **NON** — colonnes : status, contact_{phone,email,name}, total_items, **total_price (numeric simple)**, currency, expires_at, admin_notes, confirmed_at, collected_at. Pas d'adresse/zone/frais. | WS04-01 confirmé |
| DB-H | Cron d'expiration actif ? | **OUI** — job `expire-stale-reservations`, `*/5 * * * *`, `active=true`. | WS04-03 résolu (sain) |
| DB-I | `profiles` : PII ? | `display_name, first_name, last_name, phone, birth_date (date), role, preferred_locale`. `is_admin` bien absente (droppée). `birth_date` présent sans finalité claire. | WS06 confirmé |
| DB-J | `newsletter_subscribers` PII rétention ? | colonnes `ip`, `user_agent` (nullable) présentes, `token_expires_at` présent (TTL OK). | WS06-06 confirmé |

### Findings NOUVEAUX issus du recoupement DB (non vus par les agents, sans MCP)

| ID | Sév | Finding | Preuve | Reco |
|---|---|---|---|---|
| **DB-1** | P2 | 2 vues `SECURITY DEFINER` : `v_bestsellers` + `tags_with_types` (advisor **ERROR** `0010`). Elles s'exécutent avec les privilèges du créateur, bypassant la RLS de l'appelant. | `get_advisors(security)` | Recréer en `security_invoker=on` (PG15+) ou documenter. Impact réel faible (products/tags publics) mais erreur advisor à clore. |
| **DB-2** | P1 | `handle_new_user()` **et** `rls_auto_enable()` sont `SECURITY DEFINER` exécutables par `anon`/`authenticated` via `/rest/v1/rpc/*`. `rls_auto_enable` **n'est dans aucune migration du repo** (fonction hors-repo). | `pg_proc` + advisor `0028/0029` | `REVOKE EXECUTE FROM anon, authenticated, PUBLIC` sur `handle_new_user` (doit rester trigger-only). Investiguer/documenter/retirer `rls_auto_enable`. |
| **DB-3** | P2 | Leaked-password protection (HaveIBeenPwned) **désactivée** dans Supabase Auth. | advisor `auth_leaked_password_protection` | Activer dans le dashboard Auth. Recoupe WS03-05 (policy mdp côté serveur). |
| **DB-4** | P1 | Grants DML larges : `anon`/`authenticated` = ALL sur toutes les tables PII. La RLS est la **seule** barrière ; toute table sans RLS ou avec policy permissive = ouverte. | `role_table_grants` | Resserrer les grants baseline (au minimum retirer INSERT/UPDATE/DELETE à `anon` là où seul le service-role écrit) **OU** acter explicitement « RLS-only » et auditer chaque policy. |
| **DB-5** | P2 | 2 buckets storage publics **listables** (`product-image`, `brand-fiche`) : policy SELECT large permet `LIST`. | advisor `0025` | Restreindre la policy au GET d'objet, pas au listing. (= item connu CLAUDE.md + WS03 F-ROUTE-2.) |
| **DB-6** | info | 3 tables `rls_enabled_no_policy` (`admin_users`, `newsletter_subscribers`, `rate_limit_buckets`) — **intentionnel** (service-role only). | advisor `0008` | Aucun (sain). |

---

## 3. P0 — Bloquants V1 (3 clusters)

### P0-1 · Bug panier : la modification de quantité **corrompt** le panier
**Consensus 3 agents** (WS09-01, WS13-01, WS15-01) · **confirmé**.
- Le stepper +/− de `CartLineItem` envoie une **quantité absolue** à `POST /api/cart` → RPC `add_to_cart` qui **incrémente** (`quantity = quantity + EXCLUDED.quantity`, migration `20260519092026`). Cliquer « + » sur une ligne à 1 met **3** en base (1 existant + 2 « nouvelle valeur »).
- L'UI optimiste masque le bug jusqu'à `refreshCart()` → divergence silencieuse, sans erreur HTTP donc **sans rollback**.
- Corollaire (WS09-02, P1) : le garde-fou stock ne valide que le **delta** entrant, jamais le **cumul** → contournable.
- **C'est la cause racine confirmée de la flakiness `cart.spec.ts`** : le test asserte la valeur optimiste (`2`) avant que `refreshCart()` ne révèle `3` → **faux positif** qui masque le bug (WS15-01).
- **Impact** : le panier (porte d'entrée de la réservation) renvoie des quantités fausses → flow critique cassé.
- **Reco** : introduire une RPC/branche `set_cart_quantity` (valeur absolue) distincte de `add_to_cart` (incrément), corriger `useCart.updateQuantity`, puis fixer le test pour asserter après revalidation. **Effort : M.**

### P0-2 · Conformité légale RD : pages légales **FR-only** + liens de consentement **cassés**
WS06-01 (**P0/trivial**) + WS06-02 (**P0/juridique**) · confirmés.
- **WS06-01** : à l'inscription, les liens de consentement pointent vers `/cgv` et `/confidentialite` (→ **404** ; les vraies routes sont `/legal/cgv`, `/legal/confidentialite`). `signup/page.tsx:312-317`. Consentement légalement vicié + lien mort à la création de compte. **Fix : 2 lignes (S).**
- **WS06-02** : les 4 pages `/legal/*` (mentions, CGV, confidentialité, cookies) sont rédigées **en FR uniquement**, sur un marché **RD hispanophone** avec UI ES/EN. Problème de conformité consommateur (Ley 358-05) et d'information (Ley 172-13). **Fix : traduction ES (+EN) + relecture juriste RD (M).**
- **Impact** : un site e-commerce/réservation grand public en RD doit présenter CGV/confidentialité compréhensibles localement et des liens de consentement valides. Bloquant pour un lancement public.

### P0-3 · (Calibrage) — voir note
> Le 3ᵉ « cluster P0 » regroupe les **deux items précédents comme conditions de lancement non négociables**. Aucun autre finding n'atteint le seuil P0 strict (pas de fuite PII de masse, pas de flux argent, pas de perte de données serveur). Les candidats P0 proposés par certains agents (SSG/dynamic → WS12 ; IDOR RPC → WS02) sont **recalibrés P1** ci-dessous, avec justification.

---

## 4. P1 — Importants (à corriger avant / juste après lancement)

| ID consolidé | Source(s) | Finding | Confirmé | Effort | Note de calibrage |
|---|---|---|---|---|---|
| P1-SEC-1 | WS02 F-RPC-1/2, WS03 RPC | **IDOR panier** : `remove_from_cart`/`get_or_create_cart` anon-exécutables font confiance à `p_user_id`/`p_anon_id` client → vider/lire/s'approprier le panier d'autrui. | **OUI (DB live + advisor)** | S (1 migration) | P1 et non P0 : précondition = connaître l'UUID `auth.users.id`/`carts.id` de la victime (non énuméré publiquement). Mais trivial à fermer → **à faire avant launch**. |
| P1-SEC-2 | DB-4 | Grants DML `anon`/`authenticated` = ALL sur tables PII ; RLS = seule barrière. | **OUI** | M | Durcir grants baseline ou acter RLS-only + audit policies. |
| P1-SEC-3 | WS02 F-RPC-3/4/5/6, DB-2 | RPC `add_to_cart`, `create_contact_message`, `mark_message_as_read` (morte), `get_messages_stats`, `handle_new_user`, `rls_auto_enable` anon-exécutables (griefing, injection message, fuite compteurs, sondes). | **OUI** | S | Même migration `REVOKE … FROM anon, PUBLIC` + `GRANT service_role`. `DROP mark_message_as_read`. |
| P1-PERF-1 | WS01-01/02, WS12-01, WS16-02 | **Aucune page publique n'est SSG/ISR** : root `layout.tsx` (`getLocale()`→`cookies()`) + `Footer` (`getShopSettings()`→`cookies()`) forcent tout le site en **dynamic** ; les 14 `revalidate` sont morts. | **OUI (manifest .next/)** | M | P1 (pas P0) : le site **fonctionne**, c'est un coût compute/DB Vercel + latence sous charge. Le système de thèmes est **innocenté**. Fix = répliquer le pattern `getThemeConfig` (anon sans cookies + `unstable_cache`) pour `getShopSettings`, sortir `getLocale()` du root. |
| P1-A11Y-1 | WS11-01 | `text-ink-500` (token color-mix 54%) **échoue le contraste AA 4.5:1 en mode CLAIR** (défaut livré) sur les 6 palettes (2.79–4.23), **344 usages**. La migration `ink-400→500` de l'audit clos a été défaite par le re-calcul color-mix des thèmes. | confirmé (calcul) | S | Ajuster l'ancre `ink-500` dans `globals.css`. Mord en prod **maintenant**. |
| P1-A11Y-2 | WS11-05 | NavSearch (⌘K global) sans sémantique combobox/listbox/`aria-activedescendant` → inutilisable au lecteur d'écran. | confirmé | M | |
| P1-CACHE-1 | WS13-02 | Cache SWR `/api/wishlist` **jamais purgé au changement d'identité** + pas de `revalidateOnFocus` → sur navigateur partagé, l'user B voit les favoris de A (fuite douce PII). | confirmé | S | Purger/`mutate` le cache SWR au login/logout. |
| P1-RES-1 | WS04-01 | Tunnel réservation propose **livraison à domicile** (zones 300/600 DOP) mais adresse/zone/frais **non persistés** (DB-G) ; `total_price` = sous-total ≠ « total » montré au client ; l'admin ne voit ni mode ni adresse. | **OUI (DB live)** | M | Décision produit : persister la livraison **ou** simplifier en pickup-only conforme au discours. |
| P1-OBS-1 | WS14-01 | **Aucun monitoring prod** (pas de Sentry/APM, pas de `global-error.tsx`, pas de `/api/health`) → aveugle sur les erreurs d'une boutique qui prend des réservations. | confirmé | S–M | Plancher : `/api/health` + Vercel alerts ; recommandé : `@sentry/nextjs`. |
| P1-OBS-2 | WS14-02 | `/api/contact` **GET** renvoie `error.message` PG brut à un user authentifié (fuite de structure). | confirmé | S | Message générique. |
| P1-UI-1 | WS10-07→10, WS10-14 | Mode sombre : surfaces `bg-white`/`bg-white` littérales + texte thémé (NavSearch, ContactForm, ProfileEditForm, ProductDetailCard) **illisibles** ; HomeHero hors-thème (hex codés en dur). | confirmé | M | **Garder `default_mode=light` + `allow_visitor_mode=false` pour V1** (atténue, ne corrige pas). |
| P1-EMAIL-1 | WS07-01 | On peut déclencher l'envoi d'un email de confirmation vers une **adresse tierce** (subscription bombing, coût Resend, réputation domaine) — le double opt-in empêche l'abonnement, pas l'envoi. | confirmé | S | Rate-limit par **email cible** en plus de l'IP. |
| P1-EMAIL-2 | WS07-02 | Rate-limit dérivé de `X-Forwarded-For` (spoofable) + fail-open. | suspecté (dépend Vercel) | S | Dériver l'IP de l'en-tête Vercel de confiance ; fail-closed sur la limite. |
| P1-TEST-1 | WS15-03/05 | **0 test unitaire** sur les libs pures critiques (csrf, rateLimit, schemas Zod, formatPrice, slug, catalogueFilters, reservation, seo) ; **6 flux V1 non testés** (thème, newsletter double opt-in, blog/XSS, signup E2E, NavSearch, wishlist auth). | confirmé | M | |
| P1-TEST-2 | WS15-04 | E2E CI dépend de 3 secrets Supabase non vérifiés ; le job reste vert sur placeholders → fausse couverture. | suspecté | S | |
| P1-DOC-1 | WS06-03 | Placeholders d'identité éditeur dans les mentions légales (RNC, capital, représentant légal) — requis Ley 358-05/126-02. | confirmé | S (contenu) | |
| P1-PII-1 | WS06-05 | Droit d'accès/suppression (Ley 172-13) = `mailto:` manuel, sans export ni purge auto. | confirmé | M | |
| P1-PII-2 | WS06-06 | Email de confirmation newsletter **sans lien de désinscription / `List-Unsubscribe`** ; IP/UA stockés sans purge. | confirmé | S | |
| P1-DEP-1 | WS17-01 | `happy-dom@18` CVE critique (VM escape→RCE). **Dev-only** (env test Vitest), non servi en prod. | confirmé | S | Mettre à jour ; pas un bloqueur prod. |
| P1-QUAL-1 | WS18-01 | `LOW_STOCK_THRESHOLD` triple/divergent : `constants.ts`=10 (mort, 0 import) vs `ProductCard`=5 vs `sidebar-stats`=5 hardcodé. | confirmé | S | Centraliser. |

---

## 5. P2 / P3 — par workstream (compact ; détail dans les WS)

> Tous présents dans les rapports WS correspondants avec preuve fichier:ligne.

**WS01 archi** : `generateStaticParams` absent sur pages slug (P2) · `<html lang>` admin via cookie global (P2).
**WS02 backend/db** : `/api/contact` GET renvoie `error.message` PG (P2, = P1-OBS-2) · check stock TOCTOU POST cart (P2) · `merge_anon_cart_to_user` sans `REVOKE PUBLIC` (P2) · `cart_items` INSERT sans cap quantité DB (P2) · F-ROUTE-1 RLS INSERT `contact_messages` trop large (P2, **anon a INSERT** cf DB-C) · F-ROUTE-2 `/api/admin/upload` fileName/contentType client + upsert (P2) · `reorder_banners`/`cleanup_banner_positions` INVOKER anon-exec mais RLS rattrape (P3).
**WS03 auth** : `getSession()` au lieu de `getUser()` sur 4 pages account + reserve (P2) · cookie `cart_id` sans `Secure` prod (P2) · tokens session non-HttpOnly (P2, inhérent @supabase/ssr) · énumération de comptes au signup (P2) · min 8 car. validé client only → activer policy Supabase (P2, cf DB-3).
**WS04 réservation** : transitions de statut non contraintes DB/route (P2) · stock jamais réservé (P2, cf DB-F) · `getSession` (P2) · pré-check « déjà active » non atomique → 500 au lieu de 409 (P3) · confirmation/WhatsApp dépend de sessionStorage (P3).
**WS05 secrets** : pas de barrière `import 'server-only'` sur supabaseAdmin/resend/requireAdmin (P2) · littéral `"SUPABASE_SERVICE_KEY"` (nom, pas valeur) dans bundle admin/setup (P2) · `project_ref` dans historique git (P2 info, non-secret). **Aucun secret exposé.**
**WS06 PII** : re-sub justifié (P2) · `birth_date` sans finalité (P2, cf DB-I) · cookie banner + iframe Maps avant consentement (P2) · mention ITBIS prix (P2) · grant anon newsletter (P3, neutralisé par RLS cf DB-D).
**WS07 email** : `checkOrigin` passe sans header Origin (P2) · pas de `Reply-To`, DKIM/SPF à vérifier hors-repo (P2) · fallback single opt-in silencieux sans clé (P2) · conflit UNIQUE silencieux → non-confirmé jamais relancé (P2) · GET ignore `confirmed_at` (P3) · HTML email non échappé préventif (P3).
**WS08 headers** : **CSP `frame-src` casse Google Maps** sur /contact + /pharmacie (P1→ traité comme P1 fonctionnel) · HSTS absent (P1) · `images.remotePatterns:'**'` (P1, = WS01-04/WS12-04) · `frame-ancestors` absent (P2) · Permissions-Policy à élargir (P2) · COOP absent (P2) · `script-src 'unsafe-inline'/'unsafe-eval'` (P2, unsafe-eval retirable) · cookie cart_id sans Secure (P2) · X-DNS-Prefetch (P3).
**WS09 catalogue** : prix `.toFixed()` brut vs `formatPrice` (P1) · PDP n'affiche jamais promo/old_price (P1) · stock non transmis aux cards /besoins & /marques → « en stock » toujours (P2) · `ilike` `%`/`_` non échappés, pas SQLi (P2) · LOW_STOCK 5 vs 10 (P2, = P1-QUAL-1) · bestsellers home fallback sans `is_active` (P2) · `sold_30d=0` tri ventes (P2, cf DB-E).
**WS10 UI/i18n** : 5 bandes décoratives s'inversent en sombre (P2) · cartes `bg-white` (P2) · skip-link FR en dur (P2) · dates/montants `es-DO` figés (P2). **Parité i18n parfaite 1466×3, 0 texte UI en dur hors /legal.**
**WS11 a11y** : statuts olive/brick/ochre + badges + CTA clay-700 illisibles en **sombre** (P1 sombre ×3, atténués par default_mode=light) · contact/profil sans aria-invalid (P2) · ReservationDrawer/Sidebar mobile/CookieBanner = dialogs partiels (perte `useModalA11y`) (P2) · blog `prose` inerte, plugin typography absent (P2) · cibles 32/36px (P2).
**WS12 perf** : catalogue `.limit(500)` + pagination en mémoire (P1) · 3 libs d'icônes (P2) · `images.remotePatterns:'**'` (P2) · `fetchHomeQuote` `Math.random()` au render (P2) · `generateEtags:false` (P2).
**WS13 cache** : `clearCart` ne détecte pas l'échec partiel des DELETE (P2) · thème pas de propagation in-place + TTL 300s multi-instance (P2) · page cookies décrit `farmau:anonymous_id` obsolète (P3) · optimistic `price:0` fausse le total transitoire (P3). **0 Realtime confirmé.**
**WS14 obs** : 16× `error.message` routes admin (P2, derrière requireAdmin) · logger sérialise PostgrestError (P2, pas de PII en clair) · `global-error.tsx` absent (P2) · `admin/error.tsx` ES hardcodé (P2) · `not-found.tsx` FR/ES mélangés (P3) · logger sans niveau/timestamp/route (P2). **0 console.* résiduel, pas de fuite PII en clair.**
**WS15 tests** : admin-smoke manque annonce/blog/apariencia/setup (P2) · assertion no-op `>=0` besoins (P2) · couplage état DB prod (P2) · cleanupStaleTestUsers jamais appelé (P2) · `test:unit` en watch par défaut (P2) · aucun test parité i18n (P2) · CI e2e chromium seul (P3) · `/api/contact` mocké (P3).
**WS16 build/SEO** : **`src/app/favicon.ico` = favicon Next.js par défaut** servi à `/favicon.ico` (P1, branding/SERP) · pas de JSON-LD `LocalBusiness`/`Pharmacy` (P2) · `CollectionPage.url` relatif (P2) · pas de `twitter:card` (P2) · pages `(auth)` indexables (P2) · `RESEND_API_KEY` absente CI (P2) · pas d'image OG par défaut (P2) · `NEXT_PUBLIC_SITE_URL` absente de `.env.local.example` (P2). **Build sain, blocker not-found levé confirmé.**
**WS17 deps** : postcss 8.4.31 bundlé Next (P2, non déclenchable) · minimatch/picomatch ReDoS dev (P2) · react-icons = 1 glyphe → retirable (P2) · @heroicons consolidable (P2) · `dotenv` mal classé en `dependencies` (P2) · `sharp` transitif non déclaré (P2) · pas d'`engines.node`/`.nvmrc` (P2). **0 CVE prod exploitable, licences toutes permissives.**
**WS18 qualité** : `Intl.NumberFormat` direct + `es-DO` en dur account/reservations (P2) · 2 modules orphelins `useMediaQuery.ts` + `CartIcon.tsx` (P2) · exports morts shipping.ts/userPatch/THEME_BY_SLUG/BannerQuote (P2 suspecté) · `MAX_CART_QUANTITY` + `ADMIN_HOME_PATH` non importés (P2) · `user!` non-null fragile (P2). **tsc 0, ESLint 0, 0 any, 0 console, parité i18n OK — métriques A+ maintenues.**

---

## 6. Thèmes transverses (récurrents inter-WS)

1. **RLS = seule frontière** (DB-C/DB-4) + **RPC SECURITY DEFINER anon-exécutables** (DB-A) : la sécurité backend repose entièrement sur (a) la justesse des policies et (b) le durcissement des grants RPC, jamais fait pour le panier/messages. **1 migration ferme ~8 findings.**
2. **Système de thèmes neuf** : mode **sombre non livrable** (contraste + surfaces blanches + hero hors-thème — WS10/WS11) ; mode **clair** OK sauf `ink-500` (WS11-01). → V1 en `light` forcé.
3. **Tout-dynamic** (WS01/WS12/WS16) : contredit la doc « SSG » ; coût/latence Vercel. Thème innocenté.
4. **Couplage optimistic UI ↔ RPC incrémentale** (WS09/WS13/WS15) : bug panier P0 + flakiness tests + faux positif.
5. **Conformité RD incomplète** (WS06) : FR-only légal, liens cassés, placeholders identité, droits 172-13 manuels.
6. **Observabilité absente** (WS14) : aveugle en prod.

---

## 7. Fausses alarmes / findings infirmés (ne pas traiter)

- **WS18-08** : « 2 helpers FAR dupliqués » → en réalité factorisation correcte (full + compact dans `lib/reservation.ts`). **Invalidé.**
- **WS02 F-RPC-4 (volet énumération)** : la branche d'énumération de comptes citée par WS03 a été supprimée par migration `20260520092235` → reste seulement l'injection de message non-rate-limité (P2). **Nuancé.**
- **WS14 fuite PII logs** : crainte infirmée — 137 call-sites loggent l'objet erreur, jamais email/nom/tel en clair.
- **`reorder_banners`** : a bien un call-site (`banners/route.ts:132`) ; seul `cleanup_banner_positions` est sans call-site code (probable trigger/cron SQL).
- **Système de thèmes accusé de casser le SSG** : **innocenté** (`getThemeConfig` = anon sans cookies + `unstable_cache`, bon modèle).

---

## 8. Points sains confirmés (à ne pas régresser)

- Secrets : `SERVICE_ROLE_KEY`/`RESEND_API_KEY` server-only, absents du bundle client (WS05). `.env.local`/`.mcp.json` jamais committés avec clé.
- Auth : pas de token en localStorage, `getUser()` (JWT validé) sur toutes les décisions critiques, 26 routes `/api/admin/*` gardées `requireAdmin()`, pas d'open-redirect (WS03).
- Réservation : `create_reservation` dérive `auth.uid()` + vérifie propriété cart + snapshot + verrouillée anon=false ; cron actif ; **0 flux argent atteignable** (WS04).
- Double opt-in : token `randomBytes(32)`, TTL vérifié, mono-usage atomique, lien serveur-side, anti-énumération (WS07).
- i18n : parité parfaite 1466×3, admin+blog localisés, 0 texte UI en dur hors /legal (WS10/WS18).
- Qualité : tsc 0 / ESLint 0 / 0 any / 0 console / 0 alert maintenus (WS18). 0 `<img>` brut, images `next/image` (WS12).
- Pas de Realtime (WS13). SEO technique solide : hreflang/x-default/canonical/JSON-LD Product-Article-Collection/sitemap × 3 locales (WS16).
