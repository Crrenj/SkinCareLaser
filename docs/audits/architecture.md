# Audit Architecture

Dernière mise à jour : 2026-05-27

## Synthèse

**Note : A (9/10) — architecture saine, dette résiduelle minimale**

Le projet a subi une transformation majeure depuis l'audit initial (B-). Les 5 dettes principales identifiées (routes admin non auth, duplication service-role, image dupliquée, code mort, types ad-hoc) sont toutes fermées. L'architecture est maintenant bien structurée avec une séparation claire Server/Client, un système i18n mature, et un design system cohérent.

### Inventaire structurel (2026-05-26)

```
src/ (31 315 LOC, 241 fichiers)
├── app/
│   ├── [locale]/              # 28 pages publiques (SSR + ISR)
│   │   ├── page.tsx           # Home (7 sections, SSR revalidate=60)
│   │   ├── catalogue/         # CatalogueClient (513 LOC)
│   │   ├── product/[slug]/    # PDP SSR + ProductClient
│   │   ├── cart/              # CartClient
│   │   ├── reservation/       # 3-step flow + confirmation
│   │   ├── account/           # 4 sous-pages (profile/reservations/security/preferences)
│   │   ├── (auth)/            # login/signup/forgot-password/reset-password
│   │   ├── marques/ [slug]/   # Index + landing par marque
│   │   ├── besoins/[slug]/    # Landing par tag besoin
│   │   ├── favoris/           # Wishlist
│   │   ├── legal/             # 4 pages juridiques
│   │   └── (6 pages éditoriales)
│   ├── admin/                 # 12 pages admin (client-only)
│   │   ├── layout.tsx         # Server: NextIntlClientProvider
│   │   ├── _AdminShell.tsx    # Client: auth-gate + sidebar
│   │   └── {product,marques,stock,tags,messages,annonce,
│   │        reservations,users,newsletter,settings,setup}/
│   └── api/                   # 24 routes admin + 8 routes publiques
│       ├── admin/             # Toutes requireAdmin()
│       └── {cart,contact,newsletter,search,wishlist,account}/
├── components/                # ~100 composants, 14 sous-dossiers
│   ├── home/ (7), pdp/ (9), catalogue/ (6), about/ (10)
│   ├── admin/ (15), cart/ (4), reservation/ (6)
│   ├── banners/ (3), legal/ (3), footer/ (1), auth/ (4)
│   ├── account/ (3), confirmation/ (5), ui/ (2)
│   └── (12 composants racine : NavBar, ProductCard, NavSearch, etc.)
├── hooks/                     # 6 hooks
├── i18n/                      # routing, request, navigation
├── lib/                       # 12 utilitaires
├── messages/                  # fr.json, es.json, en.json (~1 360 clés chacun)
└── types/                     # cart.ts + database.types.ts (1 091 LOC, généré)
```

## Findings

### ~~1. Routes admin non authentifiées~~ ✅ FERMÉ
`requireAdmin()` sur 24 routes. Singleton `supabaseAdmin` typé `Database`.

### ~~2. Duplication bootstrap service-role (×16)~~ ✅ FERMÉ
`src/lib/supabaseAdmin.ts` singleton. ~300 LOC éliminées.

### ~~3. Ambiguïté `image_url` vs `product_images`~~ ✅ FERMÉ
Migration `20260522144853` a supprimé `products.image_url`. Source unique : `product_images`.

### ~~4. Code mort (825 LOC)~~ ✅ FERMÉ
`FiltersNew.tsx`, `ProductDetailCard.tsx`, `ImageUpload.tsx`, `DirectImageUpload.tsx` supprimés.

### ~~5. ProductCard `<button>` dans `<Link>`~~ ✅ FERMÉ
Refonte "stretched link" pattern. Plus de HTML invalide.

### ~~6. `useAuth` mélange side-effects~~ ✅ FERMÉ
Hook refactorisé. `useRef` pour éviter les re-fires au focus tab.

### ~~7. Trois clients Supabase hétérogènes~~ ✅ FERMÉ
3 fichiers clairs : `supabaseClient.ts` (browser), `supabaseServer.ts` (cookies), `supabaseAdmin.ts` (service-role singleton).

### ~~8. Auth admin checkée à 4 endroits différents~~ ✅ FERMÉ
Unifiée via RPC `is_user_admin` partout (middleware, requireAdmin, useIsAdmin, login, callback).

### ~~9. Types Product/Brand/Tag redéfinis ad-hoc~~ ✅ FERMÉ
Types générés dans `database.types.ts` via MCP. 0 usage de `any`.

### ~~10. Pages admin > 600 LOC~~ ✅ FERMÉ (6/8 splittées)
6 pages splittées (product, tags, marques, annonce, messages, stock) en `_lib/` + `_hooks/` + `_components/`.
**Restent >300 LOC** : `reservations` (498, mais a déjà des sous-composants importés), `settings` (395).

### ~~11. Banner.tsx 7 variantes~~ ✅ FERMÉ
Refonte en 3 composants : `BannerEditorial`, `BannerHero`, `BannerQuote` + dispatcher.

### 12. CatalogueClient 513 LOC — ❌ OUVERT (Medium)
Le plus gros composant hors fichiers générés. Mélange filtrage client-side, tri, rendering.
**Recommandation** : extraire `useCatalogueFilters` hook + `CatalogueGrid` composant.

### ~~13. DeleteConfirmModal dupliqué~~ ✅ FERMÉ (session 2026-05-27)
3 modaux custom supprimés, remplacés par `useConfirmDialog` dans les 3 pages. 18 clés i18n ajoutées (FR/ES/EN).

## 3 clients Supabase — guide actuel

| Client | Fichier | Usage |
|---|---|---|
| Browser | `src/lib/supabaseClient.ts` | Client Components. Pas de fallback localStorage. |
| Server (cookies) | `src/lib/supabaseServer.ts` | Server Components, route handlers pour le user. |
| Service-role | `src/lib/supabaseAdmin.ts` | Singleton typé `Database`. Routes admin + opérations privilégiées. |

## Hooks (6)

| Hook | Rôle | Consommateurs |
|---|---|---|
| `useAuth` | Auth state + cart merge on login | `AuthProvider` |
| `useCart` | SWR `/api/cart` + optimistic updates | CartClient, AddToCartButton |
| `useIsAdmin` | Session + admin check (JWT + RPC) | AdminShell, NavBar |
| `useWishlist` | SWR `/api/wishlist` + toggle optimistic | ProductCardHeart, favoris |
| `useMediaQuery` | SSR-safe media queries | MobileDrawer, responsive |
| `useModalA11y` | Focus trap, Escape, scroll lock, focus restore | 18 modales/drawers |

## Recommandations

1. ~~**(Medium)** Splitter CatalogueClient~~ ✅ (513→230 LOC, filtrage serveur)
2. ~~**(Low)** Unifier DeleteConfirmModal~~ ✅ (useConfirmDialog)
3. ~~**(Low)** Split pages admin~~ ✅ (6/8 splittées, messages 489→150, stock 468→145)
