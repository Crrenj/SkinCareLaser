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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Créer un compte admin
 */
async function createAdminUser() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.log('Usage: node scripts/create-admin-user.js <email> <password>')
    console.log('Exemple: node scripts/create-admin-user.js admin@example.com MonMotDePasse123!')
    process.exit(1)
  }

  try {
    console.log(`🔄 Création du compte admin pour ${email}...`)

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirmer l'email
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  L\'utilisateur existe déjà, récupération...')
        
        // Récupérer l'utilisateur existant
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const existingUser = users.find(u => u.email === email)
        if (!existingUser) throw new Error('Utilisateur introuvable')
        
        console.log(`✅ Utilisateur trouvé: ${existingUser.id}`)
        
        // Mettre à jour le profil
        await makeUserAdmin(existingUser.id, email)
      } else {
        throw authError
      }
    } else if (authData.user) {
      console.log(`✅ Utilisateur créé: ${authData.user.id}`)
      
      // 2. Rendre l'utilisateur admin
      await makeUserAdmin(authData.user.id, email)
    }

    console.log('\n✅ Compte admin créé avec succès!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Mot de passe: ${password}`)
    console.log('\n🚀 Vous pouvez maintenant vous connecter sur /login')

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

/**
 * Rendre un utilisateur admin
 */
async function makeUserAdmin(userId, email) {
  // Mettre à jour le profil
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      role: 'admin',
      display_name: 'Admin Principal'
    })

  if (profileError) throw profileError

  // Ajouter dans admin_users
  const { error: adminError } = await supabase
    .from('admin_users')
    .upsert({ user_id: userId })

  if (adminError && !adminError.message.includes('duplicate')) {
    throw adminError
  }

  console.log(`✅ Profil admin configuré pour ${email}`)
}

// Exécuter le script
createAdminUser() 