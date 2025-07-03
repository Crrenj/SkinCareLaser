import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeExistingUserAdmin() {
  const email = process.argv[2] || 'j@gmail.com'
  
  try {
    console.log(`🔄 Recherche de l'utilisateur ${email}...`)
    
    // 1. Récupérer l'utilisateur
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError
    
    const user = users.find(u => u.email === email)
    if (!user) {
      throw new Error(`Utilisateur ${email} non trouvé`)
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.id}`)
    
    // 2. Mettre à jour le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        is_admin: true,
        role: 'admin',
        display_name: 'Admin Principal'
      })
    
    if (profileError) throw profileError
    console.log('✅ Profil mis à jour')
    
    // 3. Ajouter dans admin_users
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({ user_id: user.id })
    
    if (adminError && !adminError.message.includes('duplicate')) {
      throw adminError
    }
    console.log('✅ Ajouté dans admin_users')
    
    console.log('\n✅ Compte admin configuré avec succès!')
    console.log(`📧 Email: ${email}`)
    console.log('🚀 Vous pouvez maintenant vous connecter sur /login')
    console.log('\n⚠️  Si vous avez oublié votre mot de passe, utilisez "Mot de passe oublié" sur la page de connexion')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

makeExistingUserAdmin() 