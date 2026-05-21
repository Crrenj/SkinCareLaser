# Audit complet — FARMAU / Skincare Laser

Date d'audit : 2026-05-19
Date dernière mise à jour : 2026-05-21 (post P1 → P5 + curation home)
Branche : `main`
Méthode : 9 audits parallèles spécialisés, ~5 500 lignes de rapports

> **État** : voir `docs/HANDOFF.md` pour la punch list courante.
> **142 findings au total** dont une grande majorité **fermés** lors des sessions 2026-05-19 → 2026-05-21.
> Phase 7 (sessions 2026-05-21) : `/marques` + filtres URL + 404 design + pages légales + hub `/account` + 4 pages éditoriales + admin users/newsletter + curation home. Voir détails plus bas.

---

## Vue d'ensemble

| Dimension | Note | Findings | Lignes | Rapport |
|---|---|---|---|---|
| Sécurité | 🔴 **Critique** | 15 | 219 | [security.md](./security.md) |
| Performance | 🟠 Moyen | 12 | 273 | [performance.md](./performance.md) |
| Architecture | 🟠 Moyen | 15 | 392 | [architecture.md](./architecture.md) |
| Base de données | 🟠 Moyen | 20 | 962 | [database.md](./database.md) |
| Accessibilité | 🔴 38/100 | 18 | 685 | [accessibility.md](./accessibility.md) |
| SEO | 🟠 65-75/100 | 15 | 824 | [seo.md](./seo.md) |
| Developer Experience | 🟡 6/10 | 15 | 841 | [developer-experience.md](./developer-experience.md) |
| UX / Product | 🔴 4/10 | 14 | 614 | [ux.md](./ux.md) |
| Qualité de code | 🟡 Moyen+ | 18 | 703 | [code-quality.md](./code-quality.md) |
| **TOTAL** | | **142 findings** | **5 513** | |

---

## 🚨 Findings critiques (à corriger AVANT prod publique)

Les audits ont convergé sur 5 problèmes qui apparaissaient dans plusieurs rapports :

### ~~1. API admin entièrement ouvertes sur Internet~~ ✅ FIXÉ (commit `8c6bf63`)
- Helper `src/lib/requireAdmin.ts` créé, appelé en tête des 16 routes `/api/admin/*`
- Client service-role centralisé dans `src/lib/supabaseAdmin.ts` (singleton, typé `Database`)
- UUID admin hardcodé supprimé
- **Vérification** : `curl https://farmau.do/api/admin/products -X DELETE` → `401 Non authentifié`

### ~~2. Tunnel d'achat cassé~~ ✅ REMPLACÉ PAR SYSTÈME DE RÉSERVATION
**Décision produit** : pas de paiement en ligne, modèle "click & collect" avec confirmation WhatsApp.

Livré en 8 commits (`5be92fa` → `5e51720`) :
- Tables `reservations` + `reservation_items` + enum status + RLS + indexes + partial unique (1 active par user)
- RPC `create_reservation` (snapshot phone + items, vide cart, TTL 24h)
- `pg_cron` toutes les 5 min pour `expire_stale_reservations`
- `POST /api/cart/reserve` avec ERRCODE mapping
- Signup form téléphone obligatoire + `handle_new_user` étendu
- `/account/profile` + ProfileEditForm pour reseigner téléphone manquant
- Bouton "Réserver" sur `/cart` + écran de confirmation
- `/admin/reservations` avec onglets status + lien WhatsApp pré-rempli

Plus :
- ✅ `.limit(100)` → `.limit(500)` sur catalogue (commit `4f4db48`, 253 produits débloqués)
- ✅ Footer 24 liens câblés (sprint 2 livrable 5/5 + commit `be73c77`) — restent les routes `/besoins/[slug]` et `/marques` à créer

### ~~3. Bug RPC `add_to_cart` — écrase la quantité~~ ✅ FIXÉ (commit `b8ea667`)
- `quantity = public.cart_items.quantity + EXCLUDED.quantity` + bump `updated_at`
- Test SQL : 2 PERFORM successifs (qty=1+2) → qty=3 ✅

### 4. Accessibilité non conforme WCAG AA — PARTIEL
- ✅ `<html lang="fr">` (commit `0d0f432`)
- ✅ Skip link "Aller au contenu principal" sur toutes les pages publiques
- ❌ `focus:outline-none` (~50 endroits) → focus-visible — **PENDING**
- ❌ Modales sans `role="dialog"` + focus trap — **PENDING**
- ❌ Contraste `#CCC5BD` + texte blanc (1.96:1, fail WCAG) — **PENDING** (peut avoir changé avec refonte design)

