# 00 — Registre consolidé · Audit complet FARMAU (2026-06-05)

Registre maître de **tous** les findings des 38 rapports `WS01..WS38`, **dédupliqués** par cause racine et triés P0→P1→P2→P3. Chaque entrée cite toutes les sources WS d'origine entre parenthèses.

> Source : 38 workstreams (Opus 4.8, lecture seule, recoupé en DB live `adxpoxcynrpnbbxnncsk` + `npm run build`/`vitest`/`tsc`). Contrat : [`_BRIEF.md`](./_BRIEF.md). Synthèse exécutive : [`00-VERDICT.md`](./00-VERDICT.md).

## Tally de sévérité

| Sévérité | Brut (somme des 38 rapports) | Après déduplication |
|---|---|---|
| **P0** | 0 | **0** |
| **P1** | 47 | **24** |
| **P2** | 165 | **105** |
| **P3** | 191 | **~96** (18 entrées agrégées) |
| **Total** | **403** | **~225** |

- **0 P0** : confirmé en relisant les 38 rapports (chaque ligne « Synthèse » porte `P0=0`). Aucun bloqueur dur (pas d'auth-bypass, pas d'IDOR exploitable via l'app, pas d'injection, pas de secret exposé, pas de flux cœur cassé, build vert).
- La dédup P2 (105) regroupe surtout des doublons franchement transverses (rendu dynamique, formatage devise, `MAX_CART_QUANTITY`, `getSession` vs `getUser`, `dangerouslySetInnerHTML`, contraste) ; beaucoup de findings P2 restent **locaux à une seule WS** et ne se dédupliquent donc pas.
- Le poids P1 (24 après dédup) se concentre sur **5 clusters transverses** (rendu dynamique/données figées, livraison vestigiale, coordonnées de contact, validation produit, sur-vente panier) + **scripts cassés** + **tests/CI** + **hygiène repo**. Détail dans `00-VERDICT.md`.
- Note : les 2 lignes `C-99`/`C-102` du tableau P2 sont des **placeholders de dédup** (fusionnés dans C-27/C-33) et ne comptent pas — 107 lignes affichées − 2 = 105 entrées réelles.

La déduplication regroupe par **cause racine** : p.ex. `getShopSettings` qui avale `DynamicServerError` (1 cause) génère ~6 findings WS distincts → 1 entrée. La sévérité retenue = la plus haute parmi les sources, sauf si la lecture croisée la requalifie (notée le cas échéant).

---

## Table principale (dédupliquée, triée P0→P3)

### P0 — Bloquant

_Aucun._ Les 38 workstreams rapportent `P0=0`. (Détail rassurant : voir « Ce qui est sain » dans `00-VERDICT.md`.)

### P1 — Majeur

