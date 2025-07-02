# 🛍️ Skincare Laser - E-commerce Next.js

Application e-commerce pour produits de soins avec dashboard admin.

## 🚀 Démarrage rapide

```bash
# Installation
npm install

# Configuration
cp .env.local.example .env.local
# Ajouter vos clés Supabase

# Base de données
# 1. Exécuter db/schema_complet.sql dans Supabase
# 2. Exécuter db/populate_catalog.sql pour les produits

# Lancer le projet
npm run dev
```

## 📚 Documentation

Voir **[DOCUMENTATION_COMPLETE.md](DOCUMENTATION_COMPLETE.md)** pour la documentation détaillée.

## 🔐 Compte admin

- Email : j@gmail.com
- Mot de passe : 123456789

## 🛠️ Stack

- Next.js 15 + TypeScript
- Supabase (Auth + Database)
- Tailwind CSS
- Vitest + Playwright

**Résumé persistant** : README simple avec démarrage rapide. Documentation complète dans DOCUMENTATION_COMPLETE.md.

## Optimisations et stratégies de mise en cache

L'application intègre plusieurs stratégies pour des performances optimales :

- **Rendu statique de la page catalogue** avec revalidation toutes les 60 secondes
- **Mise en cache des requêtes API** avec Next.js `unstable_cache`
- **Stratégie de revalidation incrémentale** pour les pages produits
- **Prefetching et chargement progressif des images** avec Next.js Image
- **Compression et optimisation automatique** des assets avec Next.js

Ces optimisations permettent d'obtenir de très bonnes performances web vitals, notamment sur les métriques LCP, FID et CLS.

## Migration de la base de données

Pour ajouter les nouveaux champs au formulaire d'inscription (prénom, nom, téléphone, date de naissance), vous devez exécuter la migration suivante :

### Option 1 : Via l'interface Supabase
1. Connectez-vous à votre dashboard Supabase
2. Allez dans l'éditeur SQL
3. Copiez et exécutez le contenu du fichier `db/add_profile_fields.sql`

### Option 2 : Via la ligne de commande
```bash
# Si vous avez Supabase CLI installé
supabase db push db/add_profile_fields.sql --db-url <YOUR_DATABASE_URL>
```

### Option 3 : Via le script Node.js
```bash
# Assurez-vous d'avoir les variables d'environnement configurées
node scripts/migrate_profiles.js
```

Les champs ajoutés sont :
- `first_name` (TEXT) - Prénom de l'utilisateur
- `last_name` (TEXT) - Nom de famille
- `phone` (TEXT) - Numéro de téléphone
- `birth_date` (DATE) - Date de naissance