### 5. Stockage d'images dupliqué — **PENDING**
- `products.image_url` + table `product_images` cohabitent
- Le fallback `image_url || product_images?.[0]?.url` est dispersé

### 6. Sprint 2 design — ✅ LIVRÉ (commits `677622c` → `c37a915`)
**Refonte visuelle complète sur 5 surfaces majeures** :
- ProductCard (Instrument Serif sur prix, CTA outline ink, quick-add hover, ❤ heart top-right)
- NavBar 3-row sticky + `⌘K` recherche dropdown + MobileDrawer + LocaleSwitcher
- Fiche produit avec 5 accordéons natifs + galerie sticky + zoom + pharmacist conditionnel + sticky mobile
- Bannières 6 → 3 (`editorial`/`hero`/`quote`) + admin form conditionnel
- Home 7 sections (Hero éditorial → Bestsellers via v_bestsellers → ByNeed via tags.featured_on_home → Quote → Brands → Expertise → Routine) + Footer 5 col + newsletter

**Système Wishlist complet** (nouvelles surfaces hors audit initial) :
- Table `wishlists` (PK composite + RLS "users manage own")
- API `/api/wishlist` GET liste + POST toggle
- Hook `useWishlist` optimistic SWR
- Heart sur ProductCard + Heart sur PDP
- Page `/favoris` (force-dynamic, redirect /login si non auth, noindex)

**Migration DB consolidée sprint 2** (commit `cf8f581`) :
- 12 colonnes products : volume, pharmacist_advice, pharmacist_name, benefits[], usage, inci, technical_pdf_url, skin_type[], texture, old_price, is_new, is_featured
- tags.featured_on_home boolean
- 4 colonnes banners : direction (CHECK left|right), attribution_name, attribution_title, attribution_photo_url
- table wishlists + RLS + 2 indexes
- table newsletter_subscribers (RLS service-role only)
- vue v_bestsellers (tri sold_30d + is_featured + created_at)
- 7 indexes FK (product_ranges, product_tags, product_images, cart_items, order_items)

---

## 📊 Findings importants par dimension

### Sécurité (15)
- ✅ Auth `/api/admin/*` (`requireAdmin`)
- ✅ Rate limit `/api/contact` (5/min/IP) + `/api/newsletter` (3/min/IP)
- ✅ Next.js 15.3.4 → 15.5.18 (CVE)
- ✅ UUID admin hardcodé supprimé
- ✅ Énumération emails `create_contact_message` (commit `4665575`) : RPC ouverte aux emails non inscrits
- ✅ `npm audit fix` corrections non-breaking (commit `fb6dbbb`)
- ❌ Fallback `localStorage` pour tokens Supabase (XSS exfiltration triviale)
- ❌ RPC `SECURITY DEFINER` sans `SET search_path` (à auditer fonction par fonction ; `check_rate_limit`, `create_reservation`, `expire_stale_reservations`, `handle_new_user` sont OK)
- ❌ Pas de validation des champs côté API (`...productData` propage tout)
- ❌ Pas de protection CSRF

### Performance (12)
- ✅ `revalidate = 60` sur `/`, `/catalogue`, `/product/[slug]` (commit `bcefbbe`)
- ✅ 4 indexes FK initiaux (commit `0dd8721`) + 7 indexes FK sprint 2 (`cf8f581`) → 11 indexes au total sur les FKs critiques
- ✅ 2/5 `<img>` admin migrés (commit `b580342`)
- ✅ Vue `v_bestsellers` cache home + nav-search fallback
- ❌ 3 `<img>` restants → `next/image` : `CartDrawer`, `ProductClient×2` — **PENDING (P2)**
- ❌ `splitChunks` custom → vendor chunk 864 KB
- ❌ `framer-motion` listé mais jamais importé
- ❌ `FiltersNew.tsx` jamais importé (mort)

