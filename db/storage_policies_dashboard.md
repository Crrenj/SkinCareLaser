# Configuration des Policies Storage via Dashboard

## Accès Dashboard
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Naviguer vers Storage > Policies

## Créer les 4 policies suivantes :

### 1. PUBLIC READ (Lecture publique)
**Name**: `Public Read Access`
**Target roles**: `anon, authenticated`
**Operations**: `SELECT`
**Policy definition**:
```sql
(bucket_id = 'product-image')
```

### 2. ADMIN INSERT (Upload admin)
**Name**: `Admin Upload`
**Target roles**: `authenticated`
**Operations**: `INSERT`
**Policy definition**:
```sql
(
  bucket_id = 'product-image' 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
```

### 3. ADMIN UPDATE (Modification admin)
**Name**: `Admin Update`
**Target roles**: `authenticated`
**Operations**: `UPDATE`
**Policy definition**:
```sql
(
  bucket_id = 'product-image'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
```

### 4. ADMIN DELETE (Suppression admin)
**Name**: `Admin Delete`
**Target roles**: `authenticated`
**Operations**: `DELETE`
**Policy definition**:
```sql
(
  bucket_id = 'product-image'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
```

## Test des policies
1. Se connecter avec un compte admin
2. Tester l'upload via le composant
3. Se connecter avec un compte normal
4. Vérifier que l'upload est refusé 