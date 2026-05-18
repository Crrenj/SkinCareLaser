# Audit Architecture

## Synthèse

**Note globale : B- (correct, mais dette technique notable)**

Le projet est un Next.js 15 App Router + Supabase honnêtement structuré : la séparation Server Components / Client Components est respectée sur le périmètre public (catalogue, product, home), les hooks récemment introduits (`useIsAdmin`) factorisent correctement, et le cleanup post-refactor a bien éliminé `src/contexts/` (aucune référence résiduelle à `CartContext`).

**Points forts**
- Server Components corrects pour le SEO et le data fetching (`catalogue`, `product/[id]`, `page`, `contact`).
- `useIsAdmin` est une factorisation propre, bien documentée, partagée entre `admin/layout.tsx` et `NavBar`.
- SWR + optimistic updates pour le panier (`useCart`) bien implémenté.
- Middleware admin opérationnel (`/admin/:path*`).
- Schéma SQL canonique (`db/schema.sql`) avec RLS activé sur toutes les tables.

**Dettes principales (par sévérité décroissante)**
1. **Sécurité** : 15 routes `/api/admin/*` utilisent la service-role **sans aucune vérification d'identité** côté serveur (matcher du middleware exclut `/api` explicitement). Quiconque appelle ces endpoints peut écrire en base en bypassant RLS.
2. **Duplication massive** : pattern `createClient(url, serviceKey)` répété ~16 fois, idem pour le `if (!supabaseAdmin) return configError()` boilerplate.
3. **Modélisation produit** : ambiguïté `products.image_url` (TEXT) vs table `product_images`. Les routes admin écrivent les deux mais font des fallbacks différents.
4. **Code mort** : `FiltersNew.tsx` (393 LOC), `ProductDetailCard.tsx` (140 LOC), `DirectImageUpload.tsx` (165 LOC), `ImageUpload.tsx` (127 LOC) — aucun import depuis le reste du code.
5. **Types** : seul `src/types/cart.ts` existe ; `Product`, `Brand`, `Range`, `Tag`, `Banner` sont redéfinis ad-hoc 5–10 fois chacun.
6. **Auth client** : double check (`useIsAdmin` + middleware + `auth/callback` + `login/page`) avec logique copiée-collée pour `app_metadata.role` vs `profiles.is_admin`.

---

## Inventaire structurel

```
src/
├── app/
│   ├── layout.tsx               # SWRProvider + AuthProvider, no NavBar
│   ├── page.tsx                 # Server Component (home)
│   ├── (auth)/
│   │   ├── login/page.tsx       # 'use client' - 272 LOC
│   │   └── signup/page.tsx      # 'use client'
│   ├── auth/callback/page.tsx   # 'use client' - dédoublé avec (auth) plus haut
│   ├── catalogue/page.tsx       # Server Component
│   ├── product/[id]/page.tsx    # Server Component
│   ├── cart/page.tsx            # Server Component (wrapper CartClient)
│   ├── contact/page.tsx         # Server Component
│   ├── a-propos/page.tsx
│   ├── admin/
│   │   ├── layout.tsx           # 'use client' (utilise useIsAdmin)
│   │   ├── product/page.tsx     # 703 LOC 'use client'
│   │   ├── marques/page.tsx     # 708 LOC 'use client'
│   │   ├── tags/page.tsx        # 753 LOC 'use client'
│   │   ├── annonce/page.tsx     # 668 LOC 'use client'
│   │   ├── stock/page.tsx       # 410 LOC 'use client'
│   │   ├── messages/page.tsx    # 387 LOC 'use client'
│   │   ├── settings/page.tsx    # 277 LOC 'use client'
│   │   ├── setup/page.tsx       # 210 LOC 'use client'
│   │   └── my-team/page.tsx     # 140 LOC 'use client'
│   └── api/
│       ├── cart/route.ts        # publique
│       ├── contact/route.ts     # publique (service-role inline)
│       └── admin/
│           ├── products/{route.ts,[id]/route.ts,with-tags/route.ts}
│           ├── brands/{route.ts,[id]/route.ts}
│           ├── ranges/{route.ts,[id]/route.ts}
│           ├── tags/{route.ts,[id]/route.ts}
│           ├── tag-types/{route.ts,[id]/route.ts}
│           ├── banners/{route.ts,stats/route.ts}
│           ├── messages/route.ts
│           ├── stock/route.ts
│           └── upload/route.ts  # SEUL endroit qui auth-check correctement
├── components/
│   ├── NavBar.tsx, Footer.tsx, Banner.tsx
│   ├── ProductCard.tsx, ProductClient.tsx
│   ├── ProductDetailCard.tsx   # ⚠ DEAD CODE (jamais importé)
│   ├── CartIcon.tsx, CartDrawer.tsx, CartClient.tsx, AddToCartButton.tsx
│   ├── CatalogueClient.tsx, Filters.tsx
│   ├── FiltersNew.tsx          # ⚠ DEAD CODE
│   ├── ContactForm.tsx, ReviewCard.tsx, BestProductsCard.tsx
│   ├── SWRProvider.tsx, AuthProvider.tsx
│   └── admin/
│       ├── ImageUpload.tsx     # ⚠ DEAD CODE
│       └── DirectImageUpload.tsx # ⚠ DEAD CODE
├── hooks/
│   ├── useAuth.ts              # side-effects only (no return state)
│   ├── useCart.ts              # SWR + optimistic
│   └── useIsAdmin.ts           # ✓ propre, bien factorisé
├── lib/
│   ├── supabaseClient.ts       # browser (avec localStorage fallback)
│   └── supabaseServer.ts       # server cookie-based
├── types/
│   └── cart.ts                 # seul fichier type. Product/Brand/Tag manquent
├── middleware.ts               # /admin/:path* uniquement
└── __tests__/auth.test.tsx     # vitest
```

