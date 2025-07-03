# Guide Storage Admin - Supabase

## Variables d'environnement requises
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Pour route API uniquement
```

## Option 1: Route API (Recommandé)

### Avantages
- ✅ Pas besoin de configurer les policies
- ✅ Contrôle total côté serveur
- ✅ Plus sécurisé

### Fichiers créés
- `/api/admin/upload/route.ts` - Route API pour upload/delete
- `/components/admin/ImageUpload.tsx` - Composant upload

### Utilisation dans la page admin
```tsx
import ImageUpload from '@/components/admin/ImageUpload'

// Dans le formulaire
<ImageUpload
  productSlug={formData.slug}
  currentImageUrl={product?.image_url}
  onUploadComplete={(url) => {
    // Sauvegarder l'URL dans la BD
    setFormData(prev => ({ ...prev, image_url: url }))
  }}
/>
```

## Option 2: Policies Dashboard

### Configuration Dashboard
1. https://supabase.com/dashboard > Storage > Policies
2. Créer 4 policies selon `db/storage_policies_dashboard.md`

### Fichiers créés
- `/components/admin/DirectImageUpload.tsx` - Upload direct client

### Avantages
- ✅ Upload direct depuis le navigateur
- ✅ Moins de charge serveur

### Inconvénients
- ❌ Nécessite configuration manuelle des policies
- ❌ Erreur 42501 si tenté via SQL

## Checklist de validation

### 1. Test lecture publique
```bash
curl https://xxx.supabase.co/storage/v1/object/public/product-image/test.png
# Devrait retourner l'image ou 404 si n'existe pas
```

### 2. Test admin
- Se connecter avec compte `is_admin = true`
- Uploader une image via le composant
- Vérifier dans Storage Dashboard

### 3. Test user normal  
- Se connecter avec compte `is_admin = false`
- Tenter d'uploader → Devrait être refusé

### 4. Script de test automatisé
```bash
node scripts/test-storage-access.js
```

## Dépannage

### Erreur "supabaseKey is required"
→ Vérifier `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`

### Erreur 403 sur upload
→ Vérifier `is_admin = true` dans table `profiles`

### Images non visibles
→ Vérifier que le bucket est bien `public = true`

## Migration des images existantes
```bash
node scripts/migrate-product-images.js
``` 