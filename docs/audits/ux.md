# Audit UX / Product

Dernière mise à jour : 2026-05-27

## Synthèse

**Note : B+ (7.5/10) — expérience cohérente, catalogue paginé serveur**

Amélioration massive depuis 4/10 initial. Les 3 frictions majeures (tunnel d'achat cassé, catalogue limité à 100 produits, incohérence visuelle) sont toutes résolues. Le site est maintenant un catalogue dermo-cosmétique fonctionnel avec réservation click & collect, wishlist, recherche live, et i18n complet.

## Parcours utilisateur actuel

```
[Home /]  7 sections (Hero → Bestsellers → ByNeed → Quote → Brands → Expertise → Routine)
   |
   | NavBar: catalogue, marques, recherche ⌘K, langue FR/ES/EN
   v
[/catalogue]  353 produits, filtres client-side (marque, gamme, besoin, type-peau, ingrédients)
   |  CatalogueToolbar sticky + CatalogueSidebar flat 280px + pagination tiles
   v
[/product/{slug}]  galerie sticky + 5 accordéons + pharmacist conditionnel + sticky bar mobile
   |
   | "Ajouter au panier" → toast + badge cart
   v
[CartDrawer]  ou  [/cart]
   |
   | "Réserver" (user connecté, téléphone renseigné)
   v
[/reservation]  3 étapes (adresse → livraison → récap) → RPC create_reservation
   |
   v
[/reservation/confirmation/{id}]  référence FAR-YYYYMMDD-XXXX
   |
   | Admin contacte via WhatsApp pré-rempli → confirme → collecte
```

## Findings

### ~~1. Tunnel s'arrête au panier~~ ✅ FERMÉ → SYSTÈME DE RÉSERVATION
Click & collect complet : RPC create_reservation, auto-expiration 24h pg_cron, admin UI avec WhatsApp.

### ~~2. Catalogue limité à 100 produits~~ ✅ FERMÉ
Limite portée à 500. 353 produits affichés avec filtres et pagination ellipsis.

### ~~3. Incohérence visuelle blue/sand~~ ✅ FERMÉ
Design system unifié sand/clay/ink. Sprint 2-4 ont refondu toutes les surfaces publiques et admin.

### ~~4. Footer liens morts~~ ✅ FERMÉ
Toutes les catégories, besoins, et pages câblés.

### ~~5. Contact exige un compte~~ ⚠️ PARTIEL
Rate limit ajouté. La validation email reste côté RPC mais le formulaire fonctionne.

### ~~6. Dropdown langue non fonctionnel~~ ✅ FERMÉ
`LocaleSwitcher` fonctionnel desktop + mobile. Admin : cookie-based switcher in-place.

### ~~7. Filtres catalogue 100% client-side~~ ✅ FERMÉ (session 2026-05-27)
Filtrage, tri, comptage facetté et pagination migrés côté serveur. 24 produits/page. Filtres URL-driven.

### ~~8. Homepage vide~~ ✅ FERMÉ
7 sections data-driven. Bestsellers via `v_bestsellers`, besoins via `tags.featured_on_home`, marques live.

### ~~9. Recherche absente~~ ✅ FERMÉ
`NavSearch` avec ⌘K, dropdown live SWR, recents localStorage, bestsellers fallback no-result.

### ~~10. Wishlist absente~~ ✅ FERMÉ
Table RLS + API + heart ProductCard + PDP + page `/favoris`.

### ~~11. `alert()` natifs~~ ✅ QUASI-FERMÉ
31 toasts via sonner. **3 `alert()` restants** (admin users/newsletter).

### ~~12. 3 `alert()` restants~~ ✅ FERMÉ (session 2026-05-27)
0 alert() restant.

### ~~13-14. Autres findings~~ ✅ FERMÉS

## Surfaces livrées (post-audit)

| Surface | Sprint | Type |
|---|---|---|
| NavBar 3 rangées + ⌘K + drawer mobile | 2 | Chrome |
| ProductCard refonte (aspect 4/5, flags, quick-add) | 2 + 4 | Composant |
| PDP 5 accordéons + galerie sticky + sticky bar mobile | 2 | Page |
| Bannières editorial/hero/quote | 2 | CMS |
| Home 7 sections | 2 | Page |
| Footer 5 colonnes + newsletter | 2 | Chrome |
| Wishlist (table + API + UI + page) | 2 | Feature |
| `/marques` index + `/marques/[slug]` | Session 1 | Pages |
| 4 pages légales + CookieBanner | Session 2 | Pages |
| Hub `/account` (4 sous-pages) | Session 3 | Pages |
| 4 pages éditoriales (livraison, faq, pharmacie, manifeste) | Session 4 | Pages |
| Admin users + newsletter | Session 5 | Pages |
| JSON-LD Product + last `<img>` → `next/image` | Session 6 | SEO |
| About 8 sections (Sprint 4 redesign) | Sprint 4 | Page |
| Catalogue redesign (sidebar flat, toolbar sticky, pagination tiles) | Sprint 4 | Page |
| Admin Sprint 3 (product/marques/stock/tags/messages/annonce) | Sprint 3 | Pages |
| Admin i18n (cookie-based, FR/ES/EN) | Sprint 3 | Feature |
| 13 popups & drawers modernisés | Sprint 4+ | UX |

## Recommandations

1. ~~**(Medium)** Filtres catalogue serveur~~ ✅
2. ~~**(Low)** 3 derniers alert()~~ ✅
3. **(Low)** Ajouter des landing pages éditorial pour les marques populaires (contenu)
