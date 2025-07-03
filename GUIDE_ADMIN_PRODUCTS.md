# Guide - Système de gestion des produits Admin

## ⚠️ IMPORTANT : Configuration requise

### 1. Variables d'environnement

Créez ou modifiez votre fichier `.env.local` à la racine du projet :

```bash
# Configuration Supabase (ces valeurs sont dans votre dashboard Supabase)

# URL de votre projet (Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://votreprojet.supabase.co

# Clé anonyme/publique (Settings > API > anon/public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clé de service (Settings > API > service_role) 
# ⚠️ CRITIQUE : Cette clé est OBLIGATOIRE pour le système admin !
# Vous pouvez utiliser l'un de ces noms :
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# ou
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Où trouver la clé de service :**
1. Connectez-vous à votre dashboard Supabase
2. Allez dans Settings > API
3. Copiez la clé `service_role` (pas la clé `anon` !)
4. Collez-la dans `SUPABASE_SERVICE_KEY`

⚠️ **Sécurité** : Ne commitez JAMAIS le fichier `.env.local` ! Il contient des secrets.

### 2. Créer le bucket de stockage

Exécuter le script SQL dans Supabase :

```bash
# Dans le SQL Editor de Supabase, exécutez :
db/create_storage_bucket.sql
```

Ou créer manuellement le bucket `product-image` dans Supabase Storage avec :
- Public : ✅ (activé)
- Taille max : 5MB
- Types MIME autorisés : image/png, image/jpeg, image/jpg, image/webp

### 3. Vérifier la configuration

Après avoir configuré les variables d'environnement, exécutez :

```bash
# Installer les dépendances si nécessaire
npm install

# Vérifier la configuration
node scripts/check-admin-setup.js
```

Ce script vérifiera :
- ✅ Les variables d'environnement
- ✅ La connexion à Supabase
- ✅ L'existence des tables
- ✅ Le bucket de stockage
- ✅ Les permissions

## Dépannage

### Erreur : "supabaseKey is required"

**Cause** : La clé de service n'est pas définie.

**Solution** :
1. Vérifiez que `.env.local` existe à la racine du projet
2. Vérifiez que l'une de ces variables est définie :
   - `SUPABASE_SERVICE_KEY` 
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Redémarrez le serveur Next.js (`npm run dev`)

### Erreur : "Configuration manquante"

**Cause** : Une ou plusieurs variables d'environnement sont manquantes.

**Solution** :
1. Vérifiez toutes les variables dans `.env.local`
2. Assurez-vous qu'il n'y a pas d'espaces autour du `=`
3. Les valeurs ne doivent pas avoir de guillemets

### Erreur : "JSON.parse: unexpected character"

**Cause** : Les API retournent une erreur HTML au lieu de JSON.

**Solution** :
1. Vérifiez la console du terminal pour l'erreur exacte
2. C'est souvent dû à `SUPABASE_SERVICE_KEY` manquante
3. Suivez les étapes de configuration ci-dessus

## Fonctionnalités

### Interface Admin (`/admin/product`)

1. **Liste des produits**
   - Pagination (10 produits par page)
   - Recherche par nom ou description
   - Affichage image, marque, prix, stock
   - Indicateur visuel du stock (vert/jaune/rouge)

2. **Ajouter un produit**
   - Nom et slug (généré automatiquement)
   - Description optionnelle
   - Sélection marque → gamme (hiérarchique)
   - Prix en DOP et stock
   - Upload image PNG (stockée comme `<slug>.png`)

3. **Modifier un produit**
   - Tous les champs éditables
   - Possibilité de changer l'image
   - L'ancienne image est supprimée automatiquement

4. **Supprimer un produit**
   - Confirmation requise
   - Supprime aussi l'image du storage

### Routes API

#### `GET /api/admin/products`
Paramètres query :
- `page` : numéro de page (défaut: 1)
- `limit` : produits par page (défaut: 10)
- `search` : terme de recherche

#### `POST /api/admin/products`
Body JSON :
```json
{
  "name": "Nom du produit",
  "slug": "nom-du-produit",
  "description": "Description",
  "price": 100.00,
  "stock": 50,
  "brand_id": "uuid",
  "range_id": "uuid",
  "imageFile": "base64_string" // optionnel
}
```

#### `PATCH /api/admin/products/[id]`
Même format que POST, tous les champs optionnels

#### `DELETE /api/admin/products/[id]`
Supprime le produit et son image

#### `GET /api/admin/brands`
Retourne toutes les marques avec leurs gammes

## Structure de données

### Table `products`
- `id` : UUID
- `name` : nom du produit
- `slug` : identifiant URL unique
- `description` : description longue
- `price` : prix décimal
- `currency` : devise (défaut: 'DOP')
- `stock` : quantité en stock
- `image_url` : URL publique de l'image
- `is_active` : produit actif/inactif
- `created_at` / `updated_at`

### Relations
- `products` ↔ `ranges` via `product_ranges`
- `ranges` → `brands`

## Sécurité

1. **Routes API** : Utilisent `supabaseAdmin` avec la clé de service
2. **Storage** : Policies RLS permettent seulement aux admins d'uploader
3. **Lecture** : Les images sont publiques pour affichage sur le site

## Problèmes courants

### Images non affichées
- Vérifier que le bucket est bien public
- Vérifier la configuration `next.config.ts` pour les images externes

### Produits sans marque
- S'assurer que les tables `brands` et `ranges` sont peuplées
- Exécuter `db/populate_catalog.sql` si nécessaire 