### Architecture (15)
- ✅ `supabaseAdmin` singleton typé avec `Database` (commit `2348950`) + factorisation contact route
- ✅ Auth vérifiée 1 place (`requireAdmin`)
- ❌ Pages admin obèses (tags 753, marques 708, product 703, annonce 668 LOC)
- ❌ NavBar couplée à CartDrawer (drawer devrait être au layout) — peut avoir changé avec refonte design
- ❌ Types `Product`/`Brand`/`Tag`/`Banner` redéfinis 5-10 fois ad-hoc (mitigé par génération automatique des types Supabase mais usage non systématique)

### Base de données (20)
- ✅ 11 indexes FK posés (4 initiaux + 7 sprint 2)
- ✅ `add_to_cart` fix
- ✅ Migrations versionnées (`supabase/migrations/`)
- ✅ Types TS générés (`src/lib/database.types.ts`)
- ✅ Tables `reservations` + `reservation_items` + `rate_limit_buckets` + `wishlists` + `newsletter_subscribers` ajoutées
- ✅ Vue `v_bestsellers` (sold_30d + is_featured + created_at)
- ✅ 12 colonnes products sprint 2 (volume, pharmacist_*, benefits, usage, inci, etc.)
- ✅ Bannières : 4 colonnes ajoutées (direction + attribution_*)
- ❌ `auth.uid()` non wrappé dans `(SELECT auth.uid())` → évalué par ligne (perf RLS)
- ❌ `is_user_admin` pas marquée STABLE
- ❌ Stockage image dupliqué — **PENDING**
- ❌ `tags_with_types` est une VUE non matérialisée
- ❌ `banner_type_enum` strict pas encore créé (colonne reste `text` pour compat legacy)

### Accessibilité (18) — note 38/100 (à re-mesurer après refonte design)
- ✅ `<html lang>`
- ✅ Skip link
- ❌ `focus:outline-none` global — **PENDING**
- ❌ Modales sans rôle dialog — **PENDING**
- ❌ Roadmap 5 sprints pour atteindre ~88 % conformité

### SEO (15) — ✅ majoritairement FIXÉ
- ✅ `sitemap.ts` dynamique (routes × locales + produits avec hreflang)
- ✅ `robots.ts`
- ✅ `metadataBase` (`https://farmau.do`)
- ✅ `generateMetadata` sur home, catalogue, contact, a-propos, product (dynamique), cart, profile, favoris
- ✅ hreflang alternates + `x-default`
- ✅ openGraph par page
- ✅ URLs `/product/[slug]` (refactor user pendant sprint 2)
- ❌ Pas de JSON-LD structured data (Product schema)

### Developer Experience (15) — ✅ majoritairement FIXÉ
- ✅ `.env.local.example` (commit `acc2326`)
- ✅ CI GitHub Actions lint+tsc+vitest (commit `5cbe1e9`)
- ✅ Pre-commit hook Husky + lint-staged (commit `795e8ee`)
- ✅ Types Supabase générés (commit `507e7e2`)
- ✅ Migrations versionnées (commit `02edb94`)
- ✅ Smoke tests Playwright (commit `7bd0050`)
- ❌ 38 warnings ESLint restants (mostly `any` dans admin)
- ❌ Couverture tests < 5 % (smoke + auth seulement)
- ❌ Pas de validation runtime des env vars (Zod)
- ❌ 35 `alert()` natifs dans l'admin

### UX (14) — note à re-mesurer post sprint 2
- ✅ Catalogue débloqué (limit 500)
- ✅ Tunnel de réservation fonctionnel end-to-end
- ✅ i18n FR/EN/ES complet avec LocaleSwitcher
- ✅ Footer 24 liens câblés (sprint 2 livrable 5/5) — restent routes `/marques` et `/besoins/[slug]` à créer
- ✅ NavBar dropdown langue via LocaleSwitcher
- ✅ Recherche permanente avec ⌘K + dropdown live + recents + bestsellers fallback
- ✅ Wishlist fonctionnel : heart ProductCard + PDP + page `/favoris`
- ✅ Hero éditorial home + 7 sections (plus de page vide après scroll)
- ✅ ProductCard refondue × 353 (impact maximal)
- ✅ PDP avec 5 accordéons + galerie sticky + sticky bar mobile + zoom
- ✅ Banners 6 → 3 variantes éditoriales claires
- ❌ Filtres catalogue 100 % client-side (perf sur tag changes)
- ❌ 35 `alert()` natifs dans l'admin
- ✅ `localeCompare` "meilleures ventes" → vue v_bestsellers avec vrai tri SQL