(Pas de `src/contexts/` — confirmé supprimé.)

---

## Findings

### 1. Routes admin non authentifiées — Severity: **High** (sécurité critique)
**Lieu** : `src/app/api/admin/{products,brands,ranges,tags,tag-types,banners,messages,stock}/**/*.ts` (15 fichiers)
**Constat** : Toutes ces routes instancient un client Supabase **service-role** au top-level et exposent GET/POST/PATCH/DELETE sans vérifier que l'appelant est admin (ni même connecté). Le `middleware.ts` ligne 92 a `matcher: ['/admin/:path*']` qui exclut explicitement `/api/admin/*`. La seule route qui auth-check correctement est `/api/admin/upload/route.ts` (vérifie le token + `profiles.is_admin`). 

```ts
// src/app/api/admin/brands/route.ts:6-19  (pattern dupliqué partout)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return ...   // ← seule vérif. Aucun check session.
  const body = await req.json()
  const { name, slug } = body
  ...
}
```

N'importe qui peut `curl -X POST https://prod/api/admin/brands -d '{"name":"hack","slug":"h"}'`.

**Recommandation** : Créer `src/lib/requireAdmin.ts` qui (a) lit la session via `createSupabaseServerClient()`, (b) vérifie `profiles.is_admin` ou `app_metadata.role === 'admin'`, (c) renvoie `{ user, supabaseAdmin }` ou un `NextResponse.json({error},401|403)`. Wrapper toutes les routes admin :

```ts
// src/lib/requireAdmin.ts
export async function requireAdmin() {
  const sb = await createSupabaseServerClient()
  const { data: { session } } = await sb.auth.getSession()
  if (!session) return { error: NextResponse.json({error:'unauth'},{status:401}) }
  const isAdmin = session.user.app_metadata?.role === 'admin'
    || (await sb.from('profiles').select('is_admin').eq('id', session.user.id).single()).data?.is_admin
  if (!isAdmin) return { error: NextResponse.json({error:'forbidden'},{status:403}) }
  return { user: session.user, supabaseAdmin: getSupabaseAdmin() }
}
```

À défaut, étendre le matcher middleware à `/api/admin/:path*`.

### 2. Duplication massive du bootstrap service-role — Severity: **High**
**Lieu** : `src/app/api/admin/**/*.ts` + `src/app/api/contact/route.ts`
**Constat** : Le bloc suivant est dupliqué dans 16 fichiers, avec deux variantes (les unes acceptent `SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_ROLE_KEY`, les autres `SUPABASE_SERVICE_ROLE_KEY!`) :

```ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(...) : null

if (!supabaseAdmin) return NextResponse.json({error:'Configuration manquante', message:'...'}, {status:500})
```

