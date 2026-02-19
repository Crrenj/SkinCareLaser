# 📧 Guide d'Installation - Système de Messages de Contact

## Vue d'ensemble

Le système de messages de contact permet aux utilisateurs connectés d'envoyer des messages via le formulaire de contact, avec une interface d'administration pour gérer ces messages.

## 🎯 Fonctionnalités

### ✅ Fonctionnalités implémentées :
- **Formulaire de contact** avec validation par email utilisateur
- **Interface admin** pour consulter et gérer les messages
- **Validation stricte** : seuls les emails d'utilisateurs existants peuvent envoyer des messages
- **Système de statuts** : non lu, lu, répondu, archivé
- **Statistiques** en temps réel
- **Recherche et filtrage** des messages
- **Politiques RLS** pour la sécurité

### 🔧 Composants créés :
- `db/create_messages_system.sql` - Script de création de la base de données
- `src/app/api/contact/route.ts` - API publique pour le formulaire
- `src/app/api/admin/messages/route.ts` - API admin pour la gestion
- `src/app/admin/messages/page.tsx` - Interface admin
- `src/components/ContactForm.tsx` - Composant formulaire
- `src/app/contact/page.tsx` - Page de contact mise à jour

## 🚀 Installation

### 1. Création de la base de données

**Option A : Via l'interface Supabase (Recommandée)**
1. Connectez-vous à [Supabase](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans "SQL Editor"
4. Copiez le contenu de `db/create_messages_system.sql`
5. Exécutez le script

**Option B : Via les scripts Node.js**
```bash
# Installer les dépendances si nécessaire
npm install @supabase/supabase-js

# Exécuter le script d'installation
node scripts/setup-messages-system.js
```

### 2. Vérification de l'installation

1. **Vérifiez la table** dans Supabase :
   - Table `contact_messages` créée
   - Politiques RLS activées
   - Fonctions SQL créées

2. **Testez avec le fichier HTML** :
   ```bash
   # Démarrez l'application
   npm run dev
   
   # Ouvrez test-messages-api.html dans votre navigateur
   open test-messages-api.html
   ```

3. **Testez l'interface admin** :
   - Connectez-vous en tant qu'admin
   - Accédez à `/admin/messages`
   - Vérifiez les statistiques et la liste des messages

## 📋 Structure de la base de données

### Table `contact_messages`
```sql
- id (UUID, PK)
- user_email (TEXT, NOT NULL)
- user_id (UUID, FK vers auth.users)
- subject (TEXT, NOT NULL)
- message (TEXT, NOT NULL)
- status (TEXT, CHECK: unread|read|replied|archived)
- priority (TEXT, CHECK: low|normal|high|urgent)
- admin_notes (TEXT)
- replied_at (TIMESTAMP)
- replied_by (UUID, FK vers auth.users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Fonctions SQL
- `create_contact_message(email, subject, message)` - Créer un message avec validation
- `mark_message_as_read(message_id)` - Marquer comme lu
- `get_messages_stats()` - Obtenir les statistiques

### Politiques RLS
- **Admin** : Accès complet à tous les messages
- **Utilisateurs** : Peuvent voir leurs propres messages
- **Insertion** : Validée par email existant dans auth.users

## 🎨 Interface utilisateur

### Formulaire de contact (`/contact`)
- Champs : Email, Sujet, Message
- Validation en temps réel
- Messages d'erreur clairs
- Conditions d'envoi affichées

### Interface admin (`/admin/messages`)
- Tableau de bord avec statistiques
- Liste des messages avec filtres
- Recherche textuelle
- Actions : Marquer lu/répondu/archivé
- Modal de détail des messages

## 🔧 Configuration

### Variables d'environnement requises
```env
NEXT_PUBLIC_SUPABASE_URL=https://gfhofqjqpbwhewyqsgjq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Utilisateur admin
- **UUID** : `e7bc4c23-a9c8-4551-b212-b6a540af21ed`
- **Email** : `j@gmail.com`
- **Mot de passe** : `123456789`

## 🧪 Tests

### Tests manuels
1. **Test formulaire valide** :
   ```
   Email: j@gmail.com
   Sujet: Test du système
   Message: Ceci est un test
   Résultat attendu: ✅ Message créé
   ```

2. **Test email invalide** :
   ```
   Email: inexistant@example.com
   Sujet: Test invalide
   Message: Ce message ne devrait pas passer
   Résultat attendu: ❌ Erreur "Email non trouvé"
   ```

3. **Test interface admin** :
   - Connexion admin
   - Accès `/admin/messages`
   - Vérification des statistiques
   - Test des filtres et recherche

### Scripts de test
```bash
# Test complet du système
node scripts/test-messages-system.js

# Test via interface HTML
open test-messages-api.html
```

## 🔒 Sécurité

### Validation des données
- ✅ Format email vérifié
- ✅ Champs requis validés
- ✅ Email doit exister dans auth.users
- ✅ Longueur des messages limitée

### Politiques RLS
- ✅ Seuls les admins voient tous les messages
- ✅ Utilisateurs voient leurs propres messages
- ✅ Insertion validée par email existant
- ✅ Mise à jour réservée aux admins

### Protection API
- ✅ Validation côté serveur
- ✅ Gestion des erreurs
- ✅ Logs des erreurs
- ✅ Rate limiting (via Supabase)

## 📊 Utilisation

### Pour les utilisateurs
1. Créer un compte utilisateur
2. Aller sur `/contact`
3. Remplir le formulaire avec l'email du compte
4. Envoyer le message

### Pour les admins
1. Se connecter en tant qu'admin
2. Aller sur `/admin/messages`
3. Consulter les messages et statistiques
4. Gérer les statuts et réponses

## 🚨 Dépannage

### Erreurs communes

**"Email non trouvé"**
- Vérifiez que l'utilisateur existe dans auth.users
- Utilisez l'email exact du compte

**"Invalid API key"**
- Vérifiez les variables d'environnement
- Utilisez la bonne clé service_role

**"Table does not exist"**
- Exécutez le script SQL de création
- Vérifiez les permissions Supabase

**Interface admin inaccessible**
- Vérifiez que l'utilisateur est admin
- Contrôlez l'UUID dans les politiques RLS

### Logs utiles
```bash
# Logs Next.js
npm run dev

# Logs Supabase
# Consultez l'interface Supabase > Logs
```

## 📈 Évolutions futures

### Fonctionnalités à ajouter
- [ ] Notifications email automatiques
- [ ] Réponses directes depuis l'interface
- [ ] Catégories de messages
- [ ] Pièces jointes
- [ ] Historique des conversations
- [ ] Templates de réponse

### Améliorations techniques
- [ ] Tests automatisés
- [ ] Pagination côté serveur
- [ ] Cache des statistiques
- [ ] Optimisation des requêtes
- [ ] Monitoring avancé

## 🎉 Conclusion

Le système de messages de contact est maintenant opérationnel avec :
- ✅ Validation stricte par email utilisateur
- ✅ Interface admin complète
- ✅ Sécurité RLS
- ✅ API REST complète
- ✅ Tests et documentation

**Prochaines étapes :**
1. Exécutez le script SQL dans Supabase
2. Testez le formulaire de contact
3. Vérifiez l'interface admin
4. Personnalisez selon vos besoins

---

*Système créé le 2024 - Prêt pour la production* 🚀 