### Qualité de code (18)
- ✅ -300 LOC duplication via factorisation `supabaseAdmin`
- ✅ Test files mockés correctement pour next-intl
- ❌ 38 warnings ESLint dont ~30 `no-explicit-any` dans admin
- ❌ Code mort : `FiltersNew.tsx` (394 LOC), `ProductDetailCard.tsx`, `admin/ImageUpload.tsx`
- ❌ Couverture tests faible
- ❌ Magic numbers/strings : `'DOP'`, `5.99`, `5MB`, etc.

---

## 🛠️ Plan de remédiation — état d'avancement

### ✅ Phase 1 — Sécurité bloquante (FAIT)
1. ✅ Sécuriser routes `/api/admin/*` (`requireAdmin`)
2. ✅ Bug `add_to_cart`
3. ✅ `<html lang="fr">`
4. ✅ Rate limit `/api/contact`
5. ⚠️ Anti-énumération `create_contact_message` — **PENDING**

### ✅ Phase 2 — Quick wins (FAIT)
6. ✅ Indexes DB (11 sur les 15 proposés ; les 4 manquants sont couverts par PKs composites)
7. ✅ `sitemap.ts` + `robots.ts` + `metadataBase`
8. ✅ `generateMetadata` pour `/product/[slug]` (et toutes les autres pages publiques)
9. ✅ `revalidate` sur pages publiques
10. ⚠️ 2/5 `<img>` migrés (admin) — reste CartDrawer + ProductClient×2 — **PENDING**
11. ✅ `.env.local.example`
12. ❌ Supprimer code mort (`FiltersNew`, `framer-motion`) — **PENDING**
13. ✅ Factoriser `supabaseAdmin` en singleton

### Phase 3 — Accessibilité / UX (PARTIEL)
14. ⚠️ Skip link OK, `focus-visible` global et modales `role="dialog"` — **PENDING**
15. ✅ CartDrawer mobile (refonte design sprint 2)
16. ✅ Réservation branchée (équivalent du checkout WhatsApp suggéré)
17. ✅ `.limit(100) → 500`
18. ✅ Footer 24 liens câblés (sprint 2 livrable 5/5)

### Phase 4 — Hygiène long terme (PARTIEL)
19. ✅ CI GitHub Actions
20. ✅ Husky + lint-staged
21. ❌ Tests d'intégration admin Playwright — **PENDING**
22. ❌ Splitter pages admin > 500 LOC — **PENDING**
23. ✅ Générer types Supabase
24. ✅ URLs `/product/[slug]`
25. ✅ Bumper deps obsolètes (`npm audit fix` non-breaking, commit `fb6dbbb`)

### Phase 5 — Nouveau (post-audit) — FAIT
26. ✅ Système de réservation complet (8 étapes)
27. ✅ i18n FR/EN/ES (4 paliers : foundation, migration routes, traductions, LocaleSwitcher)
28. ✅ Migrations versionnées (`supabase/migrations/`)
29. ✅ Smoke tests Playwright golden path

### Phase 6 — Sprint 2 design (post-audit) — FAIT
30. ✅ ProductCard refondue (commit `677622c`)
31. ✅ NavBar responsive + recherche ⌘K (commit `2e01376`)
32. ✅ Fiche produit accordéons + galerie sticky + sticky mobile (commit `67cef04`)
33. ✅ Bannières 6 → 3 fonctions éditoriales (commit `bab7eb7`)
34. ✅ Home + Footer complets (commit `ac45f9f`)
35. ✅ Migrations consolidées sprint 2 (commit `cf8f581`) : 12 cols products + tags.featured_on_home + 4 cols banners + table wishlists + vue v_bestsellers + 7 indexes FK
36. ✅ Système Wishlist (table + API + heart ProductCard + page /favoris, commit `e35b307`)
37. ✅ Admin annonce form refait pour 3 nouvelles variantes bannières (commit `c37a915`)
38. ✅ NavSearch bestsellers fallback no-result (commit `dd0ebaa`)
39. ✅ Footer colonne Produits rétablie + WhatsApp swap (commits `be73c77`, `75bb074`, `0b96938`)
40. ✅ PDP gallery sticky lg:top-32 + pharmacist sans CTA (commits `e4cf800`, `21031b3`)

