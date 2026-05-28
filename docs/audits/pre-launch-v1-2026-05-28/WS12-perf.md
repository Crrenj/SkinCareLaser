# WS12 — Performance (audit PRE-V1, lecture seule)

Date : 2026-05-28 · Auditeur : Claude Opus 4.7 · Périmètre : stratégie de rendu (SSG/ISR vs dynamic), `cache()`/`unstable_cache`, code splitting, `next/image`, polices, requêtes Supabase par page, bundle JS, Web Vitals, config Next.

Méthode : analyse statique du code + **artefact `.next/` existant** (BUILD_ID `mc0huIvOlypohP4iWLUBn`, 28 mai 15:42-15:43). **Aucun build relancé**, aucun MCP Supabase.

---

## Verdict

**Note : C+ (régression par rapport au A-/B+ annoncé).**

Les briques perf de bas niveau sont saines (images 100 % `next/image`, polices self-hosted `display:swap`, code splitting `next/dynamic` présent, `optimizePackageImports`, bundle raisonnable, `Promise.all` sur la home). **MAIS** le contrat de rendu est cassé : **la totalité du site public rend en `dynamic` (SSR par requête)** — confirmé par le build manifest, pas par déduction. Les 14 `export const revalidate` (60s / 300s / 86400s) sont **inopérants**. Chaque hit paie un SSR complet + les requêtes Supabase synchrones, sans cache HTML edge. C'est le P0 de ce workstream : ce n'est pas une micro-optim, c'est le modèle de coût/latence de tout le front public en production.

Le système de thèmes n'est **PAS** la cause (contrairement à la suspicion du brief) : `getThemeConfig()` est correctement écrit « sans cookies » + `unstable_cache`. La régression vient de `getLocale()` (root layout) et de `getShopSettings()` (Footer), tous deux antérieurs au thème.

---

## Conclusion SSG vs dynamic (preuve manifest)

**Conclusion : 0 page publique prérendue. Tout `[locale]/*` est dynamic (SSR par requête).** Confirmé indépendamment, pas suspecté.

Preuves issues de l'artefact `.next/` :

1. **`.next/prerender-manifest.json`** → `routes` contient **uniquement** `/favicon.ico` et `/robots.txt`. `dynamicRoutes: {}` (vide). **Aucune** route `[locale]` n'y figure (ni SSG, ni ISR prérendu).
2. **`find .next/server/app -name "*.html"` → 0 fichier.** Aucun `.rsc`, aucun `.meta` de page prérendue non plus. Les dossiers `server/app/{fr,es,en}` ne contiennent que des sous-dossiers `account`/`legal` **vides** (artefacts de route groups), pas de HTML.
3. **`.next/routes-manifest.json`** : les 28 pages `/[locale]/*` sont **toutes dans `dynamicRoutes` (37 entrées)**, jamais dans `staticRoutes` (19 entrées = exclusivement `/api/*` + shells `/admin/*`).
4. **`.next/diagnostics/build-diagnostics.json`** : `"buildStage": "static-generation"` — l'étape a tourné mais n'a produit **aucun** HasML `[locale]`, cohérent avec un opt-out dynamique global.

**Cause racine (double, indépendante) :**

- **A — `src/app/layout.tsx:52` : `const locale = await getLocale()`.** `getLocale()` (next-intl 4.12) résout `src/i18n/request.ts`, dont la branche fallback fait `await cookies()` (`request.ts:27`, lecture du cookie `farmau_admin_locale`). Le **root layout n'a pas le param `locale`** donc ne peut pas appeler `setRequestLocale()` → `requestLocale` est indéfini → la branche `cookies()` est empruntée → **lecture de cookie dans un layout = opt-out dynamique de TOUT l'arbre.** Introduit au commit `bb95ef6` (« dynamic html lang from getLocale »), bien avant le thème. La « promesse SSG » de CLAUDE.md est fausse depuis ce commit.
- **B — `src/components/Footer.tsx:58` : `await getShopSettings()` → `createSupabaseServerClient()` → `cookies()` (`supabaseServer.ts:10`).** Le Footer est monté sur ~15 pages publiques (home, catalogue, a-propos, blog, contact, faq, favoris, livraison, manifeste, marques, pharmacie, reservation, cart, not-found). Vecteur **indépendant** de A : même en corrigeant le root layout, ces pages resteraient dynamic. `getShopSettings()` est aussi appelé directement par a-propos / pharmacie.

