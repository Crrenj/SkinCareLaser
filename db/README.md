# 📁 Base de données - Skincare Laser

## 📝 Fichiers principaux

- **`schema_complet.sql`** - Configuration complète de la base de données
  - Tables (profiles, products, carts, cart_items)
  - Policies RLS
  - Triggers et fonctions
  - Compte admin par défaut

- **`populate_catalog.sql`** - Données du catalogue produits
  - 180+ produits de soins
  - Catégories et sous-catégories
  - Images et descriptions

- **`contenu_bd/`** - Images des produits

## 🚀 Installation

1. Dans Supabase Dashboard > SQL Editor
2. Exécuter `schema_complet.sql`
3. Exécuter `populate_catalog.sql` (optionnel, pour les produits)

## 👤 Compte admin

- Email : j@gmail.com
- UUID : e7bc4c23-a9c8-4551-b212-b6a540af21ed

**Résumé persistant** : schema_complet.sql = toute la config BD. populate_catalog.sql = produits. Exécuter dans Supabase. 