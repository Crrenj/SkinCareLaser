# Audit SEO

Dernière mise à jour : 2026-05-26

## Synthèse

**Note : A- (8/10) — SEO technique quasi-complet**

Le site est passé de 2/10 (quasi-invisible pour Google) à 8/10. Toutes les pages publiques ont des métadonnées dynamiques, un sitemap avec hreflang, JSON-LD sur les fiches produit, et des URLs slug-based.

## Couverture SEO

### Pages avec metadata (28 pages publiques)

| Page | `generateMetadata` | Hreflang | OpenGraph | Structured Data |
|---|---|---|---|---|
| Home | ✅ | ✅ 3 locales | ✅ | ❌ |
| Product [slug] | ✅ dynamique (nom + marque) | ✅ | ✅ images | ✅ JSON-LD Product |
| Catalogue | ✅ | ✅ | ✅ | ❌ |
| Marques / [slug] | ✅ | ✅ | ❌ images | ❌ |
| Besoins [slug] | ✅ | ✅ | ❌ images | ❌ |
| Legal (×4) | ✅ | ✅ | ❌ | ❌ |
| Contact, FAQ, About, etc. (×6) | ✅ | ✅ | ✅ basic | ❌ |
| Account (×4) | ✅ noindex | ✅ | ✅ basic | ❌ |

### Sitemap (`src/app/sitemap.ts`)

4 types d'entrées dynamiques :
1. **Routes statiques** (13 paths × 3 locales = 39 entrées) avec priorité 0.3–1.0
2. **Produits** (dynamique, actifs seulement) — weekly, priority 0.7
3. **Marques** (dynamique) — weekly, priority 0.6
4. **Besoins/Tags** (dynamique, type `besoins`) — weekly, priority 0.6

Toutes les entrées ont des alternates hreflang pour les 3 locales.

### Robots.txt (`src/app/robots.ts`)
Disallow : admin, api, account, auth, cart. Sitemap référencé.

## Findings

### ~~1-6. Metadata, sitemap, robots, metadataBase, generateMetadata, hreflang~~ ✅ TOUS FERMÉS
Tout en place sur les 28 pages publiques.

### ~~7. URLs `/product/{uuid}` → `/product/{slug}`~~ ✅ FERMÉ
Colonne `slug` UNIQUE utilisée partout.

### ~~8. `<html lang="en">` erroné~~ ✅ FERMÉ
`<html lang={locale}>` dynamique.

### ~~9-13. OpenGraph, JSON-LD Product, next/image~~ ✅ FERMÉS
- JSON-LD Product sur PDP (`ProductJsonLd.tsx` Server)
- OpenGraph sur toutes les pages publiques
- `next/image` partout

### 14. Schema.org manquant sur catalogue/marques — ❌ OUVERT (Low)
Pas de `CollectionPage` ou `ItemList` structured data sur les pages listing.
**Recommandation** : ajouter JSON-LD `CollectionPage` avec les premiers 10-20 produits.

### 15. og:image manquant sur marques/besoins — ❌ OUVERT (Low)
Ces landing pages n'ont pas d'image OpenGraph pour les partages sociaux.
**Recommandation** : query un produit représentatif et utiliser son image.

## Recommandations

1. **(Low)** Ajouter JSON-LD `CollectionPage` sur catalogue et marques
2. **(Low)** Ajouter `og:image` dynamique sur marques/[slug] et besoins/[slug]
3. **(Low)** Ajouter `AggregateRating` sur `ProductJsonLd` si système de reviews un jour
4. **(Low)** Sitemap index quand le nombre de produits dépasse ~5 000
