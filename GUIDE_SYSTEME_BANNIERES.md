# Guide du Système de Bannières FARMAU

## Vue d'ensemble

Le système de bannières FARMAU permet de gérer dynamiquement le contenu de la page d'accueil via une interface d'administration. Les bannières remplacent le contenu statique précédent et offrent une flexibilité totale pour les campagnes marketing.

## Architecture du Système

### 1. Base de Données

**Table `banners`** créée avec le script `db/create_banners_table.sql` :

```sql
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    link_text VARCHAR(100),
    banner_type VARCHAR(20) NOT NULL DEFAULT 'image_left' 
        CHECK (banner_type IN ('image_left', 'image_right', 'image_full')),
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    click_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Champs principaux :**
- `banner_type` : Type de mise en page (image_left, image_right, image_full)
- `position` : Ordre d'affichage sur la page d'accueil
- `is_active` : Contrôle la visibilité
- `start_date/end_date` : Planification des campagnes
- `click_count/view_count` : Statistiques d'engagement

### 2. Composant Banner

**Fichier :** `src/components/Banner.tsx`

Le composant Banner propose 3 styles de mise en page :

#### Style `image_left` (Image à gauche)
- Image à gauche, contenu à droite
- Responsive : empilage vertical sur mobile
- Fond blanc avec ombres
- **Taille recommandée :** 400x300 pixels (ratio 4:3)

#### Style `image_right` (Image à droite)
- Image à droite, contenu à gauche
- Même comportement responsive
- Fond blanc avec ombres
- **Taille recommandée :** 400x300 pixels (ratio 4:3)

#### Style `image_full` (Image pleine largeur)
- Image en arrière-plan avec overlay gradient
- Contenu superposé en blanc sur l'image
- Effet visuel plus impactant
- **Taille recommandée :** 1200x500 pixels (ratio 2.4:1)

#### Style `card_style` (Carte)
- Format carte vertical avec image en haut
- Contenu en bas dans une zone blanche
- Centré automatiquement, largeur maximale 400px
- **Taille recommandée :** 400x300 pixels (ratio 4:3)

#### Style `minimal` (Minimal)
- Design épuré avec petite image ronde (avatar)
- Bordure gauche colorée pour l'accent
- Fond gris clair, parfait pour les conseils
- **Taille recommandée :** 64x64 pixels (carré)

#### Style `gradient_overlay` (Gradient overlay)
- Image de fond avec gradient du bas vers le haut
- Contenu positionné en bas avec effet de transparence
- Bouton avec effet backdrop-blur
- **Taille recommandée :** 1200x400 pixels (ratio 3:1)

**Fonctionnalités :**
- Chargement progressif des images avec placeholder
- Boutons d'action avec icônes
- Responsive design
- Gestion des clics et vues (optionnel)

### 3. API de Gestion

**Endpoints :**

#### `GET /api/admin/banners`
- Récupère toutes les bannières ou seulement les actives
- Paramètre `?active=true` pour filtrer les bannières actives
- Tri automatique par position

#### `POST /api/admin/banners`
- Crée une nouvelle bannière
- Validation des données requises
- Attribution automatique de la position

#### `PUT /api/admin/banners`
- Met à jour une bannière existante
- Validation du type de bannière
- Mise à jour automatique du timestamp

#### `DELETE /api/admin/banners`
- Supprime une bannière par ID
- Paramètre `?id=uuid` requis

#### `POST /api/admin/banners/stats`
- Enregistre les statistiques (vues/clics)
- Body : `{ bannerId: string, type: 'view' | 'click' }`

### 4. Interface d'Administration

**Page :** `src/app/admin/annonce/page.tsx`

**Fonctionnalités principales :**

#### Tableau de bord
- Statistiques globales (total, actives, vues, clics)
- Aperçu en temps réel des bannières actives
- Mode prévisualisation

#### Gestion des bannières
- Liste avec miniatures et statuts
- Activation/désactivation en un clic
- Modification et suppression
- Indicateurs de type de bannière

#### Formulaire de création/édition
- Champs : titre, description, URL image, type, position, lien, dates
- Validation côté client et serveur
- Recommandations de taille d'image dynamiques selon le type
- Gestion des positions avec réorganisation automatique
- Prévisualisation du type sélectionné

## Pages Modifiées

### 1. Page d'Accueil (`src/app/page.tsx`)

**Avant :** Contenu statique avec sections fixes
**Après :** Bannières dynamiques + sections de service

**Nouvelles sections :**
- Bannières dynamiques en haut
- Bloc "Nos Services" avec liens vers Catalogue et À propos
- Informations pratiques (horaires, contact)

### 2. Page "À propos" (`src/app/a-propos/page.tsx`)

**Nouveau :** Récupère le contenu original de la page d'accueil
- Hero section avec image de la pharmacie
- Produits populaires
- Équipe et expertise
- Avis clients
- Mission et valeurs

### 3. Navigation (`src/components/NavBar.tsx`)

**Ajout :** Lien "À propos" dans la barre de navigation

## Utilisation

### Pour les Administrateurs

1. **Accéder à la gestion des bannières :**
   - Se connecter en tant qu'admin
   - Aller dans Admin → Annonces

2. **Créer une bannière :**
   - Cliquer sur "Créer une bannière"
   - Remplir le formulaire
   - Choisir le type de mise en page
   - Activer et définir les dates si nécessaire

3. **Gérer les bannières existantes :**
   - Activer/désactiver avec l'icône œil
   - Modifier avec l'icône crayon
   - Supprimer avec l'icône poubelle
   - Utiliser l'aperçu pour voir le rendu final

### Types de Bannières Recommandés

#### `image_left` - Promotions produits
- Idéal pour présenter un produit spécifique
- Image du produit à gauche, description à droite
- Bouton d'action vers la fiche produit

#### `image_right` - Services/Expertise
- Parfait pour mettre en avant l'équipe ou les services
- Image de l'équipe à droite, texte à gauche
- Bouton vers page de contact ou à propos

#### `image_full` - Campagnes importantes
- Impact visuel maximum
- Idéal pour les grandes promotions
- Image de fond avec texte en surimpression

## Sécurité

### Politiques RLS (Row Level Security)
- Lecture publique pour les bannières actives
- Gestion complète réservée aux admins
- Vérification par email admin (admin@farmau.com)

### Validation des Données
- Types de bannières limités aux valeurs autorisées
- Validation des URLs côté serveur
- Sanitisation des entrées utilisateur

## Nouvelles Fonctionnalités (v2.0)

### Gestion des Positions
- Boutons monter/descendre dans la liste des bannières
- Réorganisation automatique des positions
- Fonction SQL `reorder_banners()` pour maintenir la cohérence
- Fonction `cleanup_banner_positions()` pour nettoyer les positions

### Recommandations d'Images
- Affichage dynamique des tailles recommandées selon le type
- Conseils sur les formats et poids optimaux
- Mise en page améliorée avec colonnes égales
- Centrage automatique des images

### Améliorations Visuelles
- Bannières latérales avec colonnes 50/50 (CSS Grid)
- Images centrées et proportionnées
- Hauteur minimale garantie (320px)
- Ombres et arrondis améliorés
- Fond gris léger pour la zone image (meilleure distinction)
- Espacement entre les colonnes (gap-4)

## Support

Pour toute question ou problème :
1. Consulter les logs de l'API admin
2. Vérifier les permissions utilisateur
3. Tester en mode prévisualisation
4. Contacter l'équipe technique si nécessaire

---

*Documentation mise à jour le 2024-12-28* 