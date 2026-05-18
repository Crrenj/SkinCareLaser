# Audit Performance

## Synthèse

Note globale : **C+ (5/10)**. L'architecture App Router + Server Components est saine, mais quatre points pénalisent le TTFB et le LCP :

1. **Aucune route n'est cacheable** — toutes les pages publiques (`/`, `/catalogue`, `/product/[id]`) appellent Supabase à chaque requête sans `revalidate`/`unstable_cache`. Le catalogue refait 2 requêtes (353 produits potentiels + tous les tags) à chaque visiteur.
2. **Aucun index DB sur les jointures chaudes** — `product_ranges.range_id`, `product_tags.product_id/tag_id`, `product_images.product_id`. À 353 produits ça passe, mais l'audit `/product/[id]` qui fait un `limit(50)` sans index full scan systématiquement.
3. **5 `<img>` non optimisés** sur la fiche produit (`ProductClient.tsx:67,79`) + admin → aucun WebP/AVIF servi, aucun lazy loading, aucun srcset. Sur 299 images Storage, ce sont les plus visibles (page produit) qui ratent l'optimisation.
4. **Middleware `/admin/*` fait 2 round-trips Supabase** (getSession + profiles) à chaque navigation interne admin, et le layout admin client refait le même check. Cumul : ~200-400 ms par navigation admin.

**Top 3 quick wins** :
- Ajouter `export const revalidate = 60` (ou 300) sur `catalogue/page.tsx`, `product/[id]/page.tsx`, `page.tsx` (home) → -200 à -800 ms TTFB en cache hit.
- Remplacer les 5 `<img>` de `ProductClient.tsx` et admin par `next/image` → -30 à -60% de poids image sur la fiche produit (LCP).
- Ajouter `CREATE INDEX` sur `product_ranges(range_id)`, `product_tags(product_id)`, `product_images(product_id)` → product/[id] passe de 3 requêtes plein-scan à 3 lookups index.

## Métriques attendues / observées

Source : `.next/static/chunks/`, `.next/prerender-manifest.json`, `.next/routes-manifest.json` (build du 18 mai).

| Item | Observé | Cible |
| --- | --- | --- |
| Bundle `vendors-*.js` | **864 KB** (non gzippé) | < 300 KB gzippé |
| `polyfills-*.js` | 113 KB | OK (legacy browsers) |
| Shared client JS (logué dans le build) | ~260 KB | ~150 KB |
| Page bundle (`catalogue`, `product`, `cart`) | 4-16 KB | OK |
| Admin bundles | 5-25 KB par page | OK |
| Routes statiques (build) | 19/34 | OK |
| Routes dynamiques (build) | 6 API + `/product/[id]` | catalogue devrait être ISR |
| Pages avec HTML pré-rendu | `/a-propos`, `/cart`, `/contact`, `/admin/*` (shell), login/signup | manquent `/`, `/catalogue`, `/product/[id]` |
| Indexes DB sur produits/tags/ranges | **0** (hors PK) | 5-6 indexes |
| `<img>` sans `next/image` | 5 occurrences | 0 |
| Round-trips DB middleware admin | 2 (session + profile) | 1 (JWT claim ou cache) |

Note bundle : le vendor de 864 KB inclut `@supabase/ssr` + `@supabase/supabase-js` (~200 KB), `@supabase/auth-helpers-nextjs` (déclaré mais **jamais importé** — vérifié par grep, OK, tree-shaké), React/RDOM (~140 KB), SWR, lucide-react (~50 KB tree-shaké). `framer-motion` est déclaré dans `package.json:28` mais aucun import dans `src/` — dépendance morte.

## Findings

### 1. Aucune politique de cache sur les pages Server Components — Impact: High

**Fichiers** :
- `src/app/catalogue/page.tsx:21`
- `src/app/product/[id]/page.tsx:84`
- `src/app/page.tsx:23`

**Problème** : Aucune des Server Pages publiques n'exporte `revalidate`, `dynamic`, ni n'utilise `unstable_cache`. Le `createSupabaseServerClient()` lit les cookies via `next/headers` (`src/lib/supabaseServer.ts:10`), ce qui force Next à marquer la route en `force-dynamic` implicite — confirmé par l'absence de pré-rendu HTML pour `catalogue/` et `product/[id]/` dans `.next/server/app/`. Chaque visiteur déclenche : 2 requêtes Supabase pour `/catalogue` (produits + tags), 3 pour `/product/[id]`, 1 pour `/` (banners).

