# 📦 Guide de Gestion des Marques - Admin

## Vue d'ensemble

Le système de gestion des marques permet aux administrateurs de créer, modifier et supprimer les marques et leurs gammes de produits associées. **Nouveauté** : La gestion des gammes est maintenant intégrée directement dans la page marques avec une interface expandable.

## Structure de la base de données

### Table `brands`
```sql
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);
```

### Table `ranges`
```sql
CREATE TABLE public.ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  UNIQUE (brand_id, slug)
);
```

## Fonctionnalités

### 🏷️ Page Marques (`/admin/marques`)

#### Affichage hiérarchique
- **Liste des marques** avec boutons d'expansion/réduction
- **Gammes intégrées** : Cliquer sur le chevron pour voir les gammes d'une marque
- **Interface à deux niveaux** : Marques (niveau principal) → Gammes (niveau secondaire)
- **Recherche globale** par nom ou slug de marque
- **Statistiques en temps réel** : Total marques, total gammes, marques actives

#### Actions disponibles

##### Pour les marques :
- ➕ **Créer une marque** : Nom + slug généré automatiquement
- ✏️ **Modifier une marque** : Édition du nom et slug
- 🗑️ **Supprimer une marque** : Avec vérifications de sécurité
- 🔽 **Expandre/Réduire** : Voir les gammes associées

##### Pour les gammes :
- ➕ **Ajouter une gamme** : Depuis une marque spécifique (bouton vert +)
- ✏️ **Modifier une gamme** : Édition du nom, slug et marque
- 🗑️ **Supprimer une gamme** : Avec vérifications de sécurité
- 🏷️ **Badge visuel** : Identification claire des gammes

#### Interface utilisateur

##### Navigation hiérarchique
```
📁 Avène (3 gammes) [+ Ajouter gamme] [✏️ Modifier] [🗑️ Supprimer]
  └── 📦 Hydrance [✏️] [🗑️]
  └── 📦 Cicalfate [✏️] [🗑️]  
  └── 📦 Antirougeurs [✏️] [🗑️]

📁 ISDIN (2 gammes) [+ Ajouter gamme] [✏️ Modifier] [🗑️ Supprimer]
  └── 📦 Fotoprotetor [✏️] [🗑️]
  └── 📦 Acniben [✏️] [🗑️]
```

##### Couleurs et indicateurs
- **Marques** : Fond blanc, texte noir, chevrons pour expansion
- **Gammes** : Fond gris clair, indentation, icône Squares2X2Icon
- **Badges** : "Gamme" en bleu pour identification visuelle
- **Actions** : Boutons colorés (vert pour ajouter, bleu pour modifier, rouge pour supprimer)

### 🔧 API Endpoints

#### Marques
- `GET /api/admin/brands` - Liste des marques avec gammes
- `POST /api/admin/brands` - Créer une marque
- `PATCH /api/admin/brands/[id]` - Modifier une marque
- `DELETE /api/admin/brands/[id]` - Supprimer une marque

#### Gammes
- `GET /api/admin/ranges` - Liste des gammes
- `GET /api/admin/ranges?brand_id=[id]` - Gammes d'une marque
- `POST /api/admin/ranges` - Créer une gamme
- `PATCH /api/admin/ranges/[id]` - Modifier une gamme
- `DELETE /api/admin/ranges/[id]` - Supprimer une gamme

## Workflows utilisateur

### Créer une nouvelle marque avec gammes

1. **Créer la marque**
   - Cliquer sur "Ajouter une marque"
   - Saisir le nom (slug généré automatiquement)
   - Valider

2. **Ajouter des gammes**
   - Cliquer sur le chevron pour expandre la marque
   - Cliquer sur le bouton vert "+" à côté du nombre de gammes
   - Saisir nom et slug de la gamme
   - La marque est pré-sélectionnée
   - Valider

### Gérer les gammes existantes

1. **Voir les gammes**
   - Cliquer sur le chevron à côté du nom de marque
   - Les gammes s'affichent en dessous avec indentation

