# Guide de Migration - Structure des Tags

## Vue d'ensemble

Cette migration permet d'avoir des types de tags dynamiques au lieu des 4 types fixes actuels (category, need, skin_type, ingredient).

## Étapes de migration

### 1. Exécuter le script SQL de migration

Connectez-vous à votre base de données Supabase et exécutez le script SQL suivant :

```bash
# Depuis le terminal dans le dossier du projet
psql -h [VOTRE_HOST_SUPABASE] -U postgres -d postgres -f db/modify_tags_structure.sql
```

Ou directement dans l'éditeur SQL de Supabase :
1. Allez dans l'éditeur SQL de Supabase
2. Copiez le contenu de `db/modify_tags_structure.sql`
3. Exécutez le script

### 2. Vérifier la migration

Après l'exécution, vérifiez que :
- La table `tag_types` a été créée avec les 4 types par défaut
- Les tags existants ont été migrés avec les bonnes références `tag_type_id`
- Les policies RLS sont en place

### 3. Tester l'interface

1. Démarrez le serveur de développement : `npm run dev`
2. Connectez-vous en tant qu'admin
3. Allez dans `/admin/tags`
4. Vérifiez que vous pouvez :
   - Voir les 4 types de tags existants
   - Créer un nouveau type de tag
   - Ajouter des tags dans chaque type
   - Modifier/supprimer des types (seulement s'ils sont vides)

## Nouvelles fonctionnalités

### Pour les administrateurs :
- **Créer des types de tags personnalisés** : Par exemple "Texture", "Moment d'utilisation", etc.
- **Personnaliser l'apparence** : Choisir une icône et une couleur pour chaque type
- **Organiser les tags** : Grouper les tags par catégories logiques

### Structure de données :

#### Table `tag_types` :
- `id` : UUID unique
- `name` : Nom en anglais
- `name_fr` : Nom en français
- `slug` : Identifiant URL
- `icon` : Nom de l'icône (optionnel)
- `color` : Couleur hexadécimale
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

#### Table `tags` (modifiée) :
- `id` : UUID unique
- `name` : Nom du tag
- `slug` : Identifiant URL
- `tag_type_id` : Référence vers `tag_types`
- `tag_type` : Ancien champ (gardé pour compatibilité)

## Rollback (si nécessaire)

Si vous devez revenir en arrière :

```sql
-- Supprimer les nouvelles structures
DROP VIEW IF EXISTS public.tags_with_types;
DROP TABLE IF EXISTS public.tag_types CASCADE;

-- Restaurer la contrainte sur tag_type
ALTER TABLE public.tags 
  ADD CONSTRAINT tags_tag_type_check 
  CHECK (tag_type IN ('category','need','skin_type','ingredient'));

-- Recréer l'index original
CREATE UNIQUE INDEX IF NOT EXISTS tags_type_slug_idx ON public.tags(tag_type, slug);
```

## Notes importantes

1. **Compatibilité** : L'ancienne colonne `tag_type` est conservée pour compatibilité
2. **Migration progressive** : Les deux structures peuvent coexister pendant la transition
3. **Permissions** : Seuls les admins peuvent gérer les types de tags
4. **Validation** : Un type de tag ne peut être supprimé que s'il ne contient aucun tag 