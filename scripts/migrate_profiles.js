const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateProfiles() {
  console.log('🚀 Début de la migration des profils...\n');

  try {
    // Lire le script SQL
    const sqlPath = path.join(__dirname, '..', 'db', 'add_profile_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Exécuter le script SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si la fonction exec_sql n'existe pas, essayer une approche alternative
      console.log('⚠️  La fonction exec_sql n\'existe pas, exécution directe...');
      
      // Pour Supabase, vous devrez exécuter ce script via l'interface web ou la CLI
      console.log('\n📋 Veuillez exécuter le script SQL suivant dans l\'éditeur SQL de Supabase:');
      console.log('   Fichier: db/add_profile_fields.sql\n');
      console.log('Ou utilisez la commande:');
      console.log('   supabase db push --db-url <YOUR_DATABASE_URL>\n');
      
      return;
    }

    console.log('✅ Migration réussie!');
    console.log('   - Colonnes ajoutées: first_name, last_name, phone, birth_date');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

// Message d'instructions
console.log('=== Migration de la table profiles ===\n');
console.log('Cette migration ajoute les champs suivants à la table profiles:');
console.log('- first_name (TEXT)');
console.log('- last_name (TEXT)');
console.log('- phone (TEXT)');
console.log('- birth_date (DATE)\n');

migrateProfiles(); 