# WS16 — Build / Release / SEO

Audit PRE-V1 en lecture seule — FARMAU (Next.js 15.5.18 App Router + Supabase, Vercel auto-deploy sur push `main`, domaine prod `https://farmau.do`, next-intl FR/ES/EN).
Date : 2026-05-28 · Méthode : lecture code + artefact `.next/` existant (BUILD_ID `mc0huIvOlypohP4iWLUBn`, 2026-05-28 15:42). **Aucun build relancé, pas de MCP.**

---

## Verdict

**GO conditionnel pour V1.** Le build est sain et déployable : aucun blocker P0. Le blocker historique `not-found.tsx` / Footer async est confirmé **levé** (root `not-found.tsx` est un Server Component sans import Footer). La couche SEO technique est solide (metadata/hreflang/x-default/JSON-LD/sitemap/robots sur toutes les pages publiques).

Deux écarts à corriger avant ou juste après le lancement :
- **WS16-01 (P1)** — `src/app/favicon.ico` = ancien favicon Next.js par défaut, servi en plus des favicons par thème → conflit d'icône (la tab / les SERP peuvent montrer le logo Next.js générique).
- **WS16-02 (P1, doc)** — la doc (CLAUDE.md / HANDOFF) affirme que les pages `[locale]` « restent SSG » ; l'artefact prouve le contraire : **0 page prérendue**, tout est dynamique SSR (cause : `createSupabaseServerClient()` → `cookies()`). Pas un bug, mais une attente de perf/coût Vercel fausse et un `revalidate=86400` mort sur les pages statiques.

Le reste = P2 (LocalBusiness pharmacie absent, `url` JSON-LD relatif sur catalogue, twitter card absente, auth pages indexables).

---

## Build / CI

### Build
- `next.config.ts` : propre. `withNextIntl` wrap OK. Headers sécurité (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy) sur `/(.*)`. `images.remotePatterns` ouvert (`https://**`) — pragmatique (Supabase Storage), pas un risque build/SEO. `compress: true`, `generateEtags: false`. **Pas** de `output: 'export'`, `trailingSlash`, ni `productionBrowserSourceMaps` → source maps client **non exposées** en prod (défaut Next = off). ✅
- Blocker historique levé : `src/app/not-found.tsx:1-27` est un Server Component pur (import `next/link` uniquement, pas de Footer). `src/app/[locale]/not-found.tsx` importe le Footer async mais est lui-même async Server Component → légal. ✅
- Artefact `.next/` présent et structurellement complet (BUILD_ID, tous les manifests). Le build le plus récent (15:42) post-date le dernier commit code → cohérent avec « build passe ».

### CI — `.github/workflows/ci.yml`
- Job `ci` : checkout → setup-node 20 → `npm ci` → `lint` → `typecheck` → `test:unit --run` → `build` (avec env Supabase **placeholder** `https://placeholder.supabase.co`). ✅ Le build placeholder marche car les pages sont dynamiques (aucun fetch DB au build).
- Job `e2e` : build + Playwright Chromium avec secrets `NEXT_PUBLIC_SUPABASE_*` + `SUPABASE_SERVICE_ROLE_KEY`. Upload du rapport.
- **WS16-07 (P2)** — `RESEND_API_KEY` absente du build CI : le flux double opt-in n'est jamais exercé en CI (fallback single opt-in seulement). Connu/documenté.

### Husky / lint-staged
- `.husky/pre-commit` → `npx lint-staged` → `eslint --fix --no-warn-ignored` sur `*.{ts,tsx}` stagés. ✅ `database.types.ts` ignoré (eslint.config.mjs). Warnings non bloquants au build.

---

## Env prod requis

| Variable | Requise | Comportement si absente |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Oui** | Pages publiques 500 au runtime (anon client `!`). Build OK (dynamique). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Oui** | Idem. |
| `SUPABASE_SERVICE_ROLE_KEY` (ou alias `SUPABASE_SERVICE_KEY`) | **Oui** | `supabaseAdmin = null` (graceful, `supabaseAdmin.ts:17-22`) → routes `/api/admin/*`, `/api/cart`, `/api/contact` doivent null-check. Pas de crash au boot. |
| `RESEND_API_KEY` | Non | Newsletter passe en single opt-in (documenté). |
| `RESEND_FROM_EMAIL` | Non | Défaut côté `resend.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Non | `getSiteUrl()` (`csrf.ts:16-18`) fallback `VERCEL_URL` → `https://farmau.do`. CSRF origin check (`csrf.ts:8-13`) accepte localhost + SITE_URL + VERCEL_URL. ✅ Absente de `.env.local.example` — voir WS16-09. |