À chaque ajout de route, c'est 15+ lignes recopiées + risque d'incohérence (cf. `tags/route.ts` qui utilise `SUPABASE_SERVICE_ROLE_KEY!` sans fallback).

**Recommandation** : `src/lib/supabaseAdmin.ts` :
```ts
let cached: SupabaseClient | null = null
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_KEY missing')
  return (cached = createClient(url, key, { auth: { persistSession: false } }))
}
```
Économie estimée : ~250 LOC + cohérence garantie.

### 3. Ambiguïté image_url vs product_images — Severity: **High** (modèle de données)
**Lieu** : `db/schema.sql:61` (`products.image_url TEXT`) + `db/schema.sql:120` (table `product_images`) + 11 sites de fallback
**Constat** : Le schéma garde `products.image_url` *en plus* d'une table `product_images`. Le code applique systématiquement le fallback :
```ts
// src/app/api/admin/products/route.ts:76
image_url: product.product_images?.[0]?.url || product.image_url
```
Le pattern POST insère dans `product_images`, le PATCH supprime l'ancienne entrée `product_images` puis ré-insère, mais le champ `products.image_url` reste écrit/lu selon les routes (`products/[id]/route.ts:61,65,95,200,205`). Conséquences :
- Double source de vérité ⇒ données qui divergent après chaque modification.
- Le catalogue (Server Component) ne lit que `product_images` ; l'admin liste les deux. Le front public peut donc afficher une image différente de celle vue par l'admin.
- L'upload via `/api/admin/upload/route.ts` ne met à jour ni l'un ni l'autre, c'est au consommateur de la route de le faire.