| ID | Sév | Thème | Titre | Fichier:ligne | Sources WS | Confiance |
|---|---|---|---|---|---|---|
| C-01 | P1 | perf/data/archi | `getShopSettings` lit `cookies()` ET **avale** le `DynamicServerError` → pages publiques figées SSG sur **données FALLBACK** (contacts factices : WhatsApp `/contact`, tél/email absents) ; `revalidate` mort ; Footer impacté sur ~9 pages | `src/lib/getShopSettings.ts:45-63` (+ `supabaseServer.ts:10`, `Footer.tsx:58`) | WS35-01, WS06-01, WS07-05, WS11-01, WS01-01(home), WS02-05(catalogue) | haute |
| C-02 | P1 | perf/archi | `revalidate` mort sur blog/marques/besoins (+ N+1 `/marques` ~50 req rejoué à chaque hit) : client cookie force le dynamique | `marques/page.tsx:11,46-125` · `blog/page.tsx:10` · `blog/[slug]/page.tsx:13` · `besoins/[slug]/page.tsx:10` | WS10-01, WS35-02 | haute |
| C-03 | P1 | perf | `catalogue` : fetch **500 produits joints** + faceting O(n) à chaque rendu pour 24 cartes | `catalogue/page.tsx:91-116` + `lib/catalogueFilters.ts:146-181` | WS35-04, WS02-04(P2) | haute |
| C-04 | P1 | perf | `product/[slug]` « similaires » : télécharge **50 produits complets** pour en garder 2 | `product/[slug]/page.tsx:214-234` | WS35-03 | haute |
| C-05 | P1 | logique-métier/data | **Livraison vestigiale** contredit click&collect : frais (300/600 DOP) affichés+chiffrés dans tunnel & WhatsApp mais **jamais persistés** (`total_price`=sous-total), total client≠admin, adresse/note en sessionStorage seulement | `api/cart/reserve/route.ts:78-81` · `lib/whatsapp.ts:45-81` · `ShippingStep.tsx:42-67` · `ReservationSummary.tsx` · `ConfirmationRecap.tsx` | WS05-01, WS05-02, WS34-03, WS34-04, WS28-02, WS03-01(trust signals) | haute |
| C-06 | P1 | bug/data | CTA WhatsApp confirmation **mort** : `NEXT_PUBLIC_WHATSAPP_NUMBER` jamais fournie (absente `.env.local.example` + CLAUDE.md) → lien bascule en `/contact` silencieusement | `lib/whatsapp.ts:39,87-92` · `.env.local.example` | WS28-01, WS05-05(P2), WS38-03, WS34(hors-périmètre) | haute (sauf si défini sur Vercel) |
| C-07 | P1 | data/bug | Coordonnées de contact **placeholder/contradictoires** : email légal `skin@skinlacercenter.net` (typo probable `c`→`s` + domaine tiers) vs `contact@farmau.do` (DB) ; `tel:+18091234567` bidon en confirmation ; 4 jeux d'horaires divergents | `legal/*` (toutes) · `account/security:112` · `WhatsappHero.tsx:61` · FAQ/about messages | WS07-01, WS07-02, WS05-03, WS06-02, WS06-03, WS07-06, WS09-05(corps) | haute (divergence) / moyenne (typo domaine) |
| C-08 | P1 | sécurité | **Open-redirect** au signup auto-login : check inline `startsWith('/')&&!startsWith('//')` plus faible que `safeRedirectPath` (laisse passer `/\evil.com`) | `(auth)/signup/page.tsx:134-139` | WS23-01, WS08-02(P2), WS37-05 | haute |
| C-09 | P1 | sécurité/data | **Mass-assignment produit** : POST valide Zod mais déstructure le `body` brut + schéma `.passthrough()` ; PATCH **aucune** validation Zod → toute colonne écrasable, prix/stock non bornés | `api/admin/products/route.ts:79-83,130-136` · `products/[id]/route.ts:16-106` | WS20-01, WS20-02, WS25-01, WS14-02, WS14-03 | haute |
| C-10 | P1 | i18n | Module admin **réservations** entièrement en **espagnol en dur** (5 fichiers + `types.ts` : tabs, table, statuts, drawer, bulk, ~40 chaînes) | `components/admin/reservations/{FilterBar,ReservationsTable,ReservationDrawer,BulkActionBar,types}` | WS30-01, WS16-01 | haute |
| C-11 | P1 | sécurité | Export CSV newsletter **divulgue l'IP** des abonnés (PII / Ley 172-13) — colonne `ip` dans CSV + JSON, aucune utilité | `api/admin/newsletter/route.ts:32,53-62` | WS21-01 (+ WS18-hors-périmètre : `escapeCsv` ne neutralise pas l'injection de formule `=/+/-/@`) | haute |
| C-12 | P1 | seo/i18n | **hreflang mensonger blog** : post mono-langue (`posts.locale`, 3 posts tous `es`) annoncé FR+ES+EN ; même contenu servi sous 3 canonicals ; répliqué dans le sitemap | `blog/[slug]/page.tsx:34-37,50-55` · `sitemap.ts:107-124` | WS10-02, WS31-01 | haute |
| C-13 | P1 | logique-métier/bug | **Sur-vente panier** : POST `/api/cart` valide le **delta** vs stock, jamais le **cumul** (`add_to_cart` incrémente) → panier > stock figeable en réservation | `api/cart/route.ts:197-204` + RPC `add_to_cart` | WS22-02(P2), WS34-01, WS37-06(trou de test) | haute |
| C-14 | P1 | a11y | `BlogClient` **jette le `dialogRef`** de `useModalA11y` → focus-trap mort, focus initial absent, focus non restauré (seul des 14 consommateurs) | `components/admin/blog/BlogClient.tsx:63,220-221` | WS32-01, WS29-03, WS19-01(P2) | haute |
| C-15 | P1 | a11y | **Dark mode WCAG** : CTA primaire `bg-clay-700 text-sand-50` < seuil sur 4/6 thèmes (2.7–4.4) ; `text-clay-800/900` dérivés vers `#000` → invisibles en dark (27 usages) | `globals.css:24,111-112,154-194` | WS33-01, WS33-02 | haute |
| C-16 | P1 | bug/data | **Scripts seed cassés** : `seed-import.cjs` écrit `products.image_url` (colonne droppée → 0 produit importé) **et** `product_ranges` (table droppée, `range_id` jamais posé) | `scripts/seed-import.cjs:259-301` | WS36-01, WS36-02 | haute (DB live) |
| C-17 | P1 | bug/data | **Bootstrap admin cassé** : `create-admin-user.js` + `make-existing-user-admin.js` écrivent `profiles.is_admin` (colonne droppée) → `throw` avant l'insert `admin_users` | `scripts/create-admin-user.js:91-100` · `make-existing-user-admin.js:40-49` | WS36-03 | haute (DB live) |
| C-18 | P1 | bug (futur)/CI | `admin-smoke.spec.ts` **cassé** : attend `/admin/product` post-login, le code va sur `/admin` (`ADMIN_HOME_PATH` changé `ea67dc9`) → tout le describe échoue, job e2e rouge | `tests/admin-smoke.spec.ts:42,49` | WS37-01 | haute |
| C-19 | P1 | sécurité/data/dette | **CI e2e écrit en PROD** : un seul projet Supabase, `createTestUser`/`create_reservation` créent de vrais users/réservations ; secrets non gatés → CI rouge/instable + pollution | `.github/workflows/ci.yml:46-75` · `tests/_helpers/test-users.ts` | WS37-02 | haute |
| C-20 | P1 | dette/sécurité/archi | **`venv/` commité** : 1010 fichiers (67 % du repo, 491 `.pyc`), inutile (0 `.py`/`requirements`), non ignoré, fuite du chemin home `/Users/juan/...` | `venv/**` · `.gitignore` | WS38-01, WS38-10 | haute |
| C-21 | P1 | sécurité/dette | **8 vulns npm** (2 critical `vitest`/`happy-dom`, 2 high `picomatch`/`minimatch`, 4 moderate) ; job CI `npm audit` en `continue-on-error` | `package.json:53-72` · `ci.yml:27-29` | WS38-02 | haute |
| C-22 | P1 | sécurité | **Grants TABLE larges** : `anon`+`authenticated` ont `arwdDxtm` (ALL) sur toutes les tables sensibles → RLS = **unique** barrière (fragile) ; `REVOKE` default-ACL `supabase_admin` incomplet | `baseline.sql:611-612` · `20260605120000:27-29` | WS24-01, WS24-02 | haute (ACL live) |
| C-23 | P1 | bug/data | `useAuth` ne gère pas le switch d'identité **A→B** (sans SIGNED_OUT) : merge panier + purge wishlist SWR sautés → fuite favoris cross-compte sur navigateur partagé | `hooks/useAuth.ts:49-53` | WS29-01 | moyenne |
| C-24 | P1 | bug | Accueil **sans `<h1>`** si l'admin désactive la section `hero` (`home_layout`) → le seul `<h1>` vit dans `HomeHero` | `[locale]/page.tsx:151,198-202` · `HomeHero.tsx:32` | WS32-06, WS01-10(P3) | haute |

### P2 — Mineur

