-- ======================================================================
-- SYSTÈME DE MESSAGES DE CONTACT - SCRIPT FINAL
-- ======================================================================
-- À exécuter dans l'interface Supabase SQL Editor
-- ======================================================================

-- 1. Créer la table des messages de contact
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

-- 2. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(user_email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);

-- 3. Activer Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques RLS
-- Politique : Admin peut tout faire
CREATE POLICY "admin_full_access" ON public.contact_messages
FOR ALL USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- Politique : Utilisateurs peuvent voir leurs propres messages
CREATE POLICY "users_view_own_messages" ON public.contact_messages
FOR SELECT USING (user_email = (
  SELECT email FROM auth.users WHERE id = auth.uid()
));

-- Politique : Insertion seulement avec email valide
CREATE POLICY "insert_valid_email_only" ON public.contact_messages
FOR INSERT WITH CHECK (
  user_email IN (SELECT email FROM auth.users)
);

-- 5. Créer la fonction pour créer un message avec validation
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
  -- Vérifier que l'email appartient à un utilisateur existant
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email non trouvé. Vous devez avoir un compte pour envoyer un message.'
    );
  END IF;
  
  -- Créer le message
  INSERT INTO public.contact_messages (user_email, user_id, subject, message)
  VALUES (p_email, v_user_id, p_subject, p_message)
  RETURNING id INTO v_message_id;
  
  RETURN json_build_object(
    'success', true,
    'message_id', v_message_id,
    'message', 'Message envoyé avec succès!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer la fonction pour les statistiques
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

-- 7. Créer la fonction pour marquer comme lu
CREATE OR REPLACE FUNCTION public.mark_message_as_read(p_message_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.contact_messages 
  SET status = 'read', updated_at = NOW()
  WHERE id = p_message_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer la fonction update_updated_at_column (si elle n'existe pas)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Créer le trigger pour updated_at
CREATE TRIGGER update_contact_messages_updated_at 
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Accorder les permissions
GRANT ALL ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO anon;
GRANT EXECUTE ON FUNCTION public.create_contact_message(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_contact_message(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_messages_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_message_as_read(UUID) TO authenticated;

-- 11. Insérer des données de test
INSERT INTO public.contact_messages (user_email, user_id, subject, message, status, priority)
VALUES 
  ('j@gmail.com', 'e7bc4c23-a9c8-4551-b212-b6a540af21ed', 'Test du système', 'Ceci est un message de test pour vérifier le système.', 'unread', 'normal'),
  ('j@gmail.com', 'e7bc4c23-a9c8-4551-b212-b6a540af21ed', 'Question urgente', 'J''ai besoin d''aide rapidement.', 'unread', 'high')
ON CONFLICT DO NOTHING;

-- 12. Vérification finale
SELECT 'Table créée avec succès!' as message;
SELECT COUNT(*) as total_messages FROM public.contact_messages;
SELECT public.get_messages_stats() as statistiques;

-- ======================================================================
-- INSTRUCTIONS D'UTILISATION :
-- ======================================================================
-- 1. Copiez tout ce script
-- 2. Allez sur https://supabase.com/dashboard
-- 3. Sélectionnez votre projet
-- 4. Allez dans "SQL Editor" 
-- 5. Collez le script et cliquez "Run"
-- 6. Vérifiez que tout s'exécute sans erreur
-- 7. Testez l'application sur http://localhost:3001
-- ====================================================================== 