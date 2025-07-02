# 📚 DOCUMENTATION COMPLÈTE - SKINCARE LASER

## 🎯 Vue d'ensemble du projet

**Skincare Laser** est une application e-commerce Next.js 15 avec :
- 🛍️ Catalogue de produits de soins
- 🛒 Système de panier d'achat
- 👤 Authentification utilisateur/admin
- 🔒 Dashboard admin protégé

## 🛠️ Stack technique

- **Frontend** : Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **Déploiement** : Vercel-ready
- **Tests** : Vitest, Playwright

## 📁 Structure du projet

```
skincarelaser/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── (auth)/            # Pages authentification
│   │   │   ├── login/         # Page de connexion
│   │   │   └── signup/        # Page d'inscription
│   │   ├── admin/             # Section admin
│   │   │   └── dashboard/     # Dashboard admin
│   │   ├── cart/              # Page panier
│   │   ├── catalogue/         # Page catalogue
│   │   ├── product/[id]/      # Détail produit
│   │   └── debug/             # Page de debug auth
│   ├── components/            # Composants React
│   ├── contexts/              # Contexts React (CartContext)
│   ├── hooks/                 # Hooks personnalisés
│   ├── lib/                   # Utilitaires (supabaseClient)
│   └── middleware.ts          # Protection des routes
├── db/
│   ├── schema_complet.sql     # Schema BD complet
│   ├── populate_catalog.sql   # Données produits
│   └── contenu_bd/            # Images produits
├── public/                    # Assets statiques
├── scripts/                   # Scripts utilitaires
└── tests/                     # Tests E2E
```

## 🗄️ Base de données

### Tables principales

1. **profiles** - Utilisateurs et admins
   - `id` (UUID) - Lié à auth.users
   - `display_name` - Nom d'affichage
   - `is_admin` - Boolean pour les admins
   - `role` - Rôle textuel (user/admin)

2. **products** - Catalogue produits
   - `id` (UUID) - Identifiant unique
   - `name`, `description`, `price`
   - `category`, `sub_category`
   - `image_url` - URL de l'image
   - `stock` - Quantité en stock

3. **carts** - Paniers d'achat
   - Support utilisateurs connectés et anonymes
   - `user_id` ou `anonymous_id`

4. **cart_items** - Articles du panier
   - Lien vers cart et product
   - `quantity` - Quantité

5. **admin_users** - Table helper pour éviter la récursion RLS

### Configuration SQL

Tout est dans `db/schema_complet.sql` :
- Tables avec RLS activé
- Policies de sécurité
- Triggers automatiques
- Fonctions utilitaires
- Compte admin par défaut

## 🔐 Authentification

### Système d'authentification

- **Supabase Auth** pour la gestion des utilisateurs
- **Middleware Next.js** pour protéger `/admin/*`
- **Profils automatiques** via trigger PostgreSQL

### Compte admin par défaut

- **Email** : j@gmail.com
- **Mot de passe** : 123456789
- **UUID** : e7bc4c23-a9c8-4551-b212-b6a540af21ed

### Pages d'authentification

- `/login` - Connexion avec redirection selon le rôle
- `/signup` - Inscription nouveaux utilisateurs
- `/debug` - Vérification état authentification

## 🚀 Installation et démarrage

### Prérequis

- Node.js 18+
- Compte Supabase
- Variables d'environnement dans `.env.local`

### Installation

```bash
# Cloner le projet
git clone [url-du-repo]
cd skincarelaser

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos clés Supabase
```

### Configuration base de données

1. Dans Supabase Dashboard > SQL Editor
2. Exécuter `db/schema_complet.sql`
3. Exécuter `db/populate_catalog.sql` pour les produits

### Démarrage

```bash
# Mode développement
npm run dev

# Le serveur démarre sur http://localhost:3000
# Ou http://localhost:3001 si le port 3000 est pris
```

## 🎨 Fonctionnalités principales

### Catalogue produits
- Affichage grille responsive
- Filtres par catégorie
- Recherche
- Détail produit avec images

### Panier d'achat
- Ajout/suppression articles
- Mise à jour quantités
- Persistance (localStorage + BD)
- Support utilisateurs anonymes

### Dashboard admin
- Accès protégé par middleware
- Gestion des produits (à venir)
- Gestion des commandes (à venir)
- Statistiques (à venir)

## 📝 Scripts utiles

```bash
# Développement
npm run dev          # Démarrer en mode dev
npm run build        # Build production
npm run start        # Démarrer build production

# Tests
npm test            # Tests unitaires (Vitest)
npm run test:e2e    # Tests E2E (Playwright)

# Lint et format
npm run lint        # ESLint
npm run format      # Prettier
```

## 🔧 Configuration

### Variables d'environnement

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[votre-clé-anon]
```

### Middleware

Le middleware protège les routes `/admin/*`. Actuellement :
- Version simplifiée dans `src/middleware.ts`
- Version complète dans `src/middleware.fixed.ts`

## 🐛 Debug et dépannage

### Page de debug

Accédez à `/debug` pour vérifier :
- État de connexion
- Profil utilisateur
- Permissions admin

### Problèmes courants

1. **Port 3000 occupé** : Le serveur utilise automatiquement 3001
2. **Redirection bloquée** : Vider cache/cookies du navigateur
3. **Erreur RLS** : Vérifier les policies dans Supabase

## 📈 Prochaines étapes

- [ ] Interface de gestion des produits dans admin
- [ ] Système de commandes complet
- [ ] Intégration paiement
- [ ] Emails transactionnels
- [ ] Optimisation performances
- [ ] Tests automatisés complets

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés.

---

**Développé avec ❤️ pour Skincare Laser** 