2. **Modifier une gamme**
   - Expandre la marque
   - Cliquer sur l'icône crayon de la gamme
   - Modifier les informations
   - Valider

3. **Supprimer une gamme**
   - Expandre la marque
   - Cliquer sur l'icône poubelle de la gamme
   - Confirmer la suppression

## Règles de validation

### Marques
- **Nom** : Requis, unique
- **Slug** : Requis, unique, généré automatiquement depuis le nom
- **Format slug** : minuscules, sans accents, tirets pour les espaces

### Gammes
- **Nom** : Requis
- **Slug** : Requis, unique par marque
- **Marque** : Requis, doit exister
- **Contrainte unique** : (brand_id, slug) pour éviter les doublons par marque

## Contraintes de suppression

### Suppression d'une marque
❌ **Impossible si** :
- La marque contient des gammes
- Des produits sont associés via les gammes

✅ **Processus recommandé** :
1. Expandre la marque pour voir ses gammes
2. Supprimer toutes les gammes une par une
3. Supprimer la marque

### Suppression d'une gamme
❌ **Impossible si** :
- Des produits sont associés à cette gamme

✅ **Processus recommandé** :
1. Vérifier qu'aucun produit n'utilise cette gamme
2. Supprimer la gamme directement

## Sécurité

### Politiques RLS
```sql
-- Lecture publique (catalogue)
CREATE POLICY "Public read brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Public read ranges" ON public.ranges
  FOR SELECT USING (true);

-- Gestion admin uniquement
CREATE POLICY "Admin manage brands" 
ON public.brands FOR ALL 
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admin manage ranges" 
ON public.ranges FOR ALL 
USING (public.is_user_admin(auth.uid()));
```

### Permissions requises
- **Lecture** : Accessible à tous (catalogue public)
- **Création/Modification/Suppression** : Administrateurs uniquement

## Interface utilisateur avancée

### États d'expansion
- **Fermé** : Chevron droit (→), gammes masquées
- **Ouvert** : Chevron bas (↓), gammes visibles
- **Persistance** : L'état d'expansion est maintenu pendant la session

### Composants visuels
- **Icônes distinctives** :
  - TagIcon pour les marques dans les stats
  - Squares2X2Icon pour les gammes
  - ChevronRightIcon/ChevronDownIcon pour l'expansion
- **Couleurs cohérentes** :
  - Bleu : Actions principales (modification)
  - Vert : Ajout de gammes
  - Rouge : Suppressions
  - Gris : Éléments secondaires

### Responsive design
- **Mobile** : Interface adaptée avec boutons tactiles
- **Desktop** : Hover effects et tooltips
- **Accessibilité** : Tooltips explicites pour toutes les actions

## Intégration avec les produits

### Liaison produit-marque-gamme
```sql
-- Relation complète
product → product_ranges → ranges → brands
```

### Utilisation dans les produits
- **Sélection hiérarchique** : Marque → Gamme lors de la création produit
- **Filtrage automatique** : Les gammes se filtrent selon la marque sélectionnée
- **Organisation du storage** : Images organisées par dossier de marque
- **Breadcrumb produit** : Marque > Gamme > Produit

## Exemples d'utilisation

### Créer une marque avec gamme via API
```javascript
// 1. Créer la marque
const brandResponse = await fetch('/api/admin/brands', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Avène',
    slug: 'avene'
  })
});

const brand = await brandResponse.json();

// 2. Créer une gamme pour cette marque
const rangeResponse = await fetch('/api/admin/ranges', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Hydrance',
    slug: 'hydrance',
    brand_id: brand.id
  })
});
```

### Interface utilisateur - Workflow complet
```javascript
// Expandre une marque pour voir ses gammes
const toggleBrandExpansion = (brandId) => {
  const newExpanded = new Set(expandedBrands);
  if (newExpanded.has(brandId)) {
    newExpanded.delete(brandId);
  } else {
    newExpanded.add(brandId);
  }
  setExpandedBrands(newExpanded);
};

// Ajouter une gamme à une marque spécifique
const openRangeModal = (range, brandId) => {
  setRangeFormData({
    name: '',
    slug: '',
    brand_id: brandId || ''
  });
  setSelectedBrandForRange(brandId);
  setShowRangeModal(true);
};
```