**Crash gracieux** : `supabaseAdmin` est le seul singleton qui null-check. Les clients anon/server utilisent `process.env.X!` (non-null assertion) → si l'URL/anon key manque, **crash au premier appel runtime** (pas au build). Acceptable : ces 2 vars sont obligatoires et leur absence est une mauvaise config Vercel, pas un cas nominal. `metadataBase = new URL("https://farmau.do")` est en dur → pas de dépendance env pour les canonicals.

---

## SEO

### Metadata
- `generateMetadata` présent sur **toutes** les pages publiques indexables (home, catalogue, marques + [slug], besoins/[slug], product/[slug], blog + [slug], a-propos, contact, livraison, faq, pharmacie, manifeste, legal×4).
- `title` / `description` via namespace `PageMeta.*` (i18n) ou DB (product/blog/brand dynamiques).
- `metadataBase` = `https://farmau.do` (root layout `layout.tsx:31`). `openGraph.siteName = "FARMAU"` en dur (`layout.tsx:33`) — reco connue (lire `shop_settings`) volontairement non faite pour ne pas forcer le dynamic ; commentaire explicite `layout.tsx:24-27`. ✅ acceptable.
- **WS16-05 (P2)** — **aucune `twitter` card** déclarée nulle part (`grep twitter` = 0 hit). Next-intl/Next fait un fallback partiel sur OG pour `twitter:*`, mais pas de `twitter:card=summary_large_image` explicite → preview Twitter/X dégradée. Effort faible.

### Pages privées
- `cart` (`robots:{index:false,follow:false}`, `cart/page.tsx:27-28`), `account/*` (noindex, force-dynamic). ✅
- **WS16-06 (P2)** — pages `(auth)` (`/login`, `/signup`, `/forgot-password`, `/reset-password`) sont des Client Components **sans `generateMetadata` ni noindex**, et ne sont **pas** dans `robots.txt` (seul `/auth/` callback est disallow, pas `/[locale]/login`). → indexables. Faible valeur, faible risque (hors sitemap), mais idéalement `index:false`.

### hreflang
- `buildLanguageAlternates(path)` (`seo.ts:34-41`) → 3 locales + `x-default` (→ fr). `localizedPath` gère `/` → `/<locale>`. ✅
- Appliqué de façon cohérente : home, catalogue, marques, marques/[slug], besoins/[slug], product/[slug], blog, blog/[slug], legal. URLs relatives résolues contre `metadataBase`. ✅

### JSON-LD
- **Product** (`ProductJsonLd.tsx`) — PDP, avec `offers`/`price.toFixed(2)`/`availability` calculée depuis stock/`itemCondition`/`seller`. ✅ Valide.
- **Article** (`BlogPostJsonLd.tsx`) — posts, `headline`/`author`(Person|Organization)/`publisher`/`mainEntityOfPage` avec `@id` absolu. ✅ Valide.
- **CollectionPage** (catalogue `page.tsx:180-187`, marques `page.tsx:144`) — `name`/`description`/`numberOfItems`. ⚠️ **WS16-04 (P2)** : `url: localizedPath(locale, '/catalogue')` = path **relatif** (`/fr/catalogue`) ; schema.org attend une URL absolue. À préfixer `https://farmau.do`.
- **WS16-03 (P2)** — **aucun `Organization` ni `LocalBusiness`/`Pharmacy`**. La page `/pharmacie` décrit un lieu physique avec adresse (`pharmacie/page.tsx:104-105`) mais n'émet pas de `Pharmacy`/`LocalBusiness` JSON-LD (NAP, geo, openingHours) → manque pour le SEO local RD (Google Maps / pack local). Vrai gap pour une pharmacie click & collect.

