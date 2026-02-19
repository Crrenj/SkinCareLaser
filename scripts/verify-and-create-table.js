#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9manFxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NjY2NzksImV4cCI6MjA0ODE0MjY3OX0.QLXVfnhsWXYOVRXpbKHPqNSGdHYKYOBOJRKPcTCVmqs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyTable() {
  console.log('🔍 Vérification de la table contact_messages...')
  
  try {
    // Essayer de récupérer un enregistrement de la table
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('❌ Table contact_messages non trouvée')
        console.log('\n📋 Vous devez exécuter le script SQL dans Supabase :')
        console.log('1. Allez sur https://supabase.com/dashboard')
        console.log('2. Sélectionnez votre projet')
        console.log('3. Allez dans "SQL Editor"')
        console.log('4. Copiez le contenu du fichier SQL_POUR_SUPABASE.sql')
        console.log('5. Collez et exécutez le script')
        console.log('\n📄 Contenu du script à exécuter :')
        console.log('='.repeat(50))
        
        // Afficher le contenu du script SQL
        const sqlScript = `
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

-- Créer les index
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

-- Fonction de création de message
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

-- Fonction statistiques
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
        `
        
        console.log(sqlScript)
        console.log('='.repeat(50))
        return false
      } else {
        console.log('❌ Erreur lors de la vérification:', error.message)
        return false
      }
    }
    
    console.log('✅ Table contact_messages existe et est accessible')
    console.log(`📊 Nombre de messages: ${data?.length || 0}`)
    
    // Tester la fonction de statistiques
    const { data: stats, error: statsError } = await supabase.rpc('get_messages_stats')
    if (statsError) {
      console.log('⚠️ Fonction get_messages_stats non trouvée:', statsError.message)
    } else {
      console.log('✅ Statistiques:', stats)
    }
    
    // Tester la fonction de création
    const { data: createTest, error: createError } = await supabase.rpc('create_contact_message', {
      p_email: 'test@example.com',
      p_subject: 'Test',
      p_message: 'Test message'
    })
    
    if (createError) {
      console.log('⚠️ Fonction create_contact_message:', createError.message)
    } else {
      console.log('✅ Fonction create_contact_message:', createTest)
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
    return false
  }
}

// Fonction pour tester l'API
async function testAPI() {
  console.log('\n🧪 Test de l\'API...')
  
  try {
    // Tester l'API de contact
    const response = await fetch('http://localhost:3001/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'j@gmail.com',
        subject: 'Test API',
        message: 'Test du système de messages'
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ API de contact fonctionne:', result)
    } else {
      console.log('❌ Erreur API de contact:', result)
    }
    
  } catch (error) {
    console.log('❌ Erreur test API:', error.message)
    console.log('💡 Assurez-vous que l\'application est démarrée avec "npm run dev"')
  }
}

// Exécuter les vérifications
async function main() {
  console.log('🚀 Vérification du système de messages...\n')
  
  const tableExists = await verifyTable()
  
  if (tableExists) {
    await testAPI()
    console.log('\n🎉 Système de messages prêt à utiliser!')
    console.log('📝 Vous pouvez maintenant :')
    console.log('- Tester le formulaire sur http://localhost:3001/contact')
    console.log('- Accéder à l\'admin sur http://localhost:3001/admin/messages')
  } else {
    console.log('\n⚠️ Veuillez d\'abord créer la table en exécutant le script SQL dans Supabase')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { verifyTable, testAPI } 