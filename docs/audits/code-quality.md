# Audit Qualité de Code

Dernière mise à jour : 2026-05-26

## Synthèse

**Note : A- (8.5/10) — code propre, discipline TypeScript exemplaire**

Amélioration spectaculaire depuis C+ (6.5/10). Les hot spots initiaux (duplication service-role ×16, 4 pages admin >700 LOC, 393 LOC code mort) sont tous résolus. 0 `any`, 0 warning ESLint, 0 `<img>` brut.

## Métriques

| Indicateur | Initial (05-19) | Actuel (05-26) |
|---|---|---|
| Fichiers TS/TSX | 67 | **241** |
| Total LOC | ~12 690 | **31 315** |
| Erreurs tsc | 0 | **0** |
| Warnings ESLint | 73 | **0** |
| Usages `any` | 32 | **0** |
| `@ts-ignore` / `@ts-expect-error` | ? | **0** |
| `alert()` | 35 | **3** |
| `toast()` | 0 | **31** |
| `focus-visible` | 0 | **67** |
| `focus:outline-none` | ~50 | **0** |
| `<img>` natifs | 5 | **0** |
| `role="dialog"` | 0 | **18** |
| Fichiers > 500 LOC | 4 admin | **1** (CatalogueClient 513) |
| Code mort | ~825 LOC | **0** |
| Console.error/log | 120 | 126 |
| Imports relatifs `../` | 0 | **0** |
| Couverture tests | <5% | ~15% (E2E) |

## Findings

### ~~1. Duplication bootstrap service-role (×16)~~ ✅ FERMÉ
Singleton `supabaseAdmin.ts`. ~300 LOC supprimées.

### ~~2. 4 pages admin > 660 LOC~~ ✅ FERMÉ (4 sur 8)
tags (797→211), product (733→157), marques (765→229), annonce (828→162).
**Restent >450 LOC** : reservations (498), messages (489), stock (468), settings (395).

### ~~3. `FiltersNew.tsx` code mort (393 LOC)~~ ✅ FERMÉ
Supprimé avec `ProductDetailCard.tsx`, `ImageUpload.tsx`, `DirectImageUpload.tsx`.

### ~~4. 73 warnings ESLint~~ ✅ FERMÉ
0 warning. Config ESLint honore `^_` pattern pour les unused vars.

### ~~5. 32 `any` types~~ ✅ FERMÉ
Types Supabase générés. 0 usage de `any`.

### ~~6. `alert()` natifs (35)~~ ✅ QUASI-FERMÉ
3 restants (UsersClient ×2, NewsletterClient ×1).

### 7. 126 `console.error/log` — ❌ OUVERT (Medium)
Pas de logger structuré. `console.error` est le seul outil d'observabilité serveur.
**Recommandation** : wrapper dans un helper `log.error()` avec contexte (route, user).

### 8. 4 pages admin >450 LOC — ❌ OUVERT (Low)
| Page | LOC | Pourrait splitter |
|---|---|---|
| `reservations/page.tsx` | 498 | ReservationsTable + ReservationFilters |
| `messages/page.tsx` | 489 | MessagesList + MessageFilters |
| `stock/page.tsx` | 468 | StockTable + StockKPIs |
| `settings/page.tsx` | 395 | SettingsTabs + SettingsForm |

### 9. DeleteConfirmModal dupliqué — ❌ OUVERT (Low)
3 copies quasi-identiques dans marques/_components, product/_components, tags/_components.
Diffèrent seulement par les strings (hardcodées en espagnol).
**Recommandation** : extraire un composant partagé avec clés i18n.

### ~~10-18. Autres findings initiaux~~ ✅ FERMÉS

## Patterns à suivre

### ✅ À promouvoir
- **Server Component data-mapping** : fetch Supabase → map → passer au Client Component
- **Hook pour cross-cutting** : `useIsAdmin`, `useCart`, `useWishlist` — SWR + optimistic
- **Singleton lazy** : `supabaseAdmin.ts` pattern — pas de client instancié à l'import
- **`_components/` + `_hooks/` + `_lib/`** : colocation par page admin (4 pages migrées)
- **`useModalA11y`** : focus trap, Escape, scroll lock — réutiliser pour tout nouveau dialog

### ❌ À éviter
- `'use client'` sur une page entière quand seuls 30% sont interactifs
- Spread `...body` sur les mutations API (liste blanche de champs)
- Types ad-hoc par fichier (utiliser `database.types.ts` ou `src/types/`)
- `console.error` direct (centraliser le logging)

## Recommandations

1. **(Medium)** Centraliser le logging (126 console.error → helper structuré)
2. **(Low)** Splitter les 4 pages admin >450 LOC
3. **(Low)** Unifier DeleteConfirmModal (3 copies → 1 partagé avec i18n)
4. **(Low)** Ajouter tests unitaires pour les hooks critiques (useCart, useWishlist)