### sitemap.ts / robots.ts
- `sitemap.ts` : statiques (14 paths × 3 locales avec hreflang) + produits actifs + brands + besoins (`tags_with_types` type `besoins`) + blog posts publiés, tous × 3 locales avec `alternates.languages`. `lastModified` depuis `updated_at` (produits/blog) sinon `now`. ✅
- **Note** : le sitemap utilise `createSupabaseServerClient()` → `cookies()` → **dynamique** (régénéré par requête). Pour le volume actuel (~353 produits, < 5 000) c'est OK ; pas de sitemap index. En CI placeholder, les fetch échouent silencieusement (`data ?? []`) → sitemap = entrées statiques seulement, build non cassé. ✅
- `robots.ts` : disallow `/admin/`, `/api/`, `/account/`, `/auth/`, `/cart`, `/*/cart`. Sitemap + host référencés. ✅ Cohérent.

### OG images
- Dynamique sur `marques/[slug]` (`page.tsx:74-94`) et `besoins/[slug]` (`page.tsx:81-101`) — query 1 image produit représentative, fallback gracieux si null. ✅
- **WS16-08 (P2)** — **pas d'image OG par défaut** statique (`public/` ne contient ni `og-image.png` ni équivalent ; seul `placeholder.png` existe). Home + pages éditoriales sans image partagent un preview social sans visuel. Effort faible (1 asset + `openGraph.images` au root).

