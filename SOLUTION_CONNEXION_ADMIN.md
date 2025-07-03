# Solution : Problème de connexion admin

## Le problème
Le compte `j@gmail.com` mentionné dans `schema_complet.sql` n'existe pas réellement dans Supabase Auth. Le script SQL crée seulement l'entrée dans la table `profiles`, mais pas le compte d'authentification.

## Solution rapide : Créer un compte admin

### Option 1 : Script automatique (recommandé) ✅

```bash
# Créer le compte admin j@gmail.com avec votre mot de passe
node scripts/create-admin-user.js j@gmail.com VotreMotDePasse123!

# Ou créer un autre compte admin
node scripts/create-admin-user.js admin@example.com AutreMotDePasse456!
```

### Option 2 : Via Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Authentication > Users
4. Cliquer sur "Invite user"
5. Email : `j@gmail.com`
6. Envoyer l'invitation
7. Suivre le lien reçu par email

### Option 3 : S'inscrire normalement puis devenir admin

1. Aller sur `/signup`
2. Créer un compte avec n'importe quel email
3. Exécuter ce script SQL dans Supabase Dashboard :

```sql
-- Remplacer 'votre@email.com' par l'email utilisé
UPDATE public.profiles 
SET is_admin = true, role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'votre@email.com'
);

-- Ajouter dans admin_users
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'votre@email.com'
ON CONFLICT DO NOTHING;
```

## Vérification

Après avoir créé le compte admin, vous pouvez :
1. Aller sur `/login`
2. Entrer vos identifiants
3. Vous serez redirigé vers `/admin/overview`

## Dépannage

Si la connexion échoue encore :
- Vérifier que le serveur est lancé : `npm run dev`
- Essayer la page de debug : `/login-debug`
- Vérifier les logs dans la console du navigateur (F12)

**Résumé persistant** : Le compte j@gmail.com n'existe pas dans auth.users. Créé script create-admin-user.js pour créer facilement un compte admin. 