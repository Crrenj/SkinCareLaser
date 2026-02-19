# 🚀 Instructions Rapides - Système de Messages

## ⚠️ Problème Identifié
L'erreur indique que la table `contact_messages` n'existe pas encore dans votre base de données Supabase.

## 🔧 Solution Immédiate

### 1. Exécuter le Script SQL dans Supabase

**Étapes :**
1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **"SQL Editor"** (dans le menu de gauche)
4. Cliquez sur **"New query"**
5. Copiez le contenu du fichier `SQL_POUR_SUPABASE.sql`
6. Collez dans l'éditeur SQL
7. Cliquez sur **"Run"**

### 2. Script SQL à Exécuter

```sql
-- Créer la table des messages de contact
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  admin_notes TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(user_email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);

-- Activer RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "admin_full_access" ON public.contact_messages
FOR ALL USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

CREATE POLICY "users_view_own_messages" ON public.contact_messages
FOR SELECT USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "insert_valid_email_only" ON public.contact_messages
FOR INSERT WITH CHECK (user_email IN (SELECT email FROM auth.users));

-- Fonction de création de message avec validation
CREATE OR REPLACE FUNCTION public.create_contact_message(
  p_email TEXT,
  p_subject TEXT,
  p_message TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_message_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email non trouvé. Vous devez avoir un compte pour envoyer un message.'
    );
  END IF;
  
  INSERT INTO public.contact_messages (user_email, user_id, subject, message)
  VALUES (p_email, v_user_id, p_subject, p_message)
  RETURNING id INTO v_message_id;
  
  RETURN json_build_object('success', true, 'message_id', v_message_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour les statistiques
CREATE OR REPLACE FUNCTION public.get_messages_stats()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'unread', COUNT(*) FILTER (WHERE status = 'unread'),
    'read', COUNT(*) FILTER (WHERE status = 'read'),
    'replied', COUNT(*) FILTER (WHERE status = 'replied'),
    'archived', COUNT(*) FILTER (WHERE status = 'archived'),
    'today', COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE),
    'this_week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')
  ) INTO v_stats
  FROM public.contact_messages;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT ALL ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO anon;
GRANT EXECUTE ON FUNCTION public.create_contact_message(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_contact_message(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_messages_stats() TO authenticated;

-- Données de test
INSERT INTO public.contact_messages (user_email, user_id, subject, message, status, priority)
VALUES 
  ('j@gmail.com', 'e7bc4c23-a9c8-4551-b212-b6a540af21ed', 'Test du système', 'Message de test', 'unread', 'normal')
ON CONFLICT DO NOTHING;
```

### 3. Vérification

Après avoir exécuté le script :

1. **Vérifiez la table** :
   - Dans Supabase, allez dans "Table Editor"
   - Vous devriez voir la table `contact_messages`

2. **Testez l'application** :
   ```bash
   npm run dev
   ```

3. **Testez les fonctionnalités** :
   - Formulaire de contact : http://localhost:3001/contact
   - Interface admin : http://localhost:3001/admin/messages

### 4. Tests Rapides

**Test formulaire de contact :**
- Email : `j@gmail.com` (doit fonctionner)
- Sujet : `Test du système`
- Message : `Ceci est un test`

**Test email invalide :**
- Email : `inexistant@example.com` (doit échouer)
- Doit afficher : "Email non trouvé"

## 🎯 Résultat Attendu

Après exécution du script SQL :
- ✅ Table `contact_messages` créée
- ✅ Politiques RLS activées
- ✅ Fonctions SQL opérationnelles
- ✅ Formulaire de contact fonctionnel
- ✅ Interface admin accessible
- ✅ Validation par email utilisateur active

## 🚨 Si Problème Persiste

1. **Vérifiez les variables d'environnement** dans `.env.local`
2. **Redémarrez l'application** : `npm run dev`
3. **Vérifiez la console** pour les erreurs
4. **Consultez les logs Supabase** dans le dashboard

## 📞 Points de Vérification

- [ ] Script SQL exécuté sans erreur
- [ ] Table `contact_messages` visible dans Supabase
- [ ] Application démarrée (`npm run dev`)
- [ ] Formulaire de contact accessible
- [ ] Interface admin `/admin/messages` fonctionne
- [ ] Test avec email valide réussi
- [ ] Test avec email invalide échoue correctement

---

**Une fois le script exécuté, votre système de messages sera entièrement opérationnel !** 🎉 