**Nuance importante** : `catalogue` lit `searchParams` (`?brand`/`?sort`/`?page`) → reste légitimement dynamic même après correction de A+B. Idem `account/*`, `reservation*`, `favoris` (`force-dynamic` justifié, user-dépendant). Les pages qui *devraient* redevenir SSG/ISR après correction : home, product/[slug], marques, marques/[slug], besoins/[slug], blog, blog/[slug], faq, legal×4, livraison, manifeste, pharmacie, a-propos.

---

## Findings

### WS12-01 · P0 · confirmé — Tout le site public rend en dynamic : `revalidate` ignoré, SSR + requêtes Supabase à chaque hit
- **Preuve** : `.next/prerender-manifest.json` (`routes` = favicon+robots only) ; `find .next/server/app -name "*.html"` = 0 ; `routes-manifest.json` (28 pages `[locale]` en `dynamicRoutes`). Cause : `src/app/layout.tsx:52` `getLocale()` → `src/i18n/request.ts:27` `cookies()` + `src/components/Footer.tsx:58` `getShopSettings()` → `cookies()`.
- **Impact** : les `revalidate=60/300/86400` de 14 pages sont morts. Chaque visite = SSR complet + round-trips Supabase synchrones :
  - **home** : 5 groupes parallèles (banners, bestsellers [2 req], brands, quote, featuredNeeds [1+3 count]) → ~8 requêtes DB/hit, **à chaque requête**.
  - **catalogue** : `.limit(500)` produits + nested joins (images, range→brand, tags) + `tags_with_types` → ~353 lignes hydratées **par hit**.
  - **legal/faq/manifeste** (contenu statique, `revalidate=86400`) : re-render + (si Footer) re-query `shop_settings` **à chaque hit** alors qu'ils ne changent jamais.
  - Pas de cache HTML edge Vercel → TTFB élevé, coût compute + coût DB Supabase (plan facturé à la requête/compute) qui scale linéairement avec le trafic. Pour un lancement, c'est le risque n°1 (un pic de trafic = pic de requêtes DB).