### Phase 7 — Sessions 2026-05-21 (P1 → P5 + curation home) ✅
- ✅ Page `/marques` data-driven (Server, lit `brands` + count produits + image) — commit `279f462`
- ✅ Filtres URL catalogue (`?brand`, `?range`, `?need`, `?tag=type:slug`) — commit `279f462`
- ✅ `not-found.tsx` design FARMAU (locale + fallback global) — commit `279f462`
- ✅ Routes `/besoins/[slug]` existaient déjà ; Footer câblé proprement
- ✅ Pages légales `/legal/{cgv,mentions-legales,confidentialite,cookies}` + composants shell + CookieBanner — commit `da37dfe`
- ✅ Hub `/account` + 4 pages (`profile` refacto + `reservations` + `security` + `preferences`) + migration `profiles.preferred_locale` + APIs `/api/account/preferences` + `/api/newsletter` GET/DELETE — commit `ac1f9c3`
- ✅ Pages éditoriales statiques `/livraison`, `/faq`, `/pharmacies`, `/manifeste` + traductions FR/EN/ES — commit `46ea917`
- ✅ Admin `/admin/users` + `/admin/newsletter` + cleanup `/admin/my-team` + sidebar section "Clientes" — commit `ebad106`
- ✅ Curation home en DB : 4 produits `is_featured` + 3 tags `featured_on_home` (hydratation, anti-age, protection-solaire)

### Phase 8 — Restant après P5
- ❌ JSON-LD Product schema sur PDP
- ❌ 3 `<img>` restants → `next/image` (CartDrawer, ProductClient×2)
- ❌ Migration `banner_type_enum` strict (legacy text)
- ❌ Saisie contenu PDP (pharmacist_advice, INCI, benefits) sur 353 produits
- ❌ Double opt-in newsletter (provider Resend/Postmark)
- ❌ `focus-visible` global (~50 occurrences)
- ❌ Blog (`posts` table + admin + `/blog` + `/blog/[slug]`)
- ❌ Traductions ES/EN du contenu juridique `/legal/*`
- ❌ Tests d'intégration admin + `/account/*` Playwright
- ❌ Stockage image dédupliqué (`products.image_url` vs `product_images`)

---

## 📌 Points forts identifiés (toujours valides)

- TypeScript strict, 0 erreur `tsc`
- Schéma BDD bien normalisé (3NF sauf cas justifiés)
- RLS appliquée partout, helper `is_user_admin` astucieux pour éviter récursion
- App Router + Server Components utilisés correctement pour catalogue/product
- `next/image` avec `remotePatterns: '**'` (compatible Storage)
- Path alias `@/*` utilisé partout, 0 import relatif
- Tests Vitest qui passent (8/8) + smoke Playwright (4/4)
- Documentation interne à jour (`CLAUDE.md`, `db/README.md`, `docs/HANDOFF.md`)
- Scripts CLI bien structurés (`parse-pdfs`, `seed-import`, `prices:default`, etc.)
- `ContactForm`, login, signup ont des labels HTML corrects
- `globals.css` gère `prefers-reduced-motion`
- **(Nouveau)** i18n complet avec next-intl, hreflang SEO clean
- **(Nouveau)** CI verte sur chaque PR + push main
- **(Sprint 2)** Design system cohérent : ProductCard / NavBar / PDP / Bannières / Home + Footer refondus en 15 commits, 0 régression bloquante
- **(Sprint 2)** Wishlist système complet (table RLS + API + UI optimistic + page dédiée)
- **(Sprint 2)** Couche données débloquée : 12 nouvelles colonnes products + tags.featured_on_home + 4 cols banners + vue v_bestsellers prêtes à recevoir le contenu

---

## Comment lire les rapports

Chaque rapport thématique suit la même structure :
- **Synthèse** en tête (note + top 3)
- **Findings** numérotés avec severity (Critical/High/Medium/Low), file:line, problème, fix
- **Snippets prêts à coller** pour SEO, DX, Database

Ouvrir dans l'ordre selon ton intérêt :
- Tu déploies bientôt en prod publique → **security.md** d'abord (mais critiques majeurs fermés)
- Tu veux du gain rapide → **performance.md** (le SEO est déjà fait)
- Tu veux comprendre la dette → **architecture.md** + **code-quality.md**
- Tu veux améliorer l'a11y → **accessibility.md**
- Tu veux installer du tooling → **developer-experience.md** (largement fait, reste 38 warnings + tests admin)
- Tu vas migrer la BDD → **database.md** (snapshot pattern réservations à étudier en exemple)