| ID | Sév | Thème | Titre | Fichier:ligne | Sources WS | Confiance |
|---|---|---|---|---|---|---|
| C-25 | P2 | bug | `buildPageRange` duplique un numéro de page sur les 3 dernières pages → tuile en double + collision de clé React (pages 13-15) | `catalogue/CataloguePagination.tsx:13-31` | WS02-01 | haute |
| C-26 | P2 | data/bug | Image produit **non déterministe** : `product_images` lu sans `.order()` (table sans colonne d'ordre) — latent (0 produit multi-image) | `catalogue/page.tsx:104` · `[locale]/page.tsx:244,259` · `besoins/[slug]:56` | WS02-02, WS01-04, WS02(hors-périmètre) | haute |
| C-27 | P2 | logique-métier/data | `formatPrice` défaut **2 décimales** → DOP en `100.00` côté client (tunnel/WhatsApp) vs `100` côté admin ; PDP en `toFixed(0)` → 3 conventions | `lib/formatPrice.ts:20` · ProductClient/Cart*/whatsapp/Confirmation | WS28-03, WS34-06, WS03-10, WS15-06 | haute |
| C-28 | P2 | logique-métier/bug | `MAX_CART_QUANTITY` (99) **jamais appliqué** (serveur ni UI) ; steppers bornent à `stock||99` (rupture → 99) ; magic number dispersé | `lib/constants.ts:15` · `api/cart/route.ts:176,256` · `CartLineItem.tsx:44` · `PdpQuantity.tsx:12` | WS34-02, WS22-03, WS04-03, WS03-05, WS29(hors-périmètre) | haute |
| C-29 | P2 | sécurité | Gate `/account/*` sur `getSession()` (cookie non validé) au lieu de `getUser()` — incohérent avec middleware/requireAdmin ; `user!` → 500 si gate contourné | `account/layout.tsx:17-24` · pages enfant `user!.id` | WS23-02, WS09-01, WS09-07 | haute (incohérence) / moyenne (exploit) |
| C-30 | P2 | sécurité | `/api/cart/reserve` + pages réservation utilisent `getSession()` au lieu de `getUser()` (mitigé par RLS + RPC qui re-dérive `auth.uid()`) | `cart/reserve/route.ts:30` · `reservation/page.tsx:40-42` · `confirmation/[id]/page.tsx:31-33` | WS22-07(P3), WS05-07, WS24(hors-périmètre) | moyenne |
| C-31 | P2 | sécurité | **Open-redirect profil** : `?from=` passé brut à `router.push` sans `safeRedirectPath` (utilisé partout ailleurs) | `ProfileEditForm.tsx:101-103` ← `account/profile/page.tsx:50,84` | WS08-01, WS09-02 | haute (guard manquant) / moyenne (exploit next-intl) |
| C-32 | P2 | sécurité | Mots de passe faibles/compromis acceptés (gate = longueur ≥8 seule) ; advisor `auth_leaked_password_protection` **off** | `(auth)/signup/page.tsx:59` · config Supabase Auth | WS08-03, WS24-07 | haute |
| C-33 | P2 | bug | reset-password : erreur de lien expiré en **hash-flow** non détectée (scan query only) | `(auth)/reset-password/page.tsx:30-67` | WS08-04 | moyenne |
| C-34 | P2 | archi/perf | Signup : double écriture profil (metadata + UPDATE redondant) qui court contre le trigger `handle_new_user` | `(auth)/signup/page.tsx:113-126` | WS08-05 | haute |
| C-35 | P2 | a11y | Chips de filtres desktop sans `aria-pressed` (état toggle invisible aux AT) — mobile l'a | `catalogue/CatalogueSidebar.tsx:126-138` | WS02-03 | haute |
| C-36 | P2 | a11y | Drawer panier monté en permanence (`translate-x-full`) → contrôles focusables/annoncés quand fermé (pas d'`inert`/`aria-hidden`) | `CartDrawer.tsx:53-130` ← `NavBar.tsx:454` | WS04-05, WS32-03 | haute |
| C-37 | P2 | a11y | `SearchOverlay` : recherche live **sans** pattern combobox ni ↑/↓ ni focus-trap ; promesse doc « ↑↓ ↵ » non tenue | `nav/SearchOverlay.tsx:174-189,202-248` | WS11-03, WS32-04 | haute |
| C-38 | P2 | a11y | Méga-menus NavBar : `role="menu"` sans `menuitem` ni roving ↑/↓ (contrat ARIA non tenu) | `NavBar.tsx:177,258,309,350` | WS11-04, WS32-08(P3) | haute |
| C-39 | P2 | a11y | `ContactForm` n'annonce pas succès/erreur (pas d'`aria-live`/`role=alert`) ; `HelpForm` le fait | `ContactForm.tsx:70-88` | WS07-04, WS32-05 | haute |
| C-40 | P2 | a11y/bug | `useModalA11y` re-piège à chaque re-render parent (dep `onClose` non mémoïsé) → vol de focus + restauration cassée sur ~12 modales | `hooks/useModalA11y.ts:76` + call-sites admin/Nav | WS29-02, WS32-02, WS14(positif nuancé) | haute (mécanisme) / moyenne (fréquence) |
| C-41 | P2 | i18n | Cart drawer public : compteur d'articles en **espagnol en dur** (`producto/productos`) alors que `Cart.drawerProductsCount` ICU existe | `cart/CartDrawerSummary.tsx:32` | WS04-06, WS30-02 | haute |
| C-42 | P2 | i18n/a11y | aria-labels en **dur** (EN) sur composants publics : `StepIndicator` « reservation steps » + `Breadcrumb` « Breadcrumb » | `reservation/StepIndicator.tsx:30` · `Breadcrumb.tsx:21` | WS30-03, WS05-11(P3), WS11-07(P3), WS03(hors-périmètre) | haute |
| C-43 | P2 | logique-métier/UX | CookieBanner : bouton « Refuser non-essentiels » trompeur (aucun cookie non-essentiel, `rejected` ne bloque rien) | `CookieBanner.tsx:51-57,79-85` | WS07-03 | haute |
| C-44 | P2 | logique-métier | Footer affiche des **badges de paiement** (Visa/MC/PayPal/Azul) alors que click&collect sans paiement en ligne | `Footer.tsx:131` | WS11-06(P3) | moyenne |
| C-45 | P2 | data/logique | Favoris : produits désactivés disparaissent silencieusement (RLS), compteur incohérent, pas de purge des lignes orphelines | `favoris/page.tsx:63-95,107` | WS10-07 | moyenne |
| C-46 | P2 | seo | Pages d'**auth sans métadonnées** ni `noindex` (Client Components, pas de `(auth)/layout`) → titres dupliqués indexables ; `PageMeta.login/signup` inutilisés | `(auth)/{login,signup,forgot,reset}/page.tsx` | WS31-02 | haute |
| C-47 | P2 | seo | `robots.txt` `disallow:/account/` **inopérant** sur URLs préfixées locale (`/fr/account/...`) ; confirmation réservation sans ligne robots | `robots.ts:11-18` | WS31-03 | haute |
| C-48 | P2 | seo | Aucune **Twitter Card** + aucune **image OG par défaut** (home/catalogue/éditoriales sans visuel social) | `app/layout.tsx:37-45` + pages statiques | WS31-04, WS06-10(P3), WS10-03(P2) | haute |
| C-49 | P2 | seo | hreflang multi-langues sur **pages légales** non traduites (cookies/mentions FR-only, cgv/confid `en`→FR) | `legal/cookies/page.tsx:22-25` + autres | WS31-05, WS07-09(intentionnel) | moyenne |
| C-50 | P2 | seo | Manque JSON-LD **FAQPage** (`/faq`) + **LocalBusiness/Pharmacy** (`/pharmacie`,`/contact`) — rich-results locaux perdus | `faq/page.tsx` · `pharmacie/page.tsx` · `a-propos/page.tsx` | WS06-07, WS06-08, WS31(hors-périmètre) | haute |
| C-51 | P2 | i18n | Liens internes FAQ non préfixés par la locale (`<a href="/...">` brut en `dangerouslySetInnerHTML`) → perte de locale ES/EN | `faq/page.tsx:98-103` | WS06-05 | moyenne |
| C-52 | P2 | dette/data | WhatsApp/numéros codés en dur au lieu de `shop_settings` : FAQ `wa.me/18094122468`, users admin sans normalisation E.164 | `faq/page.tsx:122` · `UsersClient.tsx:187-197` | WS06-06, WS18-04 | haute / moyenne |
| C-53 | P2 | data/logique | `/admin/settings` PATCH : **aucune validation** format (email/tél/WhatsApp) ni Zod → typo casse les liens publics silencieusement | `api/admin/settings/route.ts:58-101` | WS17-05, WS25-06(P3) | haute |
| C-54 | P2 | sécurité (XSS DiP) | Bannières : `title` (HTML via `dangerouslySetInnerHTML`) + `link_url` (href) **non assainis** au rendu public ; `link_url` non validé URL/scheme (admin-only) | `banners/BannerEditorial.tsx:68-79` · `BannerHero.tsx:55-66` · `schemas.ts:74-111` | WS12-02, WS25-04, WS15(hors-périmètre) | haute |
| C-55 | P2 | bug/logique | CTA bannière **cassé pour URL externe** : `Link` next-intl préfixe la locale → `/{locale}/https://...` (404) | `banners/BannerEditorial.tsx:78-79` · `BannerHero.tsx:65-66` · `[locale]/page.tsx:171` | WS12-01 | haute |
| C-56 | P2 | bug/archi | Pas de `global-error.tsx` : une erreur du root layout (I/O `getThemeConfig`) n'a pas de filet stylé | `app/layout.tsx:52-91` (absence `global-error`) | WS12-04 | haute |
| C-57 | P2 | logique-métier/data | « Valor stock » dashboard additionne des prix **placeholder** (100 DOP) → KPI faux ; caveat seulement si 100 % placeholder | `_dashboard/data.ts:300` · `InventoryWidget.tsx:84-90` | WS13-03 | moyenne |
| C-58 | P2 | logique-métier | Tendances/conversion dashboard sur fenêtres temporelles incohérentes (jour partiel, cohortes mélangées) | `RevenueWidget.tsx:40-42` · `_dashboard/data.ts:42-68` | WS13-04 | moyenne |
| C-59 | P2 | bug/data | Génération slug **vide** pour noms non-latins → collision UNIQUE ; products n'intercepte pas 23505 (500 opaque) ; pas de dédup | `lib/slug.ts:6-13` ← 3 modaux | WS14-01, WS28-04 | moyenne / haute |
| C-60 | P2 | bug | `parseFloat`/`parseInt` non gardés (prix/stock/qty) → `NaN`→`null`→500 opaque ; saut à 0/1 en cours d'édition | `ProductFormModal.tsx:171,185` · `StockEditModal.tsx:61` | WS14-04, WS15-11(P3), WS16-07 | haute |
| C-61 | P2 | i18n | `TagSelector` titre « Tags du produit » FR en dur (pas de `useTranslations`) | `admin/product/_components/TagSelector.tsx:18` | WS14-05 | haute |
| C-62 | P2 | a11y/dette | `TagSelector` : `text-white` littéral (contraste non garanti) + `text-md` inexistante (Tailwind v4) | `TagSelector.tsx:16,44` | WS14-06 | haute |
| C-63 | P2 | sécurité (XSS DiP) | `BrandsTable` empty-state via `dangerouslySetInnerHTML` sur `t.raw('emptyState')` (anti-pattern, i18n statique) | `marques/_components/BrandsTable.tsx:59` | WS14-07 | haute (pattern) / basse (exploit) |
| C-64 | P2 | bug/logique | Listes statiques admin (brands/tags/types) chargées **une fois au mount** → gamme/tag fraîche invisible côté formulaire produit (pas de refresh) | `admin/product/_hooks/useProductsData.ts:56-77` | WS14-08 | moyenne |
| C-65 | P2 | perf/UX/a11y | Tables admin : `loading=true` à chaque frappe (pas de debounce) → spinner clignotant, fetch par caractère (produits/stock/users/newsletter) | `useProductsData.ts:27-53` · `useStockData.ts:19-42` · `UsersClient.tsx:59-61` · `NewsletterClient.tsx:51-53` | WS14-09, WS15-04, WS18-05(P3) | haute |
| C-66 | P2 | bug | `search` injecté brut dans l'URL sans `encodeURIComponent` (`&/#/+/%` cassent) | `useProductsData.ts:31` | WS14-10 | haute |
| C-67 | P2 | logique-métier/data | `swapPositions` bannières : 2 PUT parallèles double-appliquent `reorder_banners` → dérive de positions (≥3 bannières) ; pas de `UNIQUE` sur `position` | `annonce/_hooks/useBannersData.ts:61-92` + route PUT | WS15-01, WS15-13(P3) | moyenne |
| C-68 | P2 | i18n | `BannerDeleteModal` 100 % espagnol en dur + ment (« impresiones se perderán », tracking dormant) | `annonce/_components/BannerDeleteModal.tsx:47-66` | WS15-02 | haute |
| C-69 | P2 | i18n/a11y | Icônes tags (labels FR), `ColorPicker` aria-label FR, hint TagModal ES — en dur dans UI tri-langue | `tags/_lib/icons.ts:63-88` · `ColorPicker.tsx:21` · `TagModal.tsx:107` | WS15-03 | haute |
| C-70 | P2 | perf/bug | `HomeLayoutPanel` : `useEffect` de fetch dépend de `t` → re-fetch + **perte des réorganisations** en cours si re-render | `components/admin/HomeLayoutPanel.tsx:21-29` | WS15-05 | moyenne |
| C-71 | P2 | sécurité | POST création réservation admin renvoie le **message Postgres brut** au client (contourne `apiError`) | `api/admin/reservations/route.ts:138-141,161` | WS16-02, WS21-06 | haute |
| C-72 | P2 | perf/logique | Bulk advance/cancel réservations : N PATCH + N refetch complets séquentiels, échec partiel non géré | `admin/reservations/page.tsx:255-275` | WS16-03 | haute |
| C-73 | P2 | perf | Réservations admin : pagination/recherche/tri 100 % client (charge tout le statut, `all` charge tout) + 2ᵉ scan complet pour compteurs | `admin/reservations/page.tsx:48-110` · `api/admin/reservations/route.ts:35-77` | WS16-04, WS35-07 | haute |
| C-74 | P2 | logique-métier/data | Prix unitaire ligne manuelle entièrement piloté par l'admin, jamais recoupé au catalogue (0 DOP soumissible) | `NewReservationDrawer.tsx:355-362` · route POST | WS16-05 | moyenne |
| C-75 | P2 | i18n | `useConfirmDialog` : `cancelLabel` par défaut FR en dur (touche tous les consommateurs) | `components/admin/ConfirmDialog.tsx:43-45` | WS16-06 | haute |
| C-76 | P2 | bug/logique | Messages admin : plafond dur **10 tickets**, aucune pagination → recherche/filtre ne voient que les 10 derniers (KPI globaux trompeurs) | `messages/_hooks/useMessagesData.ts:14-32` · `api/admin/messages/route.ts:18-26` | WS17-01, WS21-02(count=0), WS17-02 | haute |
| C-77 | P2 | bug | `/admin/setup` : détection config cassée (`message?.includes('SUPABASE_SERVICE_KEY')` jamais vrai) → faux « tout manquant » | `admin/setup/page.tsx:23-46` | WS17-03 | haute |
| C-78 | P2 | dette/bug | `/admin/setup` orpheline + lien mort `/GUIDE_ADMIN_PRODUCTS.md` (404) + couleurs Tailwind littérales hors thème | `admin/setup/page.tsx:189,65-200` | WS17-04, WS17-08(P3) | haute |
| C-79 | P2 | bug/logique | Recherche/pagination users & admins bornées à la **page courante (50)** : faux négatifs, « Suivant » désactivé à tort, promotion admin impossible hors 50 premiers | `UsersClient.tsx:41-61,259-266` · `AdminsClient.tsx:116-134` · `api/admin/users/route.ts:32-89` | WS18-01, WS18-02, WS18-03 | haute |
| C-80 | P2 | bug | Suppression article blog **sans confirmation** (hard-delete 1 clic) — seule surface admin sans `useConfirmDialog` | `components/admin/blog/BlogClient.tsx:124-136,205-210` | WS19-02 | haute |
| C-81 | P2 | data/sécurité | Schéma Zod `posts` : aucune borne de longueur (`body`/`excerpt`/...) + `slug` non validé en format → DoS stockage / URL cassée (admin-only) | `lib/schemas.ts:193-216` | WS19-03 | haute |
| C-82 | P2 | bug/a11y | `apariencia` : pas de re-fetch on-focus ni retry sur échec réseau du save (écrase modif concurrente, pas de bouton réessayer) | `admin/apariencia/page.tsx:31,75-80,106-109` | WS19-04 | moyenne |
| C-83 | P2 | sécurité | `[id]` jamais validé UUID sur 5 routes paramétrées → 500 (cast `invalid uuid`) au lieu de 400/404 | `products/[id]:18` · `brands/[id]:18` · `ranges/[id]:18` · `tags/[id]:19` · `tag-types/[id]:19` | WS20-04 | haute |
| C-84 | P2 | sécurité | Routes admin : fuite `error.message` Postgres (tag-types POST/DELETE) contourne `apiError` | `tag-types/route.ts:60` · `tag-types/[id]/route.ts:68` | WS20-03 | haute |
| C-85 | P2 | sécurité/data | `DELETE /api/admin/upload?path=` : suppression Storage **arbitraire** (path non contraint) — annule la discipline du POST | `api/admin/upload/route.ts:104-116` | WS20-05 | moyenne |
| C-86 | P2 | sécurité/perf | Upload produit via route produits **non sniffé** (pas de magic-bytes/taille, `contentType` forcé png, `upsert:true` collision slug) — contraste avec `/api/admin/upload` durci | `api/admin/products/route.ts:97-117` · `products/[id]/route.ts:21-62` | WS20-06, WS25(hors-périmètre) | haute |
| C-87 | P2 | perf/bug | `page`/`limit` non bornés (`messages`/`posts`/`products` GET) : `NaN`/offset négatif → 500, `limit` énorme → fetch massif | `messages/route.ts:18-20` · `posts/route.ts:16-18` · `products/route.ts:18-19` | WS21-03, WS20-09 | haute |
| C-88 | P2 | sécurité (filter-injection) | `search` interpolé brut dans `.or('name.ilike.%...%')` (PostgREST filter-injection, admin-only) | `products/route.ts:38` · `with-tags:35` · `stock/route.ts:44` | WS20-09, WS21-07(P3) | haute |
| C-89 | P2 | bug/data | `messages` GET : `status` non validé contre l'enum, passé brut à `.eq()` (filtre silencieusement vide) | `api/admin/messages/route.ts:17,28-29` | WS21-04 | haute |
| C-90 | P2 | data/logique | Transitions réservation : `confirmed_at`/`collected_at` jamais réinitialisés en retour arrière → horodatages fantômes | `api/admin/reservations/route.ts:196-200` | WS21-05 | moyenne |
| C-91 | P2 | sécurité | `create_ticket` lie un ticket au compte d'un email **non vérifié** → usurpation d'expéditeur (ticket attribué à la victime) | `api/contact/route.ts:46-51` + RPC `create_ticket` | WS22-04 | moyenne |
| C-92 | P2 | data/perf | GET `/api/cart` crée une ligne `carts` + pose cookie à **chaque** visite anonyme, sans purge (croissance non bornée) | `api/cart/route.ts:52-60` (effet de bord sur GET) | WS22-06 | haute |
| C-93 | P2 | sécurité | Vues **SECURITY DEFINER** exposées anon (`v_bestsellers`, `tags_with_types`) — advisor ERROR | `20260527110000:6-16` · `baseline.sql:131-142` | WS24-03, WS10(hors-périmètre), WS27(hors-périmètre) | haute |
| C-94 | P2 | sécurité/logique | `merge_anon_cart_to_user` fait confiance à `p_anon_id` (vol panier anonyme abandonné, UUID non énumérable → faible) | `20260523095131:10-54` · `cart/merge/route.ts:27-29` | WS24-04, WS22(hors-périmètre) | haute |
| C-95 | P2 | sécurité/dette | Policies admin `FOR ALL` sans `WITH CHECK` explicite (~10 tables) — **non exploitable** (USING réutilisé), pur défaut de cohérence | live (10 policies « Admin manage ») | WS24-05 | haute |
| C-96 | P2 | sécurité | 2 buckets Storage publics autorisent le **LISTING** (énumération de fichiers) — advisor WARN | `baseline.sql:600,604` | WS24-06, WS19(hors-périmètre) | haute |
| C-97 | P2 | perf/data | 4 FK sans index couvrant (`reservation_items.product_id`, `contact_messages.user_id/replied_by`, `shop_settings.updated_by`) | `reservations_schema:56-65` · `baseline:230,237` · `shop_settings:34` | WS27-01 | haute |
| C-98 | P2 | perf/dette | Index dupliqués (mêmes colonnes, noms différents) sur `product_tags`/`product_images` + index redondants avec préfixe PK | `20260519140420:14-15` vs `20260520131704:87-90` | WS27-02, WS27-03(P3) | haute |
| C-99 | P2 | i18n | `formatPrice`/devise : voir C-27 (regroupé). _(placeholder dédup — fusionné dans C-27)_ | — | (fusionné) | — |
| C-100 | P2 | sécurité | Rate-limit **fail-open** sur erreur RPC : un incident/DoS DB désactive toute limitation (spam tickets/emails) | `lib/rateLimit.ts:21-24,32-35` | WS26-01 | haute |
| C-101 | P2 | sécurité | `getClientIp` : fallback « dernier hop XFF » falsifiable **hors Vercel** (sur Vercel : OK) | `lib/rateLimit.ts:63-69` | WS26-02, WS22-08(P3), WS25(positif) | haute |
| C-102 | P2 | bug | reset-password : voir C-33 (regroupé hash-flow). _(fusionné)_ | — | (fusionné) | — |
| C-103 | P2 | a11y/thème | `bg-white` littéral hors thème dans `LocaleSwitcher` variant block (mobile) → texte clair/fond blanc en dark mode | `LocaleSwitcher.tsx:59` | WS11-02, WS33-05, WS10-10(blog `bg-white`), WS19-07(positif) | haute |
| C-104 | P2 | a11y (contraste) | `--c-ink-400` (54 %) sous AA texte normal sur 4-5 thèmes + placeholder très pâle (15 usages contenu) | `globals.css:100,281` | WS33-03 | haute |
| C-105 | P2 | a11y (contraste) | `--c-ink-500` (66 %, **415 usages**) échoue AA texte normal sur coral/light + borderline ailleurs | `globals.css:101` | WS33-04 | haute |
| C-106 | P2 | logique-métier (cas-limite) | Course `create_reservation` : `23505` (index unique) mappé en 500 générique au lieu de 409 `already_active` | `rpc_create_reservation:41-48,99-110` · `cart/reserve/route.ts:86-151` | WS34-05 | haute |
| C-107 | P2 | perf | `generateMetadata` + render dupliquent les requêtes (produit/tag/brand par slug) sans `React.cache` ; `redirectIfUuid` ×2 | `product/[slug]:52-59,185-192` · `besoins/[slug]:73-115` · `marques/[slug]:66-108` | WS35-05, WS03-03, WS10-04 | haute |
| C-108 | P2 | perf | `_dashboard/data.ts` `fetchCatalogue` : 5 `count head` redondants avec le scan complet déjà fait | `_dashboard/data.ts:251-262` | WS35-06 | haute |
| C-109 | P2 | perf (LCP) | `ProductCard` `<Image>` sans `sizes` + pas de `priority` sur 1ʳᵉ ligne des grilles | `ProductCard.tsx:82-88` | WS35-08 | moyenne |
| C-110 | P2 | perf | `account/reservations` : `getTranslations` + `Intl.*` recréés **par carte** | `account/reservations/page.tsx:106-141` | WS35-09 | haute |
| C-111 | P2 | bug/logique | Re-toggle newsletter (POST `{}`) : conflit `23505` traité en succès silencieux sans confirmer la ligne ; GET `subscribed` sur présence ≠ `confirmed_at` | `PreferencesForm.tsx:40-65` · `api/newsletter/route.ts:39-90,144-155` | WS09-03, WS09(hors-périmètre) | moyenne |
| C-112 | P2 | a11y/bug | Bouton « + » du stepper panier reste actif au plafond de stock (no-op silencieux, pas d'`aria-disabled`) | `cart/CartLineItem.tsx:253-257` | WS04-04 | haute |
| C-113 | P2 | bug/archi | `useCart` mute **en place** les items du cache SWR (shallow copy) sur add/updateQuantity → incohérences transitoires | `hooks/useCart.ts:74,185` | WS29-05, WS04-09(P3) | haute |
| C-114 | P2 | bug/logique | « Ajouté ✓ » affiché même quand `addToCart` est un **no-op** (panier non hydraté) → faux positif au 1er clic | `AddToCartButton.tsx:44-52` ← `useCart.ts:55-56` | WS04-01, WS29-04, WS03(hors-périmètre) | haute |
| C-115 | P2 | bug | Redirect « panier vide » peut renvoyer vers `/cart` juste après une réservation réussie (course push↔effect) | `reservation/ReservationClient.tsx:170-172` | WS05-06 | moyenne |
| C-116 | P2 | bug/data | `maxLength` sur input contrôlé non re-validé + code postal non numérique accepté → zone/tarif erroné | `reservation/AddressStep.tsx:99-104` | WS05-08 | moyenne |
| C-117 | P2 | i18n | `BannerFormModal`/`settings` : placeholders d'exemple FR/ES en dur (mélange de langues) | `BannerFormModal.tsx:206,212` · `settings/page.tsx:238` | WS30-05(P3) | haute |
| C-118 | P2 | dette/archi | Système tickets : `admin_notes`/`replied_by_user` déclarés mais inertes (pas de saisie/réponse), `replied_at` posé sans contenu | `messages/_lib/types.ts:14,19` · `MessageDetailModal.tsx` | WS17-06(P3) | haute |
| C-119 | P2 | dette/archi | Télémétrie bannière `onView`/`onClick`/`data-banner-id` morte + asymétrique (`view_count`/`click_count` toujours 0) | `Banner.tsx:37-51` · `[locale]/page.tsx:158-181` · `banners/stats/route.ts:22-46` | WS12-03, WS13-01(WhatsApp opened), WS20-07(P3) | haute |
| C-120 | P2 | bug/data | Parser CSV `prices-import.cjs` ne gère pas les `\n` dans les champs quotés → mauvaise association de prix | `scripts/prices-import.cjs:48` | WS36-07 | moyenne |
| C-121 | P2 | sécurité | Scripts : mots de passe admin exposés en clair (argv + stdout) | `create-admin-user.js:32,77` · `reset-password.js:23,53` | WS36-04 | haute |
| C-122 | P2 | data/dette | Scripts destructifs sur `db/catalog.json` (versionné) sans `--dry-run` (`prices-set-default`, `prices-import`, `parse-pdfs`) | `prices-set-default.cjs:48` · `prices-import.cjs:95` · `parse-pdfs.cjs:319` | WS36-05 | haute |
| C-123 | P2 | data/logique | Aucun rollback sur échec partiel d'import DB (marque/gammes sans produits) | `seed-import.cjs:223-301` · `seed-example-content.cjs:109-168` | WS36-06 | moyenne |
| C-124 | P2 | dette | `cleanupStaleTestUsers` défini mais **jamais appelé** (filet anti-fuite prod inerte) | `tests/_helpers/test-users.ts:84-108` · `playwright.config.ts` | WS37-03 | haute |
| C-125 | P2 | dette/perf/data | `npm run test` (sans `--project`) lance 5 navigateurs → 5× créations prod + OOM dev | `package.json:13` · `playwright.config.ts` | WS37-04 | haute |
| C-126 | P2 | sécurité (trou de test) | Open-redirect login/signup non testé en intégration (helper testé en isolation seulement) | `safeRedirect.test.ts` + absence de wiring | WS37-05 | haute |
| C-127 | P2 | sécurité (trou de test) | Aucun test : super_admin, mass-assignment role, XSS blog, merge panier A→B, appearance/blog/newsletter | `tests/` + `src/__tests__/` | WS37-07 | haute |
| C-128 | P2 | dette | `.env.local.example` incomplet (`NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`, alias service key non documentés) | `.env.local.example:1-14` | WS38-03 (recoupe C-06) | haute |
| C-129 | P2 | dette (futur) | `next lint` déprécié → cassera en Next 16 (caret `^15.5.18` peut bumper) ; CI rouge | `package.json:11,42` | WS38-04 | haute |
| C-130 | P2 | dette (doc) | Dérive CLAUDE.md : « 22 routes admin » (réel 28), « 1 admin » (réel 2), « 0 posts » (réel 4) | `CLAUDE.md` sections API/BDD | WS38-05, WS13(hors-périmètre), WS24-09(migration appliquée), WS27-05(schema.sql), WS37-12(vitest 19) | haute |
| C-131 | P2 | sécurité (CI) | CI : `npm audit` + `gitleaks` en `continue-on-error` (contrôles sécu décoratifs) ; build sans service key | `.github/workflows/ci.yml:27-29,85-98` | WS38-06 | moyenne |

### P3 — Cosmétique / Dette (synthèse — détail dans chaque WS)

Les P3 sont nombreux (≈96 après dédup) et tracés intégralement dans les rapports WS. Regroupés par thème récurrent :

| ID | Sév | Thème | Titre regroupé | Sources WS principales |
|---|---|---|---|---|
| C-200 | P3 | dette (code mort) | **Composants/exports morts** : `CartIcon.tsx`, `ProductDetailCard.tsx`, `shippingCostFor`/`getPickupLocation`, `BANNER_TYPE_LABELS`, `userPatch`, `getPublicEnv`, helpers `useAuth` (signIn/signUp/signOut), `mockReplace`/`mockBack` | WS04-02, WS30-04, WS03-04, WS05-10, WS15-08, WS21-10, WS26-03, WS28-05, WS29-07, WS37-11 |
| C-201 | P3 | dette/i18n (code mort) | **Clés i18n orphelines** : `Cart.errors.*`, `Cart.*` inutilisées, `Product.*` legacy, `Reservation.errors.shipping_required`, `Banner.ctaArrowAlt`, `Filters.tagTypes.categories`, `Signup.errors.disposableEmail` | WS04-08, WS03-12, WS05-12, WS12-10, WS02-08, WS08-07 |
| C-202 | P3 | i18n | **Dates `Intl` figées `es-DO`/locale navigateur** (admin : users/admins/newsletter/blog/apariencia/réservations) au lieu de la locale active | WS18-10, WS19-05, WS16-01(es-DO), WS13-10(TZ RD), WS07-08(legal fr-FR) |
| C-203 | P3 | a11y | **`role="status"`/`aria-live` manquants** : steppers quantité, tables admin loading, recherche ; toggle œil `tabIndex=-1` ; `aria-current` sur `<span>` au lieu de `<li>` | WS32-09, WS32-10, WS18-08, WS05-13, WS11-09, WS08-09 |
| C-204 | P3 | dette (thème) | **Couleurs hors tokens** : hex/rgba littéraux `ProductsTable`, `purple-*` IconPicker, `apariencia` boxShadow, SVG About hex, manifeste dégradé ; tokens de rampe définis non utilisés | WS14-15, WS15-10, WS19-09, WS06-12, WS33-07, WS33-08(`bg-ink-900` dark) |
| C-205 | P3 | a11y/i18n | **Skip-link** sans cible sur `/admin/*` + libellé FR en dur ; 404 racine langue mélangée EN/ES ; `PopClose` défaut « Cerrar » | WS32-07, WS12-08, WS30-06, WS12-09 |
| C-206 | P3 | dette (doc) | **Drifts doc résiduels** : `database.types.ts` contient `mark_message_as_read` droppée ; `db/schema.sql` omet `merge_anon_cart_to_user`/`home_layout` ; doc IDOR dit « migration non appliquée » (appliquée) ; `db/catalog.json` versionné ; « SSG » vs ISR | WS27-04, WS27-05, WS24-09, WS24-10, WS38-07, WS38-09 |
| C-207 | P3 | sécurité (durcissement) | **`search_path` sans `pg_temp`** (3 RPC) + RPC bannières (`reorder_banners`/`cleanup_banner_positions`) exécutables anon/authenticated ; `rls_enabled_no_policy` ×3 (deny-all OK) | WS27-06, WS27-07, WS34-09, WS24-08 |
| C-208 | P3 | sécurité (headers) | CSP `img-src https:` + `remotePatterns:'**'` (open image proxy) ; HSTS sans `preload` ; `Referrer-Policy: same-origin` (attribution sortante perdue) ; cookie `cart_id` sans `Secure` | WS26-04, WS38-08, WS26-05, WS26-06, WS22-09 |
| C-209 | P3 | seo | JSON-LD CollectionPage `url` relatif (pas absolu) ; sitemap sans `x-default` ; sitemap dynamique (cookies) + erreurs DB avalées ; `/api/search?bestsellers` cacheable mais `no-store` ; `og:image` sans dimensions | WS31-06, WS31-07, WS31-08, WS35-10, WS35-11, WS10-09, WS10-05 |
| C-210 | P3 | bug (mineur)/dette | Divers : `PdpGallery` curseur zoom sans zoom ; `currency.toUpperCase()` dispersé ; `besoins capitalize` ; `SWRProvider` fetcher sans `res.ok` ; `useWishlist`/`useIsAdmin` races mineures ; `useModalA11y` Escape cascade + focus masqué ; `clearCart` N DELETE ; `PdpStockBadge` `null→InStock` ; blog cap 50 sans pagination ; `_AdminShell` redirect non encodé ; `RecentMessagesWidget` slice ; sparkline font ; `slug` lien panier=UUID ; `StockPill` `excess` mort ; `featured_on_home` sans UI admin ; `parse-pdfs` execSync ; `check-products` anon/ESM cassé ; `scripts` ESM/CJS | WS03-11, WS03-09, WS10-08, WS11-10, WS29-06/08/09/10/11, WS34-08, WS03-07, WS10-06, WS13-08/09/11, WS13-07, WS04-11, WS15-07, WS15-09, WS36-08/09/10/11, WS33-06(footer coral) |
| C-211 | P3 | dette (config) | `.claude/settings.json` pré-autorise MCP **Stripe/Vercel** sans rapport (pas de paiement) ; pre-commit minimal (pas de tsc) | WS38-12, WS38-11 |
| C-212 | P3 | i18n/UX | Formulaires : codes d'erreur serveur bruts/non localisés affichés (contact/aide 429 FR en dur) ; `aria-invalid` login marque les 2 champs sur erreur non-form ; énumération de comptes au signup | WS07-07, WS08-08, WS08-06 |
| C-213 | P3 | dette | Divers admin/perf : `useBrandsData` fetch `/ranges` inutile ; `ProductsTable` pagination sans ellipsis (36 boutons) + `group-hover` sans `group` ; PATCH produit `range_id` en 2 UPDATE (non atomique, ne peut vider) ; messages config FR en dur ; `fetchFeaturedNeeds` 1+N ; `account/reservations` Intl par carte (regroupé C-110) ; dashboard `force-dynamic`+`revalidate` mort | WS14-13, WS14-12, WS14-16, WS14-11, WS14-14, WS35-12, WS13-02 |
| C-214 | P3 | dette/sécurité | GET `/api/contact` route morte qui fuiterait `admin_notes` + auth Bearer obsolète | WS22-01 |
| C-215 | P3 | logique-métier (latent) | `create_reservation` agrège la devise via `MAX(currency)` (faux si multi-devises) | WS34-07 |
| C-216 | P3 | i18n | Mentions-légales/cookies FR-only (intentionnel documenté) → `lang` mismatch SEO ; `dangerouslySetInnerHTML` sur titres i18n (`/aide`, FooterNewsletter — sûr, dev-controlled) | WS07-09, WS07-10, WS32(hors-périmètre) |
| C-217 | P3 | dette | `build-favicons` `Buffer.allocUnsafe` (sûr ici) ; `<main>` `flex-1` vs `flex-grow` ; `lang={locale}` redondant sur wrappers ; `HomeHero`/`IframeHeightReporter` client inutile ; doublon footer « pharmaciens »/« À propos » | WS36-11, WS06-13, WS01-08, WS01-09, WS01-12, WS11-08 |

> Les P3 ci-dessus sont **agrégés** pour la lisibilité ; chaque finding individuel (avec `fichier:ligne` exact) reste dans son rapport WS. Total P3 brut = 191 ; après regroupement thématique ≈ 96 problèmes distincts.

---

## Findings par workstream (index de traçabilité)

| WS | Périmètre | IDs consolidés contributeurs |
|---|---|---|
| WS01 | Home | C-01, C-24, C-26, C-201, C-210, C-217 (+ WS01-02/03/05 spécifiques bestsellers non promus, voir rapport) |
| WS02 | Catalogue | C-03, C-25, C-26, C-35, C-201, C-210, C-217 |
| WS03 | PDP | C-05, C-27, C-28, C-42, C-107, C-114, C-200, C-201, C-210 (+ WS03-02 `is_active` similaires, WS03-06/08 flags) |
| WS04 | Panier UI | C-28, C-36, C-41, C-112, C-113, C-114, C-200, C-201, C-210 |
| WS05 | Réservation | C-05, C-06, C-07, C-42, C-115, C-116, C-200, C-201, C-203 |
| WS06 | About/éditorial | C-01, C-07, C-48, C-50, C-51, C-52, C-204, C-217 (+ WS06-04 « 60+ marques », WS06-09 placeholders) |
| WS07 | Contact/legal | C-01, C-07, C-39, C-43, C-49, C-202, C-212, C-216 |
| WS08 | Auth | C-08, C-32, C-33, C-34, C-203, C-212 |
| WS09 | Compte | C-07, C-29, C-31, C-111 (+ WS09-04 PreferencesForm focus, WS09-06 reset rate-limit) |
| WS10 | Blog/Marques/Besoins/Favoris | C-02, C-12, C-45, C-48, C-103, C-107, C-209, C-210 |
| WS11 | Nav/chrome | C-01, C-37, C-38, C-44, C-52, C-103, C-203, C-210, C-217 |
| WS12 | Bannières/UI/layout | C-54, C-55, C-56, C-119, C-201, C-205, C-210 |
| WS13 | Shell/dashboard admin | C-57, C-58, C-119, C-130, C-202, C-213 (+ WS13-05/06 SWR thème, WS13-07/09/10/11 nits) |
| WS14 | Admin produit/marques | C-09, C-59, C-60, C-61, C-62, C-63, C-64, C-65, C-66, C-204, C-213 |
| WS15 | Admin stock/tags/annonce | C-67, C-68, C-69, C-70, C-27, C-60, C-204, C-210 (+ WS15-07 excess, WS15-09 featured_on_home) |
| WS16 | Admin réservations | C-10, C-71, C-72, C-73, C-74, C-75, C-202 (+ WS16-08 bulk WhatsApp, WS16-09 export CSV, WS16-10/11 nits) |
| WS17 | Admin messages/settings/setup | C-53, C-76, C-77, C-78, C-118 (+ WS17-07 dirty-check, WS17-09 useEffect) |
| WS18 | Admin users/newsletter | C-52, C-79, C-65, C-202, C-203 (+ WS18-06/07/09 nits) |
| WS19 | Admin blog/apparence | C-14, C-80, C-81, C-82, C-103, C-202, C-204, C-210 |
| WS20 | API admin catalogue | C-09, C-83, C-84, C-85, C-86, C-87, C-88, C-119, C-123 |
| WS21 | API admin ops | C-11, C-71, C-76, C-87, C-88, C-89, C-90, C-200, C-202 |
| WS22 | API public | C-13, C-30, C-91, C-92, C-101, C-208, C-214 (+ WS22-05 Zod ad-hoc, WS22-10 apiError) |
| WS23 | Authz | C-08, C-29 (+ WS23-03 double source check admin, WS23-04 redirect non encodé) |
| WS24 | RLS/DB security | C-22, C-93, C-94, C-95, C-96, C-32(leaked-pwd), C-206, C-207 |
| WS25 | Validation/XSS | C-09, C-13(cart), C-54, C-53, C-86 (+ WS25-03 DOMPurify config, WS25-05 link scheme, WS25-07 wishlist uuid) |
| WS26 | Rate-limit/CSRF/CSP | C-100, C-101, C-200, C-208 |
| WS27 | Schéma DB | C-97, C-98, C-206, C-207 |
| WS28 | Clients Supabase/lib | C-06, C-05(whatsapp), C-27, C-59, C-200, C-210 (+ WS28-06/07 shop_settings, WS28-08 cookie parse) |
| WS29 | Hooks | C-23, C-40, C-113, C-114, C-200, C-210 (+ WS29-06/08/09/10/11/12 nits) |
| WS30 | i18n | C-10, C-41, C-42, C-117, C-200, C-205 |
| WS31 | SEO | C-12, C-46, C-47, C-48, C-49, C-50, C-209 |
| WS32 | a11y | C-14, C-24, C-36, C-37, C-38, C-39, C-40, C-103, C-203, C-205 |
| WS33 | Thème/CSS | C-15, C-103, C-104, C-105, C-204 (+ WS33-06 footer coral, WS33-07 tokens morts) |
| WS34 | Logique métier | C-05, C-13, C-27, C-28, C-106, C-207, C-210, C-215 |
| WS35 | Performance | C-01, C-02, C-03, C-04, C-73, C-107, C-108, C-109, C-110, C-209 (+ WS35-12 home 1+N) |
| WS36 | Scripts | C-16, C-17, C-120, C-121, C-122, C-123, C-210 (+ WS36-08 check-products anon) |
| WS37 | Tests | C-18, C-19, C-124, C-125, C-126, C-127, C-200, C-206, C-130 (+ WS37-08/09/10/13 nits) |
| WS38 | Config/hygiène | C-20, C-21, C-128, C-129, C-130, C-131, C-208, C-211 (+ WS38-07 catalog.json) |

> Pour le détail exact (constat/impact/reco/confiance) de chaque finding, se référer au rapport WS d'origine. Les IDs `WSxx-NN` y sont conservés.
