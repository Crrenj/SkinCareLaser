# Audit Base de Données

Dernière mise à jour : 2026-05-26

## Synthèse

**Note : B+ (8/10) — schéma solide, bien indexé, RLS complet**

Le schéma a été significativement amélioré depuis l'audit initial (B-). Les 3 dettes principales (indexes FK manquants, `product_ranges` n-n inutile, `image_url` dupliquée) sont fermées. 22 migrations ordonnées, toutes idempotentes (`IF NOT EXISTS` / `CREATE OR REPLACE`).

## Inventaire

### Tables (21)

| Domaine | Tables | Colonnes | RLS |
|---|---|---|---|
| Auth | `profiles` (8), `admin_users` (2) | 10 | ✅ / ⚠️ intentionnel |
| Catalogue | `products` (15), `brands` (4), `ranges` (4), `tags` (5), `tag_types` (7), `product_tags` (2), `product_images` (4) | 41 | ✅ |
| Panier | `carts` (5), `cart_items` (6) | 11 | ✅ |
| Réservations | `reservations` (13), `reservation_items` (7) | 20 | ✅ |
| CMS | `banners` (15) | 15 | ✅ |
| Support | `contact_messages` (11) | 11 | ✅ |
| Boutique | `shop_settings` (14, single-row) | 14 | ✅ |
| Users | `newsletter_subscribers` (7), `wishlists` (3) | 10 | ✅ |
| Infra | `rate_limit_buckets` (3) | 3 | ✅ |
| Legacy | `orders` (5), `order_items` (5) | 10 | ✅ |

### Vues (2)
- `tags_with_types` — jointure dénormalisée tags ⋈ tag_types
- `v_bestsellers` — produits triés par `sold_30d` desc + `is_featured` desc + `created_at` desc

### Fonctions RPC (15, toutes SECURITY DEFINER)

| Fonction | search_path | Usage |
|---|---|---|
| `is_user_admin` | ✅ | Pierre angulaire RLS (15+ policies) |
| `handle_new_user` | ✅ | Trigger post-signup |
| `get_or_create_cart` | ✅ | Cart guest/auth |
| `add_to_cart` | ✅ | Incrémentation quantité |
| `remove_from_cart` | ✅ | Avec user_id explicite |
| `merge_anon_cart_to_user` | ✅ | Login : anon → auth |
| `check_rate_limit` | ✅ | Fixed-window IP |
| `create_reservation` | ✅ | Snapshot + vide cart |
| `expire_stale_reservations` | ✅ | pg_cron toutes les 5 min |
| `create_contact_message` | ✅ | Public, rate-limited |
| `mark_message_as_read` | ✅ | Admin |
| `get_messages_stats` | ✅ | Dashboard admin |
| `reorder_banners` | ✅ | Admin CMS |
| `cleanup_banner_positions` | ✅ | Trigger after delete |
| `update_updated_at_column` | ✅ | Trigger générique |

### Indexes (25)
Toutes les FK sont indexées. Indexes composites sur les filtres courants (banners, messages, réservations, newsletter).

## Findings

### ~~1. `product_ranges` n-n utilisée 1-n~~ ✅ FERMÉ
Migration `20260522205544` : `products.range_id` FK directe, table `product_ranges` supprimée.

### ~~2. Indexes FK manquants~~ ✅ FERMÉ
Migrations `20260519140420` + `20260520131704` : 11+ indexes ajoutés.

### 3. `auth.uid()` non wrappé dans `(SELECT auth.uid())` — ❌ OUVERT (Medium)
PostgREST réévalue `auth.uid()` par ligne. Wrapping dans `(SELECT ...)` permet au planificateur de n'évaluer qu'une fois.
**Impact** : perf dégradée sur les SELECT volumineux via RLS.

### 4. `is_user_admin` non marquée STABLE — ❌ OUVERT (Low)
La fonction est pure pour une même transaction. Marquer `STABLE` permettrait au planificateur de la cacher.

### ~~5. `products.image_url` dupliqué~~ ✅ FERMÉ
Migration `20260522144853`. Source unique : `product_images`.

### ~~6. `profiles.is_admin` legacy~~ ✅ FERMÉ
Migration `20260523104708`. Colonne supprimée, `admin_users` seule source.

### ~~7. `search_path` manquant sur SECURITY DEFINER~~ ✅ FERMÉ
Migration `20260522092810` sur les 9 fonctions restantes.

### 8. Vue `tags_with_types` non matérialisée — ❌ OUVERT (Low)
Jointure recalculée à chaque requête. 36 tags × 6 types → impact négligeable à cette échelle.
Matérialiser si volume tags dépasse ~500.

### 9. `banner_type_enum` manquant — ❌ OUVERT (Low)
La colonne `banners.type` reste `text` pour compat legacy (6 anciens types + 3 nouveaux).
**Recommandation** : créer un enum strict quand les 6 legacy sont éliminés du code.

### ~~10-16. Autres findings initiaux~~ ✅ TOUS FERMÉS
Rate limit, newsletter, wishlists, shop_settings, sprint 2 colonnes, etc.

## Volumétrie actuelle

| Table | Lignes |
|---|---|
| `products` | 353 (actifs, stock=50, prix=100 DOP placeholder) |
| `product_images` | 299 |
| `product_tags` | 844 |
| `brands` | 13 |
| `ranges` | 52 |
| `tags` | 36 |
| `tag_types` | ~6 |
| `shop_settings` | 1 |
| `admin_users` | 1 |

## Migrations (22)

Toutes dans `supabase/migrations/`, ordonnées par timestamp UTC. Idempotentes.
Source de vérité pour le schéma. `db/schema.sql` est un snapshot de lecture dérivé.

## Recommandations

1. **(Medium)** Wrapper `auth.uid()` dans `(SELECT auth.uid())` dans les policies RLS
2. **(Low)** Marquer `is_user_admin` comme `STABLE`
3. **(Low)** Supprimer la table `orders` + `order_items` si le modèle réservation est confirmé
4. **(Low)** Matérialiser `tags_with_types` si volume dépasse 500 tags
