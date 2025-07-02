# Guide : Résolution du problème "Email address is invalid" avec Supabase

## Problème

L'erreur "Email address is invalid" peut survenir lors de l'inscription avec certaines adresses email, même si elles semblent valides (comme test@gmail.com).

## Causes possibles

### 1. Configuration de Supabase Auth
Supabase peut bloquer certains types d'emails :
- Emails de test courants (test@, demo@, example@)
- Domaines d'emails temporaires
- Emails sans confirmation activée

### 2. Restrictions du projet Supabase
Votre projet Supabase peut avoir des restrictions spécifiques :
- Liste blanche de domaines email
- Validation stricte des formats
- Blocage des inscriptions multiples

## Solutions

### Solution 1 : Utiliser un email réel
- Utilisez une vraie adresse email personnelle
- Évitez les emails génériques comme test@gmail.com
- Utilisez des services comme Gmail, Outlook, etc.

### Solution 2 : Configurer Supabase Auth
1. Connectez-vous à votre dashboard Supabase
2. Allez dans Authentication > Settings
3. Vérifiez les paramètres suivants :
   - **Email Confirmations** : Désactivez temporairement si nécessaire
   - **Allowed Email Domains** : Vérifiez qu'il n'y a pas de restrictions
   - **Rate Limits** : Assurez-vous de ne pas avoir atteint les limites

### Solution 3 : Modifier les paramètres Auth
Dans le dashboard Supabase :
```sql
-- Vérifier les politiques d'authentification
SELECT * FROM auth.config;
```

### Solution 4 : Pour le développement local
Ajoutez dans votre `.env.local` :
```env
# Désactiver la validation email stricte (dev uniquement)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Emails de test recommandés

Pour éviter les problèmes, utilisez :
- Votre email personnel réel
- Un email avec un domaine personnalisé
- Des variations comme : user1@gmail.com, user2@gmail.com

## Vérification dans le code

Le formulaire d'inscription gère maintenant mieux ces erreurs :
- Messages d'erreur plus clairs
- Gestion des emails temporaires
- Validation côté client améliorée

## Debug

Pour débugger le problème :
1. Vérifiez les logs Supabase dans Authentication > Logs
2. Testez avec différents formats d'email
3. Vérifiez la console du navigateur pour plus de détails

## Contact support

Si le problème persiste :
- Vérifiez la documentation Supabase Auth
- Contactez le support Supabase avec les détails de l'erreur
- Consultez les issues GitHub de Supabase 