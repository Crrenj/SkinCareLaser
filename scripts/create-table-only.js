#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = 'https://gfhofqjqpbwhewyqsgjq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG9manFxcGJ3aGV3eXFzZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU2NjY3OSwiZXhwIjoyMDQ4MTQyNjc5fQ.JpgUGZXKNe6G6HWpZJzCPCXdGhTJLMJaXrHXzPFPFdk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTable() {
  console.log('🚀 Création de la table contact_messages...')
  
  try {
    // Créer la table directement
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      console.log('❌ Table non trouvée, création nécessaire via l\'interface Supabase')
      console.log('\n📋 SQL à exécuter dans Supabase SQL Editor:')
      console.log(`
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

-- Politique admin
CREATE POLICY "admin_full_access" ON public.contact_messages
FOR ALL USING (auth.uid() = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed'::uuid);

-- Politique utilisateurs
CREATE POLICY "users_own_messages" ON public.contact_messages
FOR SELECT USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Politique insertion
CREATE POLICY "insert_valid_email" ON public.contact_messages
FOR INSERT WITH CHECK (user_email IN (SELECT email FROM auth.users));

-- Permissions
GRANT ALL ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO anon;
      `)
      return
    }
    
    if (error) {
      console.error('❌ Erreur:', error.message)
      return
    }
    
    console.log('✅ Table contact_messages existe déjà')
    console.log('📊 Nombre de messages:', data?.length || 0)
    
    // Test d'insertion
    console.log('\n🧪 Test d\'insertion...')
    const { data: insertData, error: insertError } = await supabase
      .from('contact_messages')
      .insert([
        {
          user_email: 'j@gmail.com',
          user_id: 'e7bc4c23-a9c8-4551-b212-b6a540af21ed',
          subject: 'Test système',
          message: 'Test de création de message'
        }
      ])
      .select()
    
    if (insertError) {
      console.error('❌ Erreur insertion:', insertError.message)
    } else {
      console.log('✅ Message test créé:', insertData?.[0]?.id)
    }
    
    // Vérifier les messages existants
    console.log('\n📬 Messages existants:')
    const { data: messages, error: messagesError } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (messagesError) {
      console.error('❌ Erreur récupération:', messagesError.message)
    } else {
      console.log(`✅ ${messages.length} messages trouvés:`)
      messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.user_email} - "${msg.subject}" (${msg.status})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
  }
}

// Exécuter
createTable() 