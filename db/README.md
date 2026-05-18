# Base de données — Skincare Laser / FARMAU

## Fichiers

- **`schema.sql`** — Source de vérité unique. Schéma + RLS + RPC + Storage buckets en un seul script idempotent. À exécuter en premier sur un projet Supabase vierge.
- **`populate_catalog.sql`** — **Obsolète** : seed de test avec URLs `picsum.photos`. Sera remplacé par `scripts/seed-from-contenu-bd.js` (Phase 3) qui charge les vraies images depuis `contenu_bd/`.
- **`storage_policies_dashboard.md`** — Notes manuelles pour configurer les policies Storage via le dashboard si l'exécution SQL échoue.

## Installation sur un projet Supabase neuf

1. Dashboard Supabase → SQL Editor → New query
2. Coller le contenu de `schema.sql` → Run
3. Vérifier la sortie : `Tables créées: 14`, `Policies RLS: ~30`, `Buckets storage: 2`

## Créer un admin

`schema.sql` ne crée plus d'admin par défaut (l'UUID était hardcodé sur l'ancien projet). Procédure :

1. Créer un utilisateur : `node scripts/create-admin-user.js admin@exemple.com motdepasse`
2. Récupérer son UUID dans Authentication > Users
3. SQL Editor :
   ```sql
   INSERT INTO public.admin_users (user_id) VALUES ('<uuid>');
   UPDATE public.profiles SET is_admin = true, role = 'admin' WHERE id = '<uuid>';
   ```

## Architecture des tables

```
auth.users (Supabase Auth)
   ↓
profiles (display_name, is_admin, contact info)   ← FK auth.users.id
admin_users (user_id)                              ← FK auth.users.id, source de vérité pour RLS

brands (acm, avene, ...)
   ↓ 1-n
ranges (Cleanance, Hydrance, ...)
   ↓ n-n via product_ranges
products
   ↑ 1-n
   ├── product_images (urls Storage)
   └── product_tags ↔ tags ↔ tag_types (categories, needs, skin_type, ingredient)
           └── vue tags_with_types (jointure utilisée par le front)

carts (user_id OU anonymous_id)
   ↓ 1-n
cart_items

orders ↓ 1-n order_items     (placeholder — pas encore de checkout)

banners                       (CMS home page)
contact_messages              (formulaire /contact → admin)
```

## RPC disponibles

| Function | Usage |
|----------|-------|
| `is_user_admin(uuid)` | Helper RLS — utilisé dans la plupart des policies |
| `get_or_create_cart(user_id, anonymous_id)` | Appelé par `/api/cart` à chaque requête |
| `add_to_cart(cart_id, product_id, quantity, anon_id)` | POST `/api/cart` |
| `remove_from_cart(product_id, anon_id)` | DELETE `/api/cart` |
| `reorder_banners(id, old, new)` | PUT `/api/admin/banners` lors d'un drag |
| `cleanup_banner_positions()` | Maintenance manuelle |
| `create_contact_message(email, subject, message)` | POST `/api/contact` |
| `mark_message_as_read(id)` | Admin |
| `get_messages_stats()` | GET `/api/admin/messages` |