**Gain attendu** : 200-800 ms TTFB en cache hit (selon RTT Supabase). Économise ~100 % des appels DB sur le trafic catalogue répété.

**Fix** :
```ts
// src/app/catalogue/page.tsx (ligne 1)
export const revalidate = 300 // 5 min

// src/app/page.tsx
export const revalidate = 60

// src/app/product/[id]/page.tsx
export const revalidate = 300
```
Alternative plus fine : wrapper les fetchs Supabase avec `unstable_cache({ tags: ['products'] })` et déclencher `revalidateTag('products')` depuis les routes admin après mutation (CRUD products). Permet d'invalider à la demande sans TTL.

---

### 2. Aucun index sur les FK chaudes — Impact: High

**Fichier** : `db/schema.sql:54-126`

**Problème** : Les tables `product_ranges` (l.86), `product_tags` (l.113), `product_images` (l.120) n'ont que leur PRIMARY KEY composite. La colonne `range_id`, `product_id`, `tag_id`, `tag_type_id` n'a **aucun index secondaire**. Conséquence : la requête `src/app/product/[id]/page.tsx:108-115` `eq('product_ranges.range_id', rangeId)` et le `limit(50)` ligne 119 font un seq scan complet, idem pour le `tags_with_types` (JOIN tag_types) sur 50 candidates × N tags. À 353 produits ça passe mais croît en O(n×m).

**Gain attendu** : product/[id] passe de ~150 ms à ~30 ms côté DB. Plus visible à partir de ~2000 produits.

**Fix** :
```sql
CREATE INDEX IF NOT EXISTS idx_product_ranges_range_id   ON public.product_ranges(range_id);
CREATE INDEX IF NOT EXISTS idx_product_ranges_product_id ON public.product_ranges(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id   ON public.product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id       ON public.product_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_type_id          ON public.tags(tag_type_id);
CREATE INDEX IF NOT EXISTS idx_ranges_brand_id           ON public.ranges(brand_id);
```

---

### 3. 5 `<img>` non optimisés — Impact: High

**Fichiers** :
- `src/components/ProductClient.tsx:67` (image principale fiche produit, **LCP candidate**)
- `src/components/ProductClient.tsx:79` (galerie secondaire ×N)
- `src/components/CartDrawer.tsx:185` (panier drawer)
- `src/components/admin/ImageUpload.tsx:96`
- `src/components/admin/DirectImageUpload.tsx:119`

**Problème** : `ProductClient.tsx:67` est l'image au-dessus de la ligne de flottaison sur `/product/[id]` (LCP candidate). En `<img>` brut, le navigateur reçoit l'original Supabase Storage (PNG/JPG plein format), pas le WebP/AVIF configuré dans `next.config.ts:47`. Aucun srcset, aucune lazy loading sous le fold pour la galerie.

**Gain attendu** : -40 à -70 % de poids image sur la fiche produit. LCP qui passe typiquement de 2-3 s à 0.8-1.5 s sur 3G/4G.

**Fix** : Remplacer par `next/image` avec `priority` sur l'image principale et `sizes` adapté :
```tsx
import Image from 'next/image'

<Image
  src={product.images[0].url}
  alt={product.images[0].alt || product.name}
  width={800} height={800}
  className="w-full h-full object-contain"
  priority
  sizes="(max-width: 1024px) 100vw, 50vw"
/>
// galerie secondaire : sans priority, avec sizes="(max-width:768px) 25vw, 100px"
```
Pour le panier (`CartDrawer.tsx:185`) : conserver `<img>` est ok (déjà 64×64, dans un drawer hors flux critique), ou utiliser `next/image` avec `width={64} height={64}`.

---

### 4. Middleware admin : 2 round-trips Supabase à chaque requête — Impact: Medium

**Fichier** : `src/middleware.ts:61-74`

**Problème** : Le middleware appelle `supabase.auth.getSession()` (ligne 61) puis `from('profiles').select('is_admin')` (ligne 70-74) sur **chaque** navigation `/admin/*`. À chaque clic dans le dashboard (10+ navigations / session admin) : ~80-200 ms cumulés. Les Edge Runtime de middleware paient le coût SSL+JWT verify *plus* un round-trip DB. Le check est re-fait côté layout client (`src/app/admin/layout.tsx`), donc effectivement 3×.

**Gain attendu** : -50 à -150 ms par navigation admin.

