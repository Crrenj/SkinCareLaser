import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetPassword() {
  const email = process.argv[2]
  const newPassword = process.argv[3]

  if (!email || !newPassword) {
    console.log('Usage: node scripts/reset-password.js <email> <nouveau-mot-de-passe>')
    console.log('Exemple: node scripts/reset-password.js j@gmail.com NouveauMotDePasse123!')
    process.exit(1)
  }

  try {
    console.log(`🔄 Réinitialisation du mot de passe pour ${email}...`)
    
    // Récupérer l'utilisateur
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError
    
    const user = users.find(u => u.email === email)
    if (!user) {
      throw new Error(`Utilisateur ${email} non trouvé`)
    }
    
    // Réinitialiser le mot de passe
    const { error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )
    
    if (error) throw error
    
    console.log('\n✅ Mot de passe réinitialisé avec succès!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Nouveau mot de passe: ${newPassword}`)
    console.log('\n🚀 Vous pouvez maintenant vous connecter sur /login')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

resetPassword() 