## Maintenance et monitoring

### Scripts SQL disponibles
- `db/brands_admin_policies.sql` - Politiques RLS pour marques et gammes
- `db/populate_catalog.sql` - Données d'exemple avec hiérarchie complète

### Métriques à surveiller
- **Nombre de marques sans gammes** : Marques orphelines
- **Nombre de gammes sans produits** : Gammes inutilisées
- **Tentatives de suppression bloquées** : Contraintes d'intégrité

### Requêtes utiles
```sql
-- Marques sans gammes
SELECT b.* FROM brands b 
LEFT JOIN ranges r ON b.id = r.brand_id 
WHERE r.id IS NULL;

-- Gammes sans produits
SELECT r.* FROM ranges r 
LEFT JOIN product_ranges pr ON r.id = pr.range_id 
WHERE pr.range_id IS NULL;

-- Statistiques par marque
SELECT 
  b.name as marque,
  COUNT(r.id) as nb_gammes,
  COUNT(pr.product_id) as nb_produits
FROM brands b
LEFT JOIN ranges r ON b.id = r.brand_id
LEFT JOIN product_ranges pr ON r.id = pr.range_id
GROUP BY b.id, b.name
ORDER BY nb_produits DESC;
```

## Dépannage

### Erreurs courantes

#### "Une marque avec ce nom ou ce slug existe déjà"
- **Cause** : Violation de contrainte d'unicité
- **Solution** : Modifier légèrement le nom ou slug

#### "Une gamme avec ce slug existe déjà pour cette marque"
- **Cause** : Violation de contrainte unique (brand_id, slug)
- **Solution** : Changer le slug de la gamme pour cette marque

#### "Impossible de supprimer cette marque car elle contient des gammes"
- **Cause** : Contrainte d'intégrité référentielle
- **Solution** : 
  1. Expandre la marque dans l'interface
  2. Supprimer toutes les gammes visibles
  3. Réessayer la suppression de la marque

#### "L'état d'expansion ne se maintient pas"
- **Cause** : Rechargement de page ou navigation
- **Solution** : Comportement normal, l'état est réinitialisé à chaque chargement

### Interface qui ne répond pas
```javascript
// Vérifier l'état des données
console.log('Brands:', brands);
console.log('Expanded brands:', expandedBrands);
console.log('Loading state:', loading);

// Forcer un rechargement des données
fetchBrands();
fetchRanges();
```

## Roadmap

### Fonctionnalités futures
- [ ] **Drag & drop** : Réorganiser les gammes par glisser-déposer
- [ ] **Recherche dans les gammes** : Filtrage par nom de gamme
- [ ] **Expansion automatique** : Ouvrir automatiquement les marques avec résultats de recherche
- [ ] **Logos de marques** : Upload et affichage d'images
- [ ] **Descriptions** : Champs de description pour marques et gammes
- [ ] **Import/Export** : Gestion en masse avec fichiers CSV
- [ ] **Historique** : Suivi des modifications avec timestamps
- [ ] **Prévisualisation** : Voir les produits associés sans quitter la page
- [ ] **Statistiques avancées** : Graphiques de répartition des produits

### Améliorations UX prévues
- [ ] **Animations** : Transitions fluides pour l'expansion/réduction
- [ ] **Raccourcis clavier** : Navigation rapide au clavier
- [ ] **Filtres avancés** : Par nombre de gammes, date de création, etc.
- [ ] **Vue en cartes** : Alternative à la vue tableau
- [ ] **Mode sombre** : Thème sombre pour l'interface

---

**📝 Note** : Ce système est intégré au système global de gestion des produits. La gestion hiérarchique marques → gammes améliore significativement l'expérience utilisateur en permettant une vue d'ensemble et des actions contextuelles. Consultez `GUIDE_ADMIN_PRODUCTS.md` pour plus de détails sur l'écosystème complet. 