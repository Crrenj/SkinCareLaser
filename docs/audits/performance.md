# Audit Performance

Dernière mise à jour : 2026-05-27

## Synthèse

**Note : B+ (8/10) — pagination serveur, ISR, images optimisées**

L'architecture App Router + ISR est maintenant correctement configurée. Toutes les pages publiques ont un `revalidate` approprié, toutes les images utilisent `next/image`, et les indexes DB couvrent les FK critiques.

### Stratégie de cache (ISR)

| TTL | Pages |
|---|---|
| 60s (hot) | home, catalogue, product/[slug] |
| 300s (warm) | marques, marques/[slug], besoins/[slug] |
| 86400s (24h) | legal (×4), faq, a-propos, pharmacie, livraison, manifeste |
| force-dynamic | cart, favoris, account/*, reservation |

### Optimisation images
- `next/image` partout (12 imports, **0 `<img>` brut**)
- Formats WebP + AVIF activés
- 8 breakpoints device (640–3840px)
- Remote patterns : `https://**` (tout CDN accepté)

### Fonts
- `display: "swap"` sur Instrument Serif + Be Vietnam Pro
- Pas de FOIT (Flash of Invisible Text)

## Findings

### ~~1. Aucun cache sur Server Components~~ ✅ FERMÉ
`revalidate` exporté sur 15 pages publiques. ISR actif.

### ~~2. Indexes DB manquants~~ ✅ FERMÉ
25 indexes en place (FK + filtres composites).

### ~~3. 5 `<img>` non optimisés~~ ✅ FERMÉ
Tous migrés vers `next/image`. 0 `<img>` brut restant.

### ~~4. Middleware admin 2 round-trips~~ ⚠️ PARTIEL
Middleware fait toujours `getUser()` + RPC `is_user_admin`. Atténué par le fix `useRef` qui évite les re-checks au focus tab.

### ~~5. CatalogueClient — 500+ produits SSR~~ ✅ FERMÉ (session 2026-05-27)
Pagination serveur implémentée : filtrage, tri, comptage facetté côté serveur. 24 produits/page. Filtres URL-driven (?brand=, ?need=, ?sort=, ?page=). CatalogueClient 513→230 LOC. Nouveau `lib/catalogueFilters.ts`.

### 6. Pas de code splitting client — ❌ OUVERT (Medium)
Aucun `next/dynamic` avec `ssr: false` détecté. Les composants client (cart, account, wishlist) sont hydratés même si non visibles.
**Recommandation** : lazy-load les drawers et modales via `dynamic()`.

### 7. Cache-Control headers non configurés — ❌ OUVERT (Low)
Les routes ISR ne posent pas de `s-maxage` explicite. Next.js gère le cache CDN par défaut, mais un contrôle fin améliorerait le hit rate Vercel.

### ~~8. `framer-motion` inutile~~ ✅ FERMÉ
Désinstallé.

### ~~9. `splitChunks` custom retiré~~ ✅ FERMÉ

### ~~10-12. Autres findings initiaux~~ ✅ FERMÉS

## Métriques

| Item | Valeur |
|---|---|
| `<img>` natifs | **0** |
| `next/image` imports | 12 |
| Pages avec `revalidate` | 15 |
| Pages `force-dynamic` | 5 |
| Indexes DB | 25 |
| Fonts avec `display: swap` | 2 |

## Recommandations

1. ~~**(High)** Paginer CatalogueClient~~ ✅ (24/page, filtres serveur)
2. **(Medium)** Code-split les composants lourds client-only (drawers, modales)
3. **(Low)** Configurer `Cache-Control` headers pour les routes ISR
4. **(Low)** Lazy-load les images galerie PDP (seules les 2-3 premières eager)