**Fix** : Stocker `is_admin` dans le JWT en utilisant le hook custom-claims de Supabase (`app_metadata.role === 'admin'`), puis lire `session.user.app_metadata.role` au lieu d'une requête DB. La couche `admin_users` est déjà conçue dans ce sens (voir `db/schema.sql:46`). Migration :
1. Trigger Postgres qui set `app_metadata.role = 'admin'` quand un user est inséré dans `admin_users`.
2. Middleware lit `session.user.app_metadata?.role === 'admin'` — pas de DB.

Fallback minimal : cacher le résultat profile en mémoire (Edge runtime n'a pas de cache partagé, mais `unstable_cache` côté Node fonctionne) avec un TTL de 60 s.

---

### 5. Toutes les pages publiques sont SSR (jamais statiques) — Impact: Medium

**Fichier** : `.next/server/app/` (l'absence de `catalogue.html`, `product/[id].html` confirme le mode dynamic)

**Problème** : Même la home (`/`) et `/a-propos` (peu/pas de données dynamiques par visiteur) déclenchent un appel Supabase au runtime. `a-propos.html` existe pourtant (76 KB) mais la page utilise quand même `createSupabaseServerClient`. Voir aussi finding #1.

**Gain attendu** : Mêmes gains que #1, mais c'est aussi un signal d'optimisation : retirer Supabase de `/a-propos` si elle ne lit rien de la DB.

**Fix** : Vérifier les pages qui ne lisent pas réellement la DB et retirer l'appel Supabase. Pour celles qui lisent : ISR via `revalidate`.

---

### 6. `next/image` sans `sizes` sur `ProductCard` — Impact: Medium

**Fichier** : `src/components/ProductCard.tsx:28-34`

**Problème** : `<Image width={400} height={400}>` sans `sizes` → Next choisit la deviceSize la plus large (`3840w`), même pour un produit affiché en 200-300 px dans une grille. Le browser télécharge donc une version énorme depuis `/_next/image`. Sur le catalogue (jusqu'à 18 vignettes par page), c'est 18× le surcoût.

**Gain attendu** : -50 à -70 % du poids des vignettes catalogue.

**Fix** :
```tsx
<Image
  src={product.images?.[0]?.url ?? '/placeholder.png'}
  alt={...}
  width={400} height={400}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="..."
/>
```
Pareil pour `BestProductsCard.tsx:18` et `Footer.tsx:13`.

---

### 7. CatalogueClient recalcule tous les compteurs à chaque keystroke — Impact: Medium

**Fichier** : `src/components/CatalogueClient.tsx:149-204`

**Problème** : `productCounts` est un `useMemo` (l. 149) avec `searchTerm` dans la dépendance (l. 204). À chaque frappe dans la barre de recherche : 4 boucles imbriquées sur 100 produits × (brands + ranges + tags) — typiquement 100 × 50 = 5000 comparaisons par frappe. Sur device lent (mobile 4G/CPU faible), perceptible. La fonction `getFilteredProductsExcept` est ré-exécutée pour chaque type de filtre.

**Gain attendu** : Frappes plus fluides, économie CPU côté client.

**Fix** : Debounce la search (300 ms) :
```ts
const [debouncedSearch, setDebouncedSearch] = useState('')
useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(searchTerm), 300)
  return () => clearTimeout(t)
}, [searchTerm])
// Utiliser debouncedSearch dans productCounts et filtered
```
Bonus : factoriser `getFilteredProductsExcept` pour ne pas refaire le filtre 1+1+N (tag_types) fois — un seul passage qui retourne un Map par filtre.

---

### 8. `splitChunks` mal configuré (un seul vendor géant) — Impact: Medium

**Fichier** : `next.config.ts:59-75`

**Problème** : La config webpack force `cacheGroups.vendor` avec `test: /node_modules/` en un seul chunk → 864 KB de vendor unique. Cela tue le cache : à chaque update mineure (lucide, react), tout le chunk est invalidé. C'est le contraire de l'objectif de splitChunks.

**Gain attendu** : Meilleur cache navigateur (revisits), parallélisation du téléchargement. -200 à -400 ms sur des secondes visites.

**Fix** : Soit retirer cette override (Next 15 fait déjà du framework / lib splitting par défaut), soit segmenter :
```ts
config.optimization.splitChunks = {
  chunks: 'all',
  cacheGroups: {
    framework: { test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/, name: 'framework', priority: 40 },
    supabase:  { test: /[\\/]node_modules[\\/]@supabase[\\/]/, name: 'supabase', priority: 30 },
    icons:     { test: /[\\/]node_modules[\\/](lucide-react|@heroicons|react-icons)[\\/]/, name: 'icons', priority: 20 },
    lib:       { test: /[\\/]node_modules[\\/]/, name: 'lib', priority: 10, minSize: 30000 },
  },
}
```
Ne pas oublier que **Turbopack en dev** ignore `next.config.ts > webpack`. La config ne s'applique qu'au build production.

---

### 9. Dépendances jamais importées dans `package.json` — Impact: Low

**Fichier** : `package.json:28`

**Problème** : `framer-motion` (~50 KB gzippé si importé) est listé mais aucun `import` dans `src/`. `@supabase/auth-helpers-nextjs` (`package.json:24`) idem (déprécié, remplacé par `@supabase/ssr`). Confirmé par `grep -rn` : 0 résultat. Tree-shaking les retire du bundle final, mais ils alourdissent `node_modules`, le `npm install`, et le risque de drift de version.

**Gain attendu** : -30 MB `node_modules`, build CI plus rapide.

**Fix** :
```bash
npm uninstall framer-motion @supabase/auth-helpers-nextjs
```

---

### 10. Composant `FiltersNew.tsx` jamais importé — Impact: Low

**Fichier** : `src/components/FiltersNew.tsx:394`

**Problème** : `FiltersNew.tsx` existe (394 lignes) mais aucun fichier ne l'importe (seul `Filters.tsx` est utilisé par `CatalogueClient.tsx:4`). Code mort. Idem `src/app/(auth)/login-private/`, `test-auth/`, `test-redirect/` (debug pages mentionnées dans `CLAUDE.md:46`).

**Gain attendu** : Maintenance, pas de gain runtime (tree-shaké).

**Fix** : Supprimer le fichier ou le marquer en attente via commentaire.

---

### 11. `getSession` côté middleware (à remplacer par `getUser` en Next 15) — Impact: Low

**Fichier** : `src/middleware.ts:61`

**Problème** : `getSession()` lit le cookie côté serveur **sans vérifier la signature JWT auprès du serveur Supabase**. Pour une vraie validation d'auth, Supabase recommande `getUser()` (qui fait l'appel API). `getSession` est OK pour cache local mais expose à des sessions volées non révoquées. Sur middleware admin, c'est une faille mineure.

**Gain attendu** : Sécurité (pas perf). À noter pour audit sécurité.

**Fix** : Voir audit sécurité — ici on garde `getSession` pour la perf, mais combiner avec un check `admin_users` côté DB (déjà fait via `profiles`).

---

### 12. `dynamic = "force-dynamic"` implicite via cookies pour les pages sans cookie réel — Impact: Low

**Fichier** : `src/app/a-propos/page.tsx`, `src/app/contact/page.tsx`

**Problème** : Ces pages ont un HTML pré-rendu (`.next/server/app/a-propos.html`, 76 KB), donc en pratique elles sont déjà statiques. Mais si elles importent `createSupabaseServerClient` (à vérifier), Next pourrait les passer en dynamic à un changement. À surveiller.

**Gain attendu** : Stabilité.

**Fix** : Aucune action immédiate, juste garder ces pages "pures" (pas de Supabase si pas besoin).

---

## Recommandations prioritaires

1. **Ajouter `export const revalidate = 60-300` sur `page.tsx`, `catalogue/page.tsx`, `product/[id]/page.tsx`** — 5 lignes, impact massif sur TTFB.
2. **Créer les 7 indexes DB manquants** (script SQL ci-dessus dans `db/`). À exécuter dans Supabase SQL editor. Migration idempotente.
3. **Remplacer les 5 `<img>` par `next/image`** — focus sur `ProductClient.tsx:67` (LCP) en priorité.
4. **Ajouter `sizes=` aux `Image` du `ProductCard` et `Footer`** pour servir des tailles adaptées au catalogue.
5. **Hooks Supabase custom claims** pour retirer la requête `profiles` du middleware.
6. **Debounce la search** dans `CatalogueClient.tsx` (300 ms).
7. **Nettoyer le `splitChunks` custom** (laisser Next 15 décider) ou le segmenter par lib.
8. **`npm uninstall framer-motion @supabase/auth-helpers-nextjs`** et supprimer `FiltersNew.tsx`.
9. **Bonus** : audit Lighthouse + WebPageTest en preview Vercel après les fix 1+3+4 pour mesurer LCP réel.
