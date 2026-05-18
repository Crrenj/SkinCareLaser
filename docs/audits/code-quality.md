# Audit Qualite de Code

## Synthese

**Note globale : C+ (6.5 / 10)**

Le projet est globalement coherent : TypeScript en mode `strict`, alias `@/*` utilise partout, zero `console.log` parasite, zero import relatif residuel, et les pages serveur recemment refactorisees (`catalogue/page.tsx`, `product/[id]/page.tsx`) sont d'excellente qualite (types `RawProduct` / `RangeJoin` / `TagJoin` precis, mapping clair, jointures Supabase typees). Cependant, la dette se concentre fortement sur l'admin (pages > 700 lignes, `any` partout, alertes inline) et sur 16 routes API qui dupliquent **mot pour mot** le bloc d'initialisation `supabaseAdmin`.

Trois hot spots prioritaires :

1. **Duplication du bootstrap Supabase service-role dans 16 routes API** (`src/app/api/admin/**/*.ts` + `src/app/api/contact/route.ts`). 20 lignes copiees-collees, doublees par un `if (!supabaseAdmin) return NextResponse.json(...)` au debut de chaque handler. Un seul helper `getSupabaseAdmin()` ou un wrapper `withAdminClient(handler)` eliminerait ~300 lignes.
2. **Quatre pages admin > 660 lignes** (`tags/page.tsx` 753, `marques/page.tsx` 708, `product/page.tsx` 703, `annonce/page.tsx` 668) qui melangent etat, modales, formulaires et tableaux dans un seul composant. Aucune extraction de sous-composant.
3. **`FiltersNew.tsx` (393 lignes) est du code mort** : aucune reference dans le repo, seule `Filters.tsx` est importee par `CatalogueClient`. A supprimer.

## Metriques