### Favicons par thème
- `<link rel=icon>` injecté dynamiquement dans le `<head>` du root layout selon le thème actif (`layout.tsx:67-69`) : `{theme}-32.png`, `-16.png`, `-180.png` (apple-touch). 24 fichiers présents dans `public/favicons/` = 6 thèmes (terra/noir/botanico/coral/marino/ambar, alignés `THEME_NAMES` `themes.ts:11`) × 4 tailles. ✅
- **WS16-01 (P1)** — `src/app/favicon.ico` = **ancien favicon Next.js par défaut** (60 KB, daté jul 2025, NON régénéré par `build-favicons.cjs` qui n'écrit que `public/favicons/*.png`). Next.js sert ce fichier à `/favicon.ico` ET émet automatiquement `<link rel="icon" href="/favicon.ico">`. Résultat : double déclaration favicon, le `.ico` générique Next pouvant l'emporter dans certains contextes (onglet, SERP, bookmarks) malgré les PNG par thème. → supprimer/remplacer `src/app/favicon.ico` par un `.ico` FARMAU (ou le retirer pour laisser les PNG décider).

### Canonical / trailing slash / redirection locale
- Canonical via `alternates.canonical = localizedPath(...)` relatif au `metadataBase`. ✅
- `localePrefix: 'always'` (CLAUDE.md) → `/` redirige vers `/<locale>` détectée (middleware next-intl `middleware.ts:43`). Pas de trailing slash (défaut Next). ✅
- Sur preview Vercel : canonicals/OG pointent vers `https://farmau.do` (metadataBase en dur) — correct pour le canonical (on veut pointer la prod), à garder en tête pour les tests de preview.

### Release / hygiène prod
- **0** `console.*` brut / `debugger` dans `src/` (hors `logger.ts`). ✅ `logger.error/warn` conservent `console.error/warn` en prod (capturés par Vercel ; `Error` réduit à `{message,stack}`, `logger.ts:3-8`) → pas de fuite d'objet sensible. `logger.info` muet en prod.
- Pas de source maps client en prod. Versioning : `package.json` `0.1.0` (pas de tag de release — cosmétique).

---

## Findings

| ID | Sév | Preuve | Impact | Reco | Effort | Statut |
|---|---|---|---|---|---|---|
| WS16-01 | P1 | `src/app/favicon.ico` (ancien défaut Next, 60 KB ; `scripts/build-favicons.cjs` n'écrit que `public/favicons/*.png`) | `/favicon.ico` générique Next servi + `<link>` auto, en concurrence avec les favicons par thème → logo Next.js possible en tab/SERP | Remplacer par un `.ico` FARMAU (ou retirer le fichier ; générer le `.ico` dans le script favicons) | S | Confirmé |
| WS16-02 | P1 (doc/perf) | `.next/prerender-manifest.json` (0 route statique) + `supabaseServer.ts:10` `await cookies()` utilisé par home/catalogue/marques/besoins/blog/product | Doc affirme `[locale]` « SSG » ; réalité = 100 % SSR dynamique → coût/perf Vercel ≠ attente, `revalidate=86400` mort sur faq/legal/manifeste/pharmacie | Corriger la doc ; si SSG voulu, isoler les pages statiques du client cookie (anon sans cookies) | M | Confirmé |
| WS16-03 | P2 | `/pharmacie/page.tsx:104-105` (adresse, aucun JSON-LD) ; `grep LocalBusiness` = 0 | Pas de `Pharmacy`/`LocalBusiness` ni `Organization` → SEO local RD faible (Maps / pack local) | Ajouter JSON-LD `Pharmacy` (NAP, geo, openingHours) sur `/pharmacie` + `Organization` au root | S | Confirmé |
| WS16-04 | P2 | `catalogue/page.tsx:185` `url: localizedPath(locale,'/catalogue')` ; idem marques | `CollectionPage.url` relatif (`/fr/catalogue`) — schema.org attend absolu | Préfixer `https://farmau.do` | S | Confirmé |
| WS16-05 | P2 | `grep twitter src/` = 0 | Pas de `twitter:card` explicite → preview X/Twitter dégradée (fallback OG partiel) | Ajouter `twitter:{card:'summary_large_image'}` au root metadata | S | Confirmé |
| WS16-06 | P2 | `(auth)/login|signup|forgot|reset/page.tsx` Client, sans metadata/noindex ; absent de `robots.ts` | Pages auth indexables (faible valeur) | `robots:{index:false}` ou disallow `/*/login` etc. | S | Confirmé |
| WS16-07 | P2 | `ci.yml:38-40,57-61` (pas de `RESEND_API_KEY`) | Double opt-in jamais exercé en CI (single opt-in seulement) | Ajouter secret optionnel ou test e2e dédié (connu) | S | Confirmé |
| WS16-08 | P2 | `public/` sans og-image (seul `placeholder.png`) | Home + éditoriales sans visuel de partage social | Ajouter `openGraph.images` par défaut au root + 1 asset | S | Confirmé |
| WS16-09 | P2 | `.env.local.example` (pas de `NEXT_PUBLIC_SITE_URL`) alors que `csrf.ts:6` le lit | Var optionnelle non documentée → CSRF origin allowlist incomplète sur domaines custom hors farmau.do/Vercel | Documenter `NEXT_PUBLIC_SITE_URL` dans `.env.local.example` | S | Confirmé |

Aucun **P0**.

---

## Tableau récap

| Dimension | État | Note |
|---|---|---|
| Build (`next.config.ts`, artefact) | ✅ Sain, blocker not-found levé | A |
| CI (lint+typecheck+vitest+build+e2e) | ✅ Complet (RESEND non testé) | A− |
| Husky / lint-staged | ✅ | A |
| Env prod (graceful degradation) | ✅ `supabaseAdmin` null-safe ; anon obligatoire | A− |
| Metadata (title/desc/OG par page) | ✅ Toutes pages publiques | A |
| hreflang + x-default + canonical | ✅ Cohérent | A |
| JSON-LD Product / Article / CollectionPage | ✅ (url relatif catalogue, P2) | A− |
| JSON-LD Organization / LocalBusiness | ❌ Absent (pharmacie) | C |
| sitemap.ts / robots.ts | ✅ Dynamique, hreflang, disallow OK | A |
| OG images dynamiques (marques/besoins) | ✅ ; défaut absent (P2) | B+ |
| Favicons par thème | ✅ 24 PNG ; `favicon.ico` parasite (P1) | B |
| Twitter card | ❌ Absent (P2) | C |
| Release (console/source maps/versioning) | ✅ 0 console brut, pas de source maps client | A |

**Verdict global build/release/SEO : A− — GO conditionnel V1.** Corriger WS16-01 (favicon parasite) avant lancement (impact branding/SERP immédiat) ; WS16-02 est une correction de doc + décision perf. Le reste (P2) est post-launch.