**Recommandation** : Choisir une stratégie et migrer :
- Soit **`product_images` exclusivement** (recommandé, supporte l'ordre + alt) ⇒ migration SQL pour copier `image_url` → `product_images` puis `ALTER TABLE products DROP COLUMN image_url`.
- Soit **`image_url` exclusivement** sur le primary et `product_images` pour la galerie (mais alors renommer la table en `product_gallery`).

### 4. Code mort à supprimer — Severity: **Medium**
**Lieu** :
- `src/components/FiltersNew.tsx` (393 LOC) — `Filters.tsx` est l'unique utilisé par `CatalogueClient`.
- `src/components/ProductDetailCard.tsx` (140 LOC) — aucun import (le détail produit utilise `ProductClient.tsx`).
- `src/components/admin/DirectImageUpload.tsx` (165 LOC) — aucun import.
- `src/components/admin/ImageUpload.tsx` (127 LOC) — aucun import.

**Recommandation** : `git rm` ces 4 fichiers (~825 LOC, soit ~5% du repo). Vérifier avant suppression que `ProductDetailCard` n'est pas conservé pour un futur design ; sinon, le restaurer depuis l'historique au besoin.

### 5. Couplage ProductCard avec AddToCartButton à l'intérieur d'un Link — Severity: **Medium** (UX/A11y)
**Lieu** : `src/components/ProductCard.tsx:23-62`
**Constat** :
```tsx
<Link href={`/product/${product.id}`} ...>
  <article ...>
    ...
    <AddToCartButton productId={product.id} variant="ghost" ... />  // ← <button> dans <a>
    <p className="text-lg font-bold">{price} {product.currency}</p>
  </article>
</Link>
```
HTML invalide : `<button>` imbriqué dans `<a>`. Cliquer "Ajouter au panier" déclenche aussi la navigation (UX cassée), sauf si `e.stopPropagation()` est ajouté. La duplication d'AddToCart entre `ProductCard` (variant="ghost"), `ProductClient` (custom button), `ProductDetailCard` (default) et `CartDrawer` montre que le composant fait trop de choses.

**Recommandation** :
- Sortir `AddToCartButton` du `<Link>`, soit en wrappant la card en deux éléments (lien sur l'image+nom, bouton séparé), soit avec un overlay positionné absolu + `onClick={e => e.stopPropagation()}`.
- Centraliser un seul `<QuantityStepper>` + un `<AddToCart>` réutilisés.

### 6. `useAuth` mélange side-effects et signatures — Severity: **Medium**
**Lieu** : `src/hooks/useAuth.ts`
**Constat** : Le hook expose `signIn`/`signUp`/`signOut` (passent juste par `supabase.auth.*`, aucune valeur ajoutée) **et** installe un listener `onAuthStateChange` global qui fusionne le panier guest. Il est utilisé une seule fois — dans `AuthProvider.tsx:12` — pour son effet de bord uniquement (le retour est jeté). Les pages login/signup réinvoquent `supabase.auth.signIn` directement sans passer par ce hook.

```tsx
// src/components/AuthProvider.tsx
useAuth()           // déclenché pour ses side-effects, valeur ignorée
return <>{children}</>
```

**Recommandation** :
- Renommer en `useAuthListener()` (ou extraire en composant) et **supprimer** les méthodes `signIn`/`signUp`/`signOut` inutilisées.
- Considérer aussi : `handleUserLogin` fait un `UPDATE` côté client sur `carts.anonymous_id` — c'est typiquement le rôle d'une RPC SECURITY DEFINER (qui existe déjà pour le cart, cf. `get_or_create_cart`).

### 7. Trois clients Supabase utilisés de façon hétérogène — Severity: **Medium**
**Lieu** :
- `src/lib/supabaseClient.ts` (browser, "DO NOT MODIFY")
- `src/lib/supabaseServer.ts` (server cookie)
- service-role inline (×16 fichiers)
- 1 cas hybride : `api/contact/route.ts:99` recrée un `createClient` avec `Authorization: Bearer ${token}` lu depuis le header (pas via cookies).
- `api/admin/banners/stats/route.ts` est le seul `/api/admin/*` qui utilise `createSupabaseServerClient()` au lieu de service-role — incohérent.

**Constat** : Aucun fichier `src/lib/` n'exporte la version service-role, donc chaque dev qui ajoute une route copie le bootstrap. Le commentaire "DO NOT MODIFY" sur `supabaseClient.ts` est sain mais ne suffit pas — il faudrait un seul `src/lib/supabase/{browser,server,admin}.ts` clairement nommé.

**Recommandation** : Réorganiser :
```
src/lib/supabase/
├── browser.ts   # ce qui est aujourd'hui supabaseClient.ts
├── server.ts    # ce qui est aujourd'hui supabaseServer.ts
├── admin.ts     # nouveau (cf. finding 2)
└── index.ts     # ré-exporte avec types
```
Et ajouter un test ESLint `no-restricted-imports` qui interdit `createClient` from `@supabase/supabase-js` hors de `src/lib/supabase/`.

### 8. Auth admin checkée à 4 endroits différents — Severity: **Medium**
**Lieu** :
- `src/middleware.ts:70-76` (server, profiles.is_admin)
- `src/app/admin/layout.tsx:40` (client via `useIsAdmin`)
- `src/app/auth/callback/page.tsx:40-49` (client, profiles.is_admin)
- `src/app/(auth)/login/page.tsx:88-100` (client, `app_metadata.role` puis `profiles.is_admin`)
- `src/app/api/admin/upload/route.ts:25-37` (server, profiles.is_admin via token)

**Constat** : Cinq endroits avec quatre formulations différentes du même check. `useIsAdmin` regarde `app_metadata.role` d'abord (rapide JWT) puis fallback `profiles` ; `middleware.ts` regarde seulement `profiles`. Un admin défini uniquement via `app_metadata` mais pas `profiles.is_admin` passerait `useIsAdmin` mais serait redirigé par le middleware.

**Recommandation** : Une seule fonction partagée `isAdminUser(user, supabase)` (sync sur `app_metadata`, async fallback sur `profiles`) utilisée par les 5 sites.

### 9. Types Product/Brand/Tag redéfinis ad-hoc — Severity: **Medium**
**Lieu** : `src/types/cart.ts` (seul fichier types) + définitions locales redondantes
**Constat** :
- `Product` est redéfini dans : `catalogue/page.tsx` (`RawProduct`), `product/[id]/page.tsx` (`RawProduct`, `MappedProduct`), `ProductCard.tsx`, `ProductClient.tsx`, `ProductDetailCard.tsx`, `admin/product/page.tsx`, `CatalogueClient.tsx` — ~7 versions divergentes.
- `Brand`, `Range`, `Tag`, `TagType`, `Banner` ont également chacun 3–5 définitions locales.
- Champ `tagsByCategory` (utilisé par `product/[id]/page.tsx` + `ProductClient.tsx`) vs `tagsByType` (utilisé par `ProductDetailCard.tsx` dead-code) — naming incohérent dans l'historique.
- `ProductImage.alt` est tantôt `string | null` tantôt `string` selon le fichier (cf. `ProductDetailCard.tsx:6` vs `ProductCard.tsx:5`).

**Recommandation** : Créer `src/types/`:
```
src/types/
├── cart.ts        # déjà là
├── product.ts     # Product, ProductImage, RawProduct, MappedProduct
├── catalog.ts     # Brand, Range, Tag, TagType
└── banner.ts      # Banner, BannerType
```
Idéalement, générer depuis Supabase : `supabase gen types typescript` (le MCP `mcp__supabase__generate_typescript_types` est disponible).

### 10. Pages admin gigantesques — Severity: **Medium**
**Lieu** : `src/app/admin/{tags,marques,product,annonce}/page.tsx`
**Constat** : 4 pages admin font entre 668 et 753 LOC (700+ pour `tags/page.tsx`). Chacune mélange fetch, state, formulaires modaux, listes paginées, suppression confirmation, dans un seul `'use client'`.

**Recommandation** : Extraire systématiquement par page :
```
src/app/admin/tags/
├── page.tsx                  # Layout + composition
├── _components/
│   ├── TagsList.tsx
│   ├── TagFormModal.tsx
│   ├── TagTypeAccordion.tsx
│   └── DeleteConfirmDialog.tsx
└── _hooks/
    └── useTagsAdmin.ts       # fetch/mutations encapsulées
```
Le `_` prefix Next.js empêche le routing.

### 11. Banner.tsx — 7 variantes dans un seul fichier — Severity: **Low**
**Lieu** : `src/components/Banner.tsx` (356 LOC)
**Constat** : Un seul composant gère 6 styles (`image_left`, `image_right`, `image_full`, `card_style`, `minimal`, `gradient_overlay`) avec un `if` par variant. ~80% du code est dupliqué (image loading state, link CTA, gradient overlay).

**Recommandation** : Extraire les blocs partagés (`<BannerImage>`, `<BannerCTA>`) puis créer un sous-composant par variant. Garder une `Banner.tsx` switch minimal (~30 LOC).

### 12. Optimistic update du panier — placeholder bizarre — Severity: **Low**
**Lieu** : `src/hooks/useCart.ts:74-89`
**Constat** : Lors d'un `addToCart` pour un produit pas encore dans le panier, l'optimistic crée un item placeholder avec `name: 'Chargement...'` et `price: 0`. Cela rend le total provisoire faux (sous-évalué). Acceptable pour de petits paniers, mais à corriger : `addToCart` reçoit déjà `productId`, le caller (`ProductCard`, `ProductClient`, `AddToCartButton`) connaît le produit.

**Recommandation** : Passer un `product?: Pick<Product,'name'|'price'|'currency'|'images'>` optionnel à `addToCart` pour un optimistic correct, ou faire un re-fetch sans optimistic pour les nouveaux items.

### 13. Conventions de routing mal utilisées — Severity: **Low**
**Lieu** : `src/app/(auth)/{login,signup}` + `src/app/auth/callback`
**Constat** : `(auth)` est un route group (parenthèses = pas dans l'URL), correctement utilisé pour `login`/`signup`. Mais `auth/callback` est *en dehors* du group, créant un dossier `auth/` à côté du group `(auth)/`. C'est confusant : le path public `/auth/callback` ne profite pas du même layout. De plus, deux dossiers `auth` et `(auth)` côte-à-côte trompent à la lecture.

**Recommandation** : Soit déplacer le callback dans le group : `src/app/(auth)/callback/page.tsx` ; soit, plus propre, mettre les 3 dans `(auth)/{login,signup,callback}` et supprimer le dossier `auth/`.

### 14. `as any` et types Supabase non typés — Severity: **Low**
**Lieu** : 32 occurrences de `: any` / `as any` dans `src/`
**Constat** : Tous les `Product`/`Brand`/`Tag` sont typés à la main, et les jointures Supabase (`product_ranges(ranges(brands))`) sont en `as any` (cf. `api/admin/stock/route.ts:84-86`, `product/[id]/page.tsx` recourt à `RangeJoin`). Le MCP `mcp__supabase__generate_typescript_types` règlerait ~90% des cas.

**Recommandation** : Générer les types Supabase et brancher dans `createBrowserClient<Database>(...)` / `createServerClient<Database>(...)`.

### 15. NavBar mélange responsabilités — Severity: **Low**
**Lieu** : `src/components/NavBar.tsx`
**Constat** : Le composant gère :
- toggle langue (non fonctionnel — liste statique FR/EN/ES)
- panier (CartIcon + CartDrawer monté en interne)
- état utilisateur (via `useIsAdmin`)
- logout
- nav principale

Le CartDrawer est instancié dans la NavBar (couplé pour toujours), alors que le `cart/page.tsx` utilise `CartClient` — deux UIs panier différentes. Coût : si NavBar est démonté (rare mais possible), le drawer disparait.

**Recommandation** :
- Sortir le `<CartDrawer>` dans `app/layout.tsx` (un seul drawer global).
- Extraire `UserMenu` (login/logout/admin link) en composant dédié.
- Soit retirer le toggle langue (non fonctionnel), soit l'implémenter.

---

## Recommandations prioritaires

1. **[CRITIQUE]** Sécuriser les routes `/api/admin/*` avec un helper `requireAdmin()` (finding 1). À faire avant toute mise en prod.
2. **[HIGH]** Créer `src/lib/supabase/admin.ts` (singleton service-role) pour supprimer la duplication × 16 (finding 2). Réduction estimée : ~300 LOC.
3. **[HIGH]** Décider et migrer le modèle image : `image_url` OU `product_images`, pas les deux (finding 3).
4. **[MEDIUM]** Supprimer `FiltersNew.tsx`, `ProductDetailCard.tsx`, `ImageUpload.tsx`, `DirectImageUpload.tsx` (~825 LOC dead).
5. **[MEDIUM]** Générer les types Supabase (`supabase gen types typescript`) et créer `src/types/{product,catalog,banner}.ts`.
6. **[MEDIUM]** Factoriser `isAdminUser(user)` partagé entre middleware, useIsAdmin, login page, callback page.
7. **[MEDIUM]** Découper les 4 pages admin > 600 LOC en composants `_components/` et hooks `_hooks/`.
8. **[LOW]** Refactor `Banner.tsx` (sous-composants), corriger `ProductCard` HTML invalide, déplacer `CartDrawer` global.

---

## Patterns à promouvoir / éviter

### À promouvoir

**Pattern Server Component data-mapping** (catalogue, product/[id]) :
```ts
const { data, error } = await supabase.from('products').select(`...`).returns<RawProduct[]>()
const mapped = (data ?? []).map(mapProduct)  // pure fn co-localisée
return <ClientWrapper data={mapped} />
```
C'est ce qui se passe dans `catalogue/page.tsx` et `product/[id]/page.tsx` — à généraliser.

**Hook personnalisé pour un cross-cutting concern** (`useIsAdmin`) :
```ts
export function useIsAdmin() {
  const [user, setUser] = useState<User|null>(null)
  // 1. JWT fast-path
  // 2. profiles fallback
  // 3. listen onAuthStateChange
  return { user, isAdmin, loading }
}
```
Modèle à reproduire pour d'autres hooks (`useProfile`, `useFavorites`, etc.).

**SWR + optimistic updates** (`useCart`) — bon, à généraliser pour les opérations admin (mutations + revalidate).

### À éviter

**Bootstrapper Supabase au top-level d'une route** :
```ts
const supabaseAdmin = createClient(url, serviceKey)  // ← exécuté à l'import
```
Préférer un singleton lazy (`getSupabaseAdmin()`) — évite le client instancié pendant les builds.

**`'use client'` au sommet de la page entière** quand seuls 30% sont interactifs :
```tsx
// admin/marques/page.tsx — 708 LOC 'use client'
```
Préférer : page Server Component qui passe les données initiales à un sous-composant client (`<MarquesAdminClient initial={brands} />`).

**Types ad-hoc copiés** :
```tsx
type Product = { id: string; name: string; price: number; ... }  // dans 7 fichiers
```
Centraliser dans `src/types/` et générer depuis Supabase.

**Vérifs admin éparpillées** : 5 endroits, 4 formulations. Cf. finding 8.

**Composants qui mélangent navigation + état modal** (NavBar, CartDrawer co-monté) — préférer un drawer/modal global ancré au layout.

**`<button>` à l'intérieur d'un `<Link>`** — HTML invalide, source de bugs UX (cf. ProductCard, finding 5).