| Indicateur | Valeur |
| --- | --- |
| Total fichiers `.ts`/`.tsx` dans `src/` | 67 |
| Total lignes | ~12 690 |
| Fichiers > 300 lignes | 11 |
| Fichiers > 500 lignes | 4 (les 4 pages admin geantes) |
| Warnings ESLint | **63** |
| Fichiers TypeScript strict | 67/67 (oui, le tsconfig l'impose) |
| Erreurs `tsc --noEmit` | **0** |
| Fichiers Supabase admin dupliques | 16 |
| Tests unitaires (Vitest) | 1 fichier, 8 tests |
| Tests e2e (Playwright) | 1 fichier (`tests/cart.spec.ts`) |
| Couverture (estimee) | < 5% |
| Imports relatifs `../` | **0** (excellent) |
| Imports alias `@/` | 50 |
| Occurrences `console.log` | **0** (deja nettoye) |
| Occurrences `console.error` | 51 (acceptable, logs serveur) |
| Occurrences `alert(...)` | 35 (UX feedback non professionnel) |

**Breakdown des 63 warnings ESLint :**

| Categorie | Count | % |
| --- | --- | --- |
| `@typescript-eslint/no-explicit-any` | 33 | 52% |
| `@typescript-eslint/no-unused-vars` | 9 | 14% |
| `react/no-unescaped-entities` | 11 | 17% |
| `react-hooks/exhaustive-deps` | 5 | 8% |
| `@next/next/no-img-element` | 5 | 8% |

**Fichiers contenant au moins un `any` :** 15 fichiers, tous concentres sur l'admin et les routes API.

```
src/app/admin/tags/page.tsx          (3 any)
src/app/admin/product/page.tsx       (1 any + 1 product_ranges?: any[])
src/app/api/admin/products/[id]/route.ts (3 any)
src/app/api/admin/products/route.ts  (2 any)
src/app/api/admin/products/with-tags/route.ts (3 any)
src/app/api/admin/brands/route.ts    (2 any)
src/app/api/admin/brands/[id]/route.ts (2 any)
src/app/api/admin/ranges/route.ts    (2 any)
src/app/api/admin/ranges/[id]/route.ts (2 any)
src/app/api/admin/stock/route.ts     (5 any)
src/app/api/admin/upload/route.ts    (2 any)
src/app/api/admin/messages/route.ts  (1 any)
src/app/api/cart/route.ts            (1 any)
src/components/admin/ImageUpload.tsx (1 any)
src/components/admin/DirectImageUpload.tsx (2 any)
```

---

## Findings

### 1. Bootstrap Supabase service-role duplique 16 fois - Severity: High

**Fichier(s)** : `src/app/api/admin/brands/route.ts`, `.../brands/[id]/route.ts`, `.../ranges/route.ts`, `.../ranges/[id]/route.ts`, `.../products/route.ts`, `.../products/[id]/route.ts`, `.../products/with-tags/route.ts`, `.../banners/route.ts`, `.../banners/stats/route.ts`, `.../stock/route.ts`, `.../upload/route.ts`, `.../messages/route.ts`, `.../tags/route.ts`, `.../tags/[id]/route.ts`, `.../tag-types/route.ts`, `.../tag-types/[id]/route.ts`.

**Probleme** : Chaque route copie le meme bloc :

```ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) { console.error('Configuration manquante:', ...) }
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(...) : null
```

Plus, dans chaque handler, le meme gardefou repete :

```ts
if (!supabaseAdmin) {
  return NextResponse.json({ error: 'Configuration manquante', message: '...' }, { status: 500 })
}
```

C'est ~20 lignes par fichier x 16 fichiers = **~320 lignes de copie-colle**. Un seul typo dans la cle d'env force a corriger 16 fichiers.

**Fix suggere** : Creer `src/lib/supabaseAdmin.ts` :

```ts
// AVANT (16 fichiers)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(...) : null

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  try { ... } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }) }
}

// APRES (1 fichier helper)
// src/lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null
export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_SERVICE_KEY non configuree')
  _client = createClient(url, key)
  return _client
}

export function withAdminClient<T>(handler: (sb: SupabaseClient) => Promise<T>) {
  return async (...args: Parameters<typeof handler>) => {
    try {
      return await handler(getSupabaseAdmin())
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur serveur'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }
}
```

Cas d'usage cote route :

```ts
// src/app/api/admin/brands/route.ts (apres)
export async function GET() {
  const sb = getSupabaseAdmin()
  const { data, error } = await sb.from('brands').select('*, ranges(*)').order('name')
  if (error) throw error
  return NextResponse.json(data)
}
```

Gain estime : suppression de ~250 lignes, single source of truth, refacto possible vers Zod pour la validation.

---

### 2. `error: any` dans tous les `catch` des routes API - Severity: High

**Fichier(s)** : Toutes les routes admin (~33 occurrences ESLint).

**Probleme** : Pattern systematique `catch (error: any) { return NextResponse.json({ error: error.message || '...' }) }`. Le `any` court-circuite TypeScript, et `error.message` accede a une propriete potentiellement non-existante.

**Fix suggere** :

```ts
// AVANT
} catch (error: any) {
  return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 })
}

// APRES
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Erreur inconnue'
  return NextResponse.json({ error: message }, { status: 500 })
}
```

Ou mieux, helper :

```ts
// src/lib/api.ts
export function errorResponse(error: unknown, fallback = 'Erreur serveur', status = 500) {
  const message = error instanceof Error ? error.message : fallback
  return NextResponse.json({ error: message }, { status })
}
```

Resout 33 warnings ESLint d'un coup.

---

### 3. Composant `FiltersNew.tsx` est du code mort - Severity: Medium

**Fichier(s)** : `src/components/FiltersNew.tsx` (393 lignes).

**Probleme** : Recherche `grep -r "FiltersNew\|from .*FiltersNew" src` -> **0 resultat**. `CatalogueClient.tsx` importe uniquement `Filters` (l'ancienne version generique avec tags dynamiques). `FiltersNew` est l'ancienne implementation hardcodee (`availableCategories`, `availableNeeds`, `availableSkinTypes`, `availableIngredients`) avant la generalisation vers `itemsByType: Record<string, string[]>`.

**Fix suggere** : Supprimer le fichier. 393 lignes en moins, zero risque, zero impact runtime.

```bash
rm src/components/FiltersNew.tsx
```

---

### 4. Pages admin geantes : 4 fichiers > 660 lignes - Severity: High

**Fichier(s)** :
- `src/app/admin/tags/page.tsx` (753 lignes)
- `src/app/admin/marques/page.tsx` (708 lignes)
- `src/app/admin/product/page.tsx` (703 lignes)
- `src/app/admin/annonce/page.tsx` (668 lignes)

**Probleme** : Chaque page est un mega-composant qui contient : interfaces, fetchers, etat, slug-generator, openModal/closeModal, handleSubmit (create + update), handleDelete, render header/stats/table/modal-create/modal-edit/modal-delete. La page `tags/page.tsx` heberge a elle seule **3 modales** distinctes (TagModal, TypeModal, DeleteConfirmModal) en JSX inline.

Consequences :
- Difficile a tester (impossible de tester un sous-composant)
- Re-renders inutiles (toute la page re-render quand on tape dans un input de modale)
- Conflits de merge garantis en equipe
- `iconMap` (28 entrees Heroicons) duplique entre `tags/page.tsx` et tout autre futur ecran utilisant le meme picker.

**Fix suggere** : Decoupage classique. Pour `tags/page.tsx` :

```
src/app/admin/tags/
  page.tsx                    (page Server/Client minimaliste ~100 lignes)
  _components/
    TagCategoryCard.tsx       (la grille de tags d'une categorie)
    TagModal.tsx              (modal create/edit tag)
    TagTypeModal.tsx          (modal create/edit type)
    DeleteConfirmModal.tsx    (reutilisable, deplacer dans components/admin/)
    IconPicker.tsx            (le grid de 26 icones)
    ColorPicker.tsx           (la palette 10 couleurs)
  _hooks/
    useTagsData.ts            (fetchData + tagCategories + tagTypes)
  _lib/
    iconMap.ts                (table de mapping icone)
    slug.ts                   (deja duplique 4 fois - voir finding 8)
```

Objectif : aucun composant > 250 lignes.

---

### 5. Pattern try/catch + NextResponse.json identique partout - Severity: Medium

**Fichier(s)** : 57 occurrences `NextResponse.json(...error...)`, 34 occurrences `throw error`.

**Probleme** : Chaque route refait son try/catch a la main, avec ses propres conventions (`{ error, message }` vs `{ success: false, error }` vs `{ error: 'Erreur serveur' }`). Cf. `banners/route.ts` qui retourne `{ error: 'Erreur serveur' }` (generique) vs `brands/route.ts` qui retourne `error.message` (potentiellement leak).

Incoherence detectee :
- `contact/route.ts` retourne `{ success: false, error }` (jamais utilise ailleurs)
- `banners/route.ts` definit son propre helper local `configError()` (bonne idee mais isole)
- `brands/route.ts` retourne `{ error: error.message }` brut

**Fix suggere** : Helper centralise dans `src/lib/api.ts` :

```ts
// AVANT
try {
  // ...
  if (error) throw error
  return NextResponse.json(data)
} catch (error: any) {
  return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 })
}

// APRES
import { apiHandler, errorResponse } from '@/lib/api'

export const GET = apiHandler(async () => {
  const sb = getSupabaseAdmin()
  const { data, error } = await sb.from('brands').select('*, ranges(*)').order('name')
  if (error) throw error
  return NextResponse.json(data)
})
```

`apiHandler` enveloppe automatiquement les erreurs en `errorResponse(e, 500)`.

---

### 6. Interfaces `Brand`/`Range`/`Tag`/`Product` redefinies 3 fois - Severity: Medium

**Fichier(s)** :
- `src/app/admin/marques/page.tsx` : `interface Brand`, `interface Range`
- `src/app/admin/product/page.tsx` : `interface Brand`, `interface Range`, `interface Tag`, `interface TagType`, `interface Product`
- `src/app/admin/tags/page.tsx` : `interface Tag`, `interface TagType`, `interface TagCategory`

**Probleme** : 3 definitions de `Brand`, 2 de `Range`, 3 de `Tag`, 2 de `TagType`. Chacune avec des champs legerement differents (par exemple `Range` dans `marques` a `brand_id`, dans `product` n'a que `id/name/brand_id`). En cas d'evolution du schema DB (ajout d'un champ `description` a `brands`), 3 fichiers a synchroniser.

**Fix suggere** : Creer `src/types/entities.ts` :

```ts
// src/types/entities.ts
export interface Brand {
  id: string
  name: string
  slug: string
  created_at?: string
  ranges?: Range[]
}

export interface Range {
  id: string
  name: string
  slug: string
  brand_id: string
  brand?: Brand
}

export interface Tag {
  id: string
  name: string
  slug: string
  tag_type_id: string
  tag_type?: TagType
}

export interface TagType {
  id: string
  name: string
  slug: string
  icon?: string
  color: string
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  stock: number
  is_active: boolean
  // ...
}
```

Idealement, generer avec `supabase gen types typescript` pour rester sync avec la DB.

---

### 7. `error.message` accede sur `any` ou union mal typee - Severity: Medium

**Fichier(s)** : Toutes les pages admin (`tags/page.tsx`, `marques/page.tsx`, `product/page.tsx`, `annonce/page.tsx`, etc.).

**Probleme** : Apres un `catch (error)` non type, le code utilise `alert('Erreur: ' + error.error)` ou `error.message`, ce qui (1) en TS strict ne compile pas (mais Next.js ne fait pas de strict assez serieux) (2) UX terrible (popup native).

```ts
} catch (error) {
  console.error('Erreur:', error)
  alert('Erreur lors de la sauvegarde')   // 35 occurrences !
}
```

35 occurrences de `alert(...)` dans le code admin. Un site pro en 2026 utilise un toast.

**Fix suggere** : Adopter `sonner` ou `react-hot-toast` pour les notifications :

```ts
// AVANT
alert('Erreur lors de la sauvegarde')

// APRES
import { toast } from 'sonner'
toast.error('Erreur lors de la sauvegarde')
```

Bonus accessibilite : les `alert()` bloquent le thread principal et sont inutilisables au clavier propre.

---

### 8. Fonction `generateSlug` dupliquee 4 fois - Severity: Low

**Fichier(s)** : `admin/tags/page.tsx:202`, `admin/marques/page.tsx:107`, `admin/product/page.tsx:168`, plus utilisee implicitement dans d'autres endroits.

**Probleme** : La meme fonction copy-paste 4 fois :

```ts
const generateSlug = (name: string) =>
  name.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
```

**Fix suggere** : Deplacer dans `src/lib/slug.ts` et importer. Couvert par 2 tests unitaires si vous voulez de la robustesse.

---

### 9. Hooks `useEffect` avec dependances manquantes - Severity: Medium

**Fichier(s)** :
- `src/app/admin/messages/page.tsx:78` - `loadMessages` missing
- `src/app/admin/product/page.tsx:152` - `fetchProducts` missing
- `src/app/admin/tags/page.tsx:200` - `fetchData` missing
- `src/app/admin/stock/page.tsx:82` - `fetchStockData` missing
- `src/hooks/useAuth.ts:25` - `handleUserLogin`, `handleUserLogout` missing

**Probleme** : Tous les `useEffect` qui chargent des donnees ont des dependances cachees. Si `searchTerm` ou `statusFilter` change, `useEffect` ne se re-execute pas correctement parce que la fonction est recreee mais pas dans les deps. Symptome typique : data stale apres modification d'un filtre.

**Fix suggere** : Soit wrapper avec `useCallback` :

```ts
const fetchData = useCallback(async () => {
  // ...
}, [/* deps reelles */])

useEffect(() => {
  fetchData()
}, [fetchData])
```

Soit utiliser SWR comme deja fait dans `useCart` (preferable pour le cache et la revalidation).

---

### 10. `ImageUpload.tsx` vs `DirectImageUpload.tsx` : 2 composants pour la meme tache - Severity: Medium

**Fichier(s)** :
- `src/components/admin/ImageUpload.tsx` (127 lignes) - upload via `/api/admin/upload`
- `src/components/admin/DirectImageUpload.tsx` (165 lignes) - upload direct vers Supabase Storage client-side

**Probleme** : Aucun des deux composants n'est importe (`grep -r "import.*ImageUpload\|DirectImageUpload"` -> 0). Le composant qui upload est implemente inline dans `admin/product/page.tsx` (transformation base64 + envoi via POST). On a donc 2 composants utilitaires non utilises + code reinvente dans la page.

**Fix suggere** : Soit supprimer les deux (292 lignes), soit les utiliser dans `admin/product/page.tsx` et factoriser. Decision metier (preview, gestion d'erreur visuelle) : conserver `DirectImageUpload` et l'utiliser dans la page, supprimer `ImageUpload`.

---

### 11. Modal pattern recopie 10 fois - Severity: Medium

**Fichier(s)** : `admin/product/page.tsx`, `admin/tags/page.tsx` (3 modales !), `admin/annonce/page.tsx` (2), `admin/marques/page.tsx`, `admin/messages/page.tsx`, `admin/stock/page.tsx`.

**Probleme** : 10 occurrences identiques :

```tsx
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
  <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
    <div className="flex justify-between items-center mb-4">
      <h3>{title}</h3>
      <button onClick={onClose}><XMarkIcon /></button>
    </div>
    {children}
  </div>
</div>
```

**Fix suggere** : Creer `src/components/admin/Modal.tsx` :

```tsx
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode
}

export function Modal({ open, onClose, title, maxWidth = '2xl', children }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-20 mx-auto p-5 border w-full max-w-${maxWidth} shadow-lg rounded-md bg-white`}>
        <Header title={title} onClose={onClose} />
        {children}
      </div>
    </div>
  )
}
```

Bonus : ajouter un piege focus + ESC pour fermer, totalement absent aujourd'hui.

---

### 12. Bannieres "NE PAS MODIFIER" sur du code anodin - Severity: Low

**Fichier(s)** : `src/lib/supabaseClient.ts` (lignes 4-23, banderole entiere), `src/app/(auth)/login/page.tsx` (lignes 10-34).

**Probleme** : Le commentaire stipule "Code critique - ne pas modifier sans autorisation" sur des fichiers qui contiennent ~80 lignes de code standard Supabase + cookies. La banderole est intimidante et plus longue que le code qu'elle protege par endroits. Ces commentaires temoignent d'un trauma passe (bug de cookie en navigation privee) mais entravent la lecture.

**Fix suggere** : Garder un commentaire JSDoc court et factuel :

```ts
/**
 * Client Supabase navigateur.
 * Gere le fallback localStorage pour la navigation privee Safari/Firefox.
 * Voir tests : src/__tests__/auth.test.tsx
 */
```

Les bandeaux geants doivent disparaitre, le code parle deja de lui-meme.

---

### 13. Magic numbers et strings : currency, stock threshold, shipping - Severity: Low

**Fichier(s)** : 
- `src/app/api/admin/stock/route.ts:20` - `minStock: number = 10` (seuil low stock hardcode)
- `src/components/CartClient.tsx:17` - `shipping = items.length > 0 ? 5.99 : 0`
- `src/components/CartClient.tsx:21` - `newQuantity >= 1 && newQuantity <= 99` (max quantite)
- `src/components/admin/ImageUpload.tsx:34` - `file.size > 5 * 1024 * 1024` (5 MB, duplique)
- `src/hooks/useCart.ts:84`, `CartDrawer.tsx:52`, `api/admin/products/route.ts:155` - `'DOP'` hardcode (5 occurrences)

**Probleme** : Valeurs metier eparpillees dans tout le codebase. Aucune source unique pour `LOW_STOCK_THRESHOLD`, `SHIPPING_FLAT_RATE`, `MAX_CART_QUANTITY`, `DEFAULT_CURRENCY`, `MAX_UPLOAD_SIZE_BYTES`.

**Fix suggere** : `src/lib/constants.ts` :

```ts
export const DEFAULT_CURRENCY = 'DOP' as const
export const LOW_STOCK_THRESHOLD = 10
export const SHIPPING_FLAT_RATE = 5.99
export const MAX_CART_QUANTITY = 99
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
export const ADMIN_HOME_PATH = '/admin/product'
export const LOGIN_PATH = '/login'
```

---

### 14. Redirection paths hardcodes - Severity: Low

**Fichier(s)** : `middleware.ts`, `app/(auth)/login/page.tsx:106`, `app/auth/callback/page.tsx:50`, `app/admin/layout.tsx:48`, `components/NavBar.tsx:98`, `__tests__/auth.test.tsx`.

**Probleme** : 8 occurrences de `/admin/product` (URL post-login admin), 7 occurrences de `/login`. Si la page d'accueil admin change, 8 endroits a modifier.

**Fix suggere** : Constantes (cf. finding 13).

---

### 15. `console.error` legitimes mais bandeaux emoji `❌` - Severity: Low

**Fichier(s)** : 7 occurrences de `❌ Configuration manquante:` dans les routes API.

**Probleme** : Emoji dans les logs serveur. Sympa en dev, parasite en prod (gestionnaire de logs type Datadog/Sentry ne joue pas bien avec les emojis dans les patterns).

**Fix suggere** : Remplacer par texte clair. De toute facon, ces blocs disparaitront avec le helper `getSupabaseAdmin` (finding 1).

---

### 16. Pas de validation de body (Zod absent) - Severity: Medium

**Fichier(s)** : Toutes les routes POST/PATCH/PUT (~15 endpoints).

**Probleme** : Chaque route fait sa propre validation manuelle :

```ts
const { name, slug } = body
if (!name || !slug) {
  return NextResponse.json({ error: 'Le nom et le slug sont requis' }, { status: 400 })
}
```

C'est lent, error-prone, et ne couvre pas les types (string vs number). Pas de validation pour `position` qui doit etre un entier, ni pour `email` (regex inline duplique dans `contact/route.ts:27` et `signup/page.tsx`).

**Fix suggere** : Adopter `zod` :

```ts
// AVANT
const { name, slug } = body
if (!name || !slug) return NextResponse.json({ error: '...' }, { status: 400 })

// APRES
import { z } from 'zod'

const BrandSchema = z.object({
  name: z.string().min(1).trim(),
  slug: z.string().min(1).toLowerCase()
})

const parsed = BrandSchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.message }, { status: 400 })
}
```

Bonus : types TypeScript automatiquement inferes via `z.infer<typeof BrandSchema>`, evitant les `error: any` dans le catch.

---

### 17. Couverture de test < 5% - Severity: Medium

**Fichier(s)** : `src/__tests__/auth.test.tsx` (8 tests login/signup), `tests/cart.spec.ts` (e2e Playwright).

**Probleme** : 8 tests pour 67 fichiers. Aucun test sur :
- Le filtre catalogue (logique metier la plus complexe)
- Le calcul du panier (`useCart.ts`, ~270 lignes)
- Les routes API admin (zero test, alors qu'elles font des transactions multi-tables)
- Les hooks (`useIsAdmin`, `useAuth`)

**Fix suggere** : Prioriser :
1. Tests unitaires `useCart` : addToCart/removeFromCart/updateQuantity/clearCart avec mocks SWR
2. Tests `CatalogueClient.filtered` : extraire la logique de filtrage dans `src/lib/catalogue-filters.ts` pure et la tester
3. Tests d'integration API : Supabase test client (ou MSW)

Objectif court terme : 30% de couverture sur `src/lib`, `src/hooks` et la logique critique panier.

---

### 18. `_options` non utilise dans `supabaseClient.ts` (lint warning) - Severity: Low

**Fichier(s)** : `src/lib/supabaseClient.ts:85`.

**Probleme** : Le parametre `_options: CookieOptions` dans `remove(name, _options)` est present pour respecter l'interface mais inutilise. Le `_` prefix est la convention pour "intentionnellement inutilise", mais ESLint warn quand meme.

**Fix suggere** : Ajouter une regle ESLint :

```js
// eslint.config.mjs
'@typescript-eslint/no-unused-vars': ['warn', {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_'
}]
```

Resout aussi les warnings sur `_req: NextRequest` (3 occurrences).

---

## Hot spots (fichiers les plus problematiques)

| Rang | Fichier | Lignes | Problemes | Score risque |
| --- | --- | --- | --- | --- |
| 1 | `src/app/admin/tags/page.tsx` | 753 | 3 `any` + 3 modales inline + `iconMap`/`iconOptions` hardcodes (28 entrees) + hook deps + alert | **9/10** |
| 2 | `src/app/admin/product/page.tsx` | 703 | 1 `any` + `product_ranges?: any[]` + 5 alerts + handlers melanges + hook deps | **8/10** |
| 3 | `src/app/admin/marques/page.tsx` | 708 | Variable `ranges` inutilisee + 2 entites en parallele (brands + ranges) sans separation, modales inline | **7/10** |
| 4 | `src/app/admin/annonce/page.tsx` | 668 | 1 `any` + 7 alerts + apostrophes non echappees + react Image inline | **7/10** |
| 5 | `src/components/FiltersNew.tsx` | 393 | **Code mort total** | **6/10** (a supprimer) |
| 6 | `src/app/api/admin/products/[id]/route.ts` | 228 | 3 `any` + logique complexe (storage + tags + ranges sequentiel) sans transaction | **7/10** |
| 7 | `src/app/api/admin/products/route.ts` | 217 | 2 `any` + meme probleme transactionnel | **6/10** |
| 8 | `src/app/api/admin/stock/route.ts` | 182 | 5 `any` (record!) + cast force `(brand as any).name` | **7/10** |
| 9 | `src/app/api/cart/route.ts` | 249 | 1 `any` + transactions cart_items non atomiques | **5/10** |
| 10 | `src/hooks/useCart.ts` | 269 | Aucun test pour 270 lignes de logique optimistic update | **5/10** |

---

## Patterns a factoriser

### A. Helper `getSupabaseAdmin()` + `withAdminClient()`
**Cible** : `src/lib/supabaseAdmin.ts` (nouveau).
**Impact** : Supprime ~250 lignes dans 16 routes, single source of truth.

### B. Helper `errorResponse(err, status)` + middleware d'erreur
**Cible** : `src/lib/api.ts` (nouveau).
**Impact** : Supprime ~80 lignes, harmonise la forme des erreurs.

### C. Composant `<Modal>` reutilisable
**Cible** : `src/components/admin/Modal.tsx` (nouveau).
**Impact** : 10 occurrences a 15 lignes = 150 lignes supprimees, accessibilite renforcee.

### D. `generateSlug` partage
**Cible** : `src/lib/slug.ts`.
**Impact** : 4 copies -> 1, testable.

### E. Constantes metier
**Cible** : `src/lib/constants.ts`.
**Impact** : `DOP`, `5.99`, `5*1024*1024`, `/admin/product`, etc.

### F. Types entites Brand/Range/Tag/Product
**Cible** : `src/types/entities.ts` (idealement `supabase gen types`).
**Impact** : 10 interfaces dupliquees -> 1 source.

### G. `<IconPicker>` et `<ColorPicker>`
**Cible** : `src/components/admin/IconPicker.tsx` + `ColorPicker.tsx`.
**Impact** : Extraction des 2 grids de `admin/tags/page.tsx` (~80 lignes).

### H. Toaster (notifications)
**Cible** : ajout de `sonner` ou `react-hot-toast`.
**Impact** : Suppression des 35 `alert()`.

### I. Validation Zod des bodies API
**Cible** : `src/lib/schemas/*.ts`.
**Impact** : Erreurs typees, moins de boilerplate.

---

## Recommandations prioritaires

### Phase 1 - Quick wins (1-2 jours)
1. **Supprimer `src/components/FiltersNew.tsx`** (code mort, -393 lignes immediatement).
2. **Creer `src/lib/supabaseAdmin.ts`** et migrer les 16 routes -> supprime ~250 lignes et resout 16 instances de bootstrap dupliquee.
3. **Creer `src/lib/api.ts`** avec `errorResponse(error: unknown)` -> resout 33 warnings `no-explicit-any` en une PR.
4. **Activer la regle ESLint `argsIgnorePattern: '^_'`** -> resout 3 warnings `_req` + 1 warning `_options`.
5. **Centraliser `generateSlug`** dans `src/lib/slug.ts`.

**Resultat attendu** : 63 warnings -> ~20. Suppression nette de ~650 lignes.

### Phase 2 - Refactoring structurel (1 semaine)
6. **Decouper `admin/tags/page.tsx`** : extraire `TagModal`, `TagTypeModal`, `IconPicker`, `ColorPicker`, `useTagsData`.
7. **Decouper `admin/product/page.tsx`** : extraire `ProductForm`, `ProductTable`, `useProducts`.
8. **Composant `<Modal>` partage** dans `components/admin/` + utilisation dans toutes les pages.
9. **Centraliser les types** dans `src/types/entities.ts` (idealement via `supabase gen types`).
10. **Remplacer `alert()` par toast** (35 occurrences).

**Resultat attendu** : Aucun fichier > 300 lignes. Aucun warning `no-explicit-any`.

### Phase 3 - Qualite long terme (en continu)
11. **Adopter Zod** pour la validation des payloads API.
12. **Tests unitaires `useCart`** (~270 lignes, 0 test actuellement).
13. **Extraire la logique de filtrage catalogue** dans `src/lib/catalogue-filters.ts` et la tester.
14. **Generer les types Supabase** automatiquement (`supabase gen types typescript`).
15. **Supprimer les bandeaux "NE PAS MODIFIER"** au profit de JSDoc factuels.

**Resultat attendu** : Couverture > 30%, types DB synchronises, code lisible.

---

**Conclusion** : Le projet est bati sur des bases saines (TypeScript strict, alias, pas de relative imports, console clean) mais souffre d'une dette de duplication massive concentree sur l'admin. **70% des warnings ESLint et 90% des lignes de dette peuvent etre supprimees en 2 PRs** : `supabaseAdmin` helper + suppression `FiltersNew`. Le decoupage des pages admin geantes est le projet de fond pour les semaines suivantes.