- **Reco** : (1) sortir `getLocale()` du root layout — fournir `<html lang>` + injection thème via un layout qui possède la locale, ou accepter `lang` posé par `[locale]/layout` (qui fait déjà `setRequestLocale`) ; ne **jamais** lire de cookie dans le chemin du root layout. (2) Faire lire `shop_settings` au Footer/pages éditoriales via un client **anon sans cookies + `unstable_cache`**, sur le modèle exact de `getThemeConfig.ts` (tag `shop-settings`, invalidé par `/api/admin/settings`). RLS `shop_settings` = public SELECT donc le contexte cookie est inutile. Les **deux** corrections sont nécessaires ensemble (corriger une seule laisse l'autre forcer dynamic).
- **Effort** : M (refactor ciblé, 2 fichiers + 1 nouveau helper). Co-traité avec WS01-01/02 (même racine).

### WS12-02 · P1 · confirmé — Catalogue : fetch de 500 produits + joins imbriqués par requête, pagination seulement en mémoire
- **Preuve** : `src/app/[locale]/catalogue/page.tsx:91-116` `.limit(500)` avec joins `product_images`, `range→brand`, `product_tags→tags_with_types` ; pagination par `.slice(startIndex, +PRODUCTS_PER_PAGE)` côté serveur (`:174-176`) APRÈS le fetch complet.
- **Impact** : la « server-side pagination » documentée (`performance.md` finding #5, commit `e2314c2`) est **partielle** : le payload **client** est bien limité à 24 produits, mais le **fetch DB ramène toujours ~353 lignes + joins à chaque requête** (et comme la page est dynamic — WS12-01 — sans aucun cache ISR pour amortir). C'est le hit DB le plus lourd du site. Le filtrage/tri/facettes sont aussi calculés en mémoire sur les 500 lignes à chaque hit.
- **Reco** : passer à une vraie pagination DB (`.range(start, end)`) avec `count: 'exact'` pour le total, et pousser les filtres (brand/range/need/tag) dans la query Supabase plutôt qu'en mémoire. Les facettes (compteurs sidebar) peuvent venir d'une requête agrégée séparée mise en cache. Indépendant de WS12-01 mais le gain réel n'arrive qu'une fois le dynamic maîtrisé (le `searchParams` garde la page dynamic — d'où l'intérêt d'alléger la query elle-même).
- **Effort** : M.

### WS12-03 · P2 · confirmé — Trois librairies d'icônes coexistent ; `@heroicons` hors `optimizePackageImports`
- **Preuve** : `package.json` → `lucide-react` (73 fichiers), `react-icons` (5 fichiers, glyphes sociaux/WhatsApp), `@heroicons/react` (5 fichiers : contact public + 4 admin). `next.config.ts:9` `optimizePackageImports: ['lucide-react', 'react-icons']` — **`@heroicons/react` non couvert**.
- **Impact** : redondance de dépendances (3 libs pour des icônes). `@heroicons` se tree-shake via imports par chemin (`/24/outline`) donc l'impact bundle est faible, mais c'est de la dette ; `react-icons` n'est utilisé que pour `SiWhatsapp`/social — remplaçable par lucide ou SVG inline pour éliminer une dépendance.
- **Reco** : (a) ajouter `@heroicons/react` à `optimizePackageImports` (gain immédiat, 0 risque) ; (b) à terme, migrer les 5 usages heroicons + les 5 usages react-icons vers lucide-react (déjà dominant) et retirer 2 dépendances. Le seul usage public de heroicons est `contact/page.tsx` (4 icônes).
- **Effort** : S (a) / M (b).

### WS12-04 · P2 · suspecté — `remotePatterns: hostname '**'` : optimiseur d'images ouvert à tout hôte HTTPS
- **Preuve** : `next.config.ts:61-67` `protocol: 'https', hostname: '**', pathname: '/**'`.
- **Impact** : `/_next/image` peut proxifier/optimiser des images depuis **n'importe quel** hôte HTTPS → vecteur d'abus de bande passante (l'optimiseur Vercel est facturé) et cache-poisoning d'images tierces. Sources réelles = Supabase Storage (host connu) + `cover_image_url` blog (saisie admin). Aussi relevé côté archi (WS01-04).
- **Reco** : restreindre `hostname` au host Supabase Storage (`adxpoxcynrpnbbxnncsk.supabase.co`) + éventuellement le domaine prod. Effet perf indirect (maîtrise du coût optimiseur) + sécurité.
- **Effort** : S.

### WS12-05 · P2 · confirmé — `fetchHomeQuote` : `Math.random()` au rendu → re-query inutile (et incompatible avec un futur ISR)
- **Preuve** : `src/app/[locale]/page.tsx:249-268` — fetch 10 produits avec `pharmacist_advice`, puis `data[Math.floor(Math.random()*data.length)]` à chaque render.
- **Impact** : sous dynamic (état actuel), c'est une requête DB de plus par hit home, dont le résultat varie à chaque chargement (pas un bug visible, mais coût). Une fois la home repassée en ISR (objectif WS12-01), le `Math.random()` gèlera sur une seule valeur par revalidation — comportement « aléatoire » trompeur. À reconsidérer en même temps que la correction du rendu.
- **Reco** : si la rotation est voulue, la faire côté client (composant client qui pioche au mount) pour ne pas bloquer le SSR/cache ; sinon choix déterministe (ex. tri stable). Mineur.
- **Effort** : S.

### WS12-06 · P2 · suspecté — `generateEtags: false` : pas de validation conditionnelle (304) sur réponses dynamiques
- **Preuve** : `next.config.ts:78` `generateEtags: false`.
- **Impact** : sans ETag, pas de revalidation conditionnelle `If-None-Match`/304 pour les réponses HTML/API. Tant que le site est dynamic (WS12-01), chaque hit retransfère le corps complet (pas de 304 économisant la bande passante). `compress: true` (`:75`) compense partiellement (gzip/br des réponses). Une fois en ISR + cache CDN, l'impact ETag devient quasi nul (le cache edge prend le relais), donc à corriger seulement si on reste partiellement dynamic.
- **Reco** : réévaluer après WS12-01. Si des routes dynamiques significatives subsistent, repasser `generateEtags` à la valeur par défaut (true) pour activer les 304. `compress: true` : OK, garder.
- **Effort** : S.

---

## Tableau récap

| ID | Sév | Finding | Preuve | Effort | Statut |
|---|---|---|---|---|---|
| WS12-01 | **P0** | Tout le public en dynamic → `revalidate` ignoré, SSR + DB à chaque hit | `.next/prerender-manifest.json` ; `routes-manifest.json` ; `layout.tsx:52` ; `Footer.tsx:58` | M | confirmé |
| WS12-02 | P1 | Catalogue : fetch 500 produits + joins/hit, pagination en mémoire seulement | `catalogue/page.tsx:91-116,174-176` | M | confirmé |
| WS12-03 | P2 | 3 libs d'icônes ; `@heroicons` hors `optimizePackageImports` | `package.json` ; `next.config.ts:9` | S/M | confirmé |
| WS12-04 | P2 | `images.remotePatterns` hostname `**` (optimiseur ouvert) | `next.config.ts:61-67` | S | suspecté |
| WS12-05 | P2 | `fetchHomeQuote` `Math.random()` au rendu : req inutile + KO en ISR | `[locale]/page.tsx:249-268` | S | confirmé |
| WS12-06 | P2 | `generateEtags:false` : pas de 304 sur réponses dynamiques | `next.config.ts:78` | S | suspecté |

---

## Points sains (à conserver)

- **Système de thèmes correctement isolé pour la perf** : `getThemeConfig()` (`src/lib/getThemeConfig.ts`) = client anon **sans cookies** + `unstable_cache(['shop-theme-config-v1'], { tags:[THEME_CONFIG_TAG], revalidate:300 })`, invalidé par `revalidateTag` au PATCH `/api/admin/appearance`. Il **ne force PAS** le dynamic. La suspicion du brief (« le thème casse le SSG ») est **infirmée** : la régression SSG est antérieure et vient de `getLocale()`/Footer. Le thème est même le **bon modèle** à répliquer pour corriger WS12-01.
- **`getShopSettings()` dédupliqué par requête** via React `cache()` (`getShopSettings.ts:45`) → plusieurs Server Components dans le même render = 1 seule query. (Le problème n'est pas la dédup mais l'usage de `cookies()` — cf. WS12-01.)
- **Code splitting** : `next/dynamic` sur `CatalogueClient`, `ProductClient`, `CartClient`, `ReservationClient`, chacun avec un `loading:` skeleton (`animate-pulse`, dimensions fixes → pas de CLS). Pas de gros composant client chargé eagerly détecté. Bundle d'icônes optimisé via `optimizePackageImports` (lucide/react-icons).
- **`next/image` partout** : `grep "<img "` = **0** balise brute. PdpGallery image principale `priority` (`PdpGallery.tsx:58`), thumbnails dimensionnées 64×64 lazy par défaut. ProductCard `width/height` (`400×500`) + conteneur `aspect-[4/5]` → CLS maîtrisé. Formats `webp`+`avif`, 8 deviceSizes. **HomeHero = SVG inline** (pas d'image raster LCP réseau — excellent pour le LCP de la home).
- **Polices** : `next/font/google` self-hosté au build (Instrument_Serif + Be_Vietnam_Pro), `display: "swap"` sur les deux (`layout.tsx:14,21`), `subsets:["latin"]`, exposées en variables CSS. Pas de FOIT, pas d'`@import` Google Fonts externe dans `globals.css`. Conforme.
- **Bundle JS** : plus gros chunk ~186 KB (non gzip), framework 182 KB, main 128 KB — pas de vendor chunk monstrueux. `framer-motion` retiré (vérifié absent de `package.json`), `splitChunks` custom retiré.
- **Requêtes home parallélisées** : `Promise.all` sur 5 groupes (`[locale]/page.tsx:117`), selects à colonnes explicites (pas de `select('*')` côté produit), `.limit()` présents. N+1 sur `featuredNeeds` (1+3 count) borné à 3 — négligeable.
- **`force-dynamic` légitime** : `account/*` (5), `reservation` + `confirmation/[id]`, `favoris` — tous user-dépendants. `catalogue` dynamic via `searchParams` (légitime).

---

## Note de réconciliation

Ce workstream **corrobore indépendamment** le finding majeur de WS01 (WS01-01/02) via l'angle perf : même build manifest, même double cause racine (`getLocale()` + Footer/`getShopSettings`), même infirmation de la suspicion « thème ». WS01 classe la SSG cassée en P1 (frontières de rendu) ; WS12 la classe **P0** car, sous l'angle perf/coût en production, c'est le modèle de charge DB+compute de tout le front public qui est en jeu au lancement. À corriger conjointement (un seul refactor ferme les deux).

**Limite de l'audit** : analyse statique + manifest, pas de mesure runtime. Pour quantifier : mesurer le TTFB de `/fr` en prod et compter les requêtes Supabase par hit (devrait montrer banners+bestsellers+tags+shop_settings à chaque requête = signature dynamic). Build non relancé (artefact du 28 mai 15:42 utilisé).
