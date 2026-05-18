# Audit UX / Product — FARMAU (skincarelaser)

**Date** : 2026-05-19
**Périmètre** : front public + admin (rapide)
**Stack observée** : Next.js App Router, Supabase, Tailwind, SWR, devise DOP, FR uniquement
**Cible** : pharmaciens-dermatologues + grand public, République Dominicaine
**Volume produit** : 353 en BDD — mais le front en charge **100** seulement (`.limit(100)` côté serveur)

---

## Synthèse

**Note globale UX : 4 / 10** — l'ossature est correcte (catalogue, fiche produit, drawer panier, login/signup, contact, à propos) mais le site est **bloqué par trois ruptures fortes** qui rendent l'expérience peu utilisable en production.

### Top 3 frictions utilisateur

1. **Le tunnel s'arrête au panier.** Le bouton "Procéder au paiement" est désactivé avec l'étiquette « (à venir) » dans le drawer, et n'est PAS désactivé sur `/cart` (page dédiée) — il y reste cliquable mais sans handler. L'utilisateur ne peut donc pas convertir, et l'expérience est incohérente entre les deux surfaces (drawer vs page panier).
2. **Le catalogue ne montre que 28 % du stock.** `src/app/catalogue/page.tsx:45` applique `.limit(100)` côté serveur. Sur 353 produits, **253 produits sont invisibles** au visiteur. Les filtres et compteurs sont donc faussés à la racine, et la valeur perçue de l'enseigne ("353 références dermo-cosmétiques") est cassée.
3. **Incohérence visuelle massive entre identité (NavBar/Login beige `#CCC5BD`) et corps des pages (bleu primaire `#3B82F6` partout).** Les CTA principaux du parcours d'achat (Ajouter au panier, Procéder au paiement, Continuer les achats) sont en bleu Tailwind générique, alors que l'identité FARMAU est posée en beige chaleureux dans le NavBar, le Footer et les pages d'auth. Le site ressemble à un assemblage de templates Tailwind plutôt qu'à une marque.

### Frictions secondaires notables

- Le **Footer** liste 9 catégories de produits + 11 besoins, **aucun n'est cliquable** (pas de `<a>` ni `<Link>`, sauf "Contact"). Idem pour les 4 icônes réseaux sociaux (`cursor-pointer` mais aucun `href`).
- La **page Contact** affiche explicitement « Vous devez avoir un compte pour nous contacter » — une RPC `create_contact_message` valide en BDD que l'email correspond à un compte. C'est une friction injustifiée pour le canal de support pré-achat (le marché dominicain veut du WhatsApp, et la page heureusement propose WhatsApp en parallèle).
- Le **dropdown langue** (Français/English/Español) du NavBar est purement visuel — aucun handler, aucune route i18n. Trompeur pour un marché trilingue (espagnol natif RD, anglais touristique, français FARMAU).
- Les **filtres côté client** scannent ~100 produits dans un `useMemo` avec une triple boucle imbriquée (productCounts) qui recalcule tout à chaque toggle. Acceptable à 100, **inacceptable à 353+** sans index serveur.
- La page d'accueil n'a **aucun produit affiché** : seulement 3 cartes "Services" (Catalogue / À propos / Consultation non cliquable). Une homepage e-commerce sans best-sellers, sans nouveautés, sans recherche, sans tease produit est un anti-pattern majeur.

---

## Flux utilisateur principal

### Parcours nominal théorique

```
[Accueil /]
   |
   | "Catalogue" (NavBar) OU "Catalogue" (carte service)
   v
[/catalogue]  — 100 produits affichés (sur 353), filtres marques/gammes/4 types de tags
   |
   | clic sur ProductCard
   v
[/product/{id}]  — galerie image, prix, tags, quantité, "Ajouter au panier"
   |
   | clic "Ajouter au panier"
   v
[Toast "Ajouté !" 2s]  + badge CartIcon NavBar incrémenté
   |
   | clic CartIcon (NavBar)
   v
[CartDrawer right-slide]  — items, total, "Vider", "Procéder au paiement (à venir)" DISABLED
   |
   | ??? (pas de checkout)
   v
[CUL-DE-SAC]
```

### Parcours alternatif page panier `/cart`

```
[CartDrawer] -> aucun lien vers /cart  (drawer = seul accès panier)
       OU
[URL directe /cart]
   v
[/cart page]
   - mêmes items, mais nouvelle UI (3 colonnes, "Résumé de commande")
   - bouton "Procéder au paiement" NON DISABLED (différence avec drawer !)
   - clic -> rien ne se passe (pas de onClick, pas de href)
   - frais de livraison hardcodés 5.99 DOP (vraiment ?)
   - format mixte "DOP" sans `Intl.NumberFormat`
```

### Ruptures de flux identifiées

| # | Rupture | Sévérité | Localisation |
|---|---------|----------|--------------|
| R1 | Pas de checkout : le tunnel se termine en cul-de-sac | **Bloquant** | `CartDrawer.tsx:140-142`, `CartClient.tsx:182-184` |
| R2 | Drawer dit "(à venir)" + disabled, page `/cart` dit "Procéder au paiement" + actif | **Élevé** | Incohérence drawer/page |
| R3 | Aucun lien depuis le drawer vers la page `/cart` complète | **Moyen** | `CartDrawer.tsx` |
| R4 | Page produit : `ProductClient` (utilisé) ≠ `ProductDetailCard` (mort) — deux composants concurrents pour la même fiche | **Moyen** | `ProductClient.tsx` vs `ProductDetailCard.tsx` |
| R5 | Bouton "Consultation" sur la home n'est pas un lien (`<div>` au lieu de `<Link>`) | **Faible** | `page.tsx:92-103` |
| R6 | "Voir la tendance" et "Voir plus" sur `/a-propos` sont des `<button>` sans onClick | **Faible** | `a-propos/page.tsx:40,86` |
| R7 | Contact exige un compte (validation BDD), mais le formulaire n'affiche pas que l'envoi peut échouer pour cette raison côté UI avant submit | **Moyen** | `ContactForm.tsx` + RPC `create_contact_message` |
| R8 | Aucun fil d'Ariane (breadcrumb) sur fiche produit ni catalogue | **Faible** | partout |

### ASCII : visualisation du cul-de-sac

```
   ┌─────────────────────────────────────────────────────┐
   │  Accueil  →  Catalogue  →  Produit  →  Panier      │
   │                                            │        │
   │                                            ↓        │
   │                                       ┌────────┐    │
   │                                       │   ?    │    │
   │                                       │ vide   │    │
   │                                       │ "à     │    │
   │                                       │ venir" │    │
   │                                       └────────┘    │
   │                                                     │
   │  → Aucun moyen de finaliser l'achat                 │
   │  → WhatsApp commande est mentionné sur /a-propos    │
   │     mais PAS accessible depuis le panier            │
   └─────────────────────────────────────────────────────┘
```

**Recommandation immédiate** : tant que le checkout n'est pas prêt, **rediriger le bouton vers WhatsApp** avec le contenu du panier pré-rempli (`https://wa.me/18094122468?text=Bonjour, je souhaite commander...`). C'est l'usage courant en République Dominicaine et un pont fonctionnel.

---

## Findings par écran

### 1. Page d'accueil (`/`)

**Force(s)**
- Bannières dynamiques en BDD (table `banners`, position, dates de validité, click_count/view_count) — bonne fondation marketing.
- Layout clair avec `min-h-screen`, NavBar/Footer cohérents.

**Friction(s)**
- **Zéro produit affiché.** Une e-commerce sans best-sellers, sans nouveautés, sans recherche en haut de page est inhabituel — la home oblige à un clic en plus pour voir quoi que ce soit.
- Le bloc "Nos Services" parle de **trois services**, dont "Consultation" (`page.tsx:92-103`) qui n'est pas un lien (juste un `<div className="cursor-pointer">`). Frustrant : c'est l'argument-clé pour les pharmaciens-dermatologues.
- Identité visuelle non posée : pas de hero brandé, pas de promesse, pas de logo géant. Le visiteur ne sait pas qu'il est chez "FARMAU – Première pharmacie 100 % dermatologique de RD" (cette baseline est uniquement sur `/a-propos`).
- Pas de bandeau de réassurance (livraison, retours, certification FDA/EMA — alors que c'est mentionné sur À propos).
- Trois icônes héroïcons utilisées en `svg` inline avec couleurs Tailwind (`bg-blue-100`, `bg-green-100`, `bg-purple-100`) sans rapport avec l'identité beige.

**Recommandation(s)**
1. Ajouter un **hero brandé** (image, baseline FARMAU, CTA "Découvrir le catalogue").
2. Insérer une section **best-sellers** (4-8 produits triés par `popularity` ou ventes) — réutilise déjà `BestProductsCard`/`ProductCard`.
3. Rendre "Consultation" cliquable vers `/contact` ou la nouvelle page de RDV, ou supprimer si pas implémenté.
4. Refondre la palette : remplacer les triplets `bg-blue-100`/`bg-green-100`/`bg-purple-100` par des nuances de la palette beige FARMAU.
5. Ajouter une **barre de recherche globale** en haut de la home (un visiteur cherchant "La Roche-Posay Effaclar" doit pouvoir taper sans cliquer sur Catalogue d'abord).

---

### 2. Catalogue (`/catalogue` + `CatalogueClient` + `Filters`)

**Force(s)**
- **Filtres dynamiques typés** : la liste de tags est récupérée de `tags_with_types` et groupée par `tag_type` — extensible sans toucher le code.
- Compteurs par filtre `(N)` à côté de chaque case à cocher : bonne pratique.
- Sélection en cascade marque → gammes (case mère cochable + indéterminé visuel via barre blanche) : ergonomie soignée.
- Pagination accessible avec aria-label.
- Bouton "Réinitialiser" sur l'état vide.
- `useMemo` + `useCallback` partout : intentions perf correctes.

**Friction(s)**
- **`.limit(100)` côté serveur** alors que la BDD contient 353 produits. **253 produits invisibles.** Conséquence en cascade : les compteurs "(N)" mentent, les filtres "BESOINS / HYDRATATION (12)" devraient être 35, le tri prix est partiel, etc.
- Les filtres sont **100 % client-side** : chaque toggle relance un `useMemo` sur tout le set avec 4 boucles imbriquées (1 par catégorie de filtre × 1 boucle produit × 1 boucle tag). À 100 produits ça passe, à 1000+ ça ralentira sensiblement.
- **Recherche client uniquement par `name`** (`p.name.toLowerCase().includes(searchTerm)`) — n'indexe pas la description, ni les tags, ni la marque, ni les ingrédients. Un visiteur tapant "vitamine c" ne trouvera rien si le produit s'appelle "Sérum éclat" mais a un tag `Vitamine C`.
- Pas de **debounce** sur la recherche : recalcul à chaque frappe.
- **Pagination affiche tous les numéros** (`Array.from({ length: totalPages })`). À 30 pages, ça génère 30 boutons — UI cassée. Il faut une pagination "1 ... 5 6 7 ... 30".
- Le composant **`FiltersNew.tsx` est mort** (non importé) mais reste dans le repo, avec une API différente (`selectedBrand: string` au lieu de `Set<string>`) — pollution / risque d'utilisation accidentelle.
- Sur mobile, **la colonne filtres `lg:col-span-1` se met au-dessus de la grille produit** (`grid-cols-1 lg:grid-cols-4`). Pas de drawer/modal de filtre mobile — l'utilisateur doit scroller pour passer les filtres avant de voir un produit.
- Bouton "Réinitialiser" sur l'empty state est **bleu** alors que le bouton "RÉINITIALISER" du panneau filtres est un simple texte souligné. Incohérent.
- Pas de **tri par "Nouveautés"** ni "Promotions". Les options de tri sont limitées (5).
- "MEILLEURES VENTES" est en réalité un tri alpha (`a.name.localeCompare`) — **mensonge UX** explicite : `case 'bestsellers': return a.name.localeCompare(...)`.

**Recommandation(s)**
1. **Augmenter `.limit(100)` à `.limit(500)`** ou implémenter une pagination serveur (Supabase `.range(start, end)`).
2. Étendre la recherche : `name OR description OR brand OR tags` (server-side via Supabase `.or()` ou full-text search).
3. Ajouter un **debounce** 250ms sur le champ recherche.
4. Pagination compacte (5-7 boutons max avec ellipsis).
5. **Sur mobile** : bouton "Filtres" en haut qui ouvre un drawer bottom-sheet — c'est le standard mobile commerce.
6. Soit câbler "MEILLEURES VENTES" sur une vraie métrique (vues, ventes, `order_items` agrégés), soit le supprimer.
7. **Supprimer `FiltersNew.tsx`** (mort).
8. Sauvegarder l'état des filtres dans l'URL (query params) pour le partage et le retour navigateur — actuellement, revenir sur `/catalogue` après visite produit perd tous les filtres.

---

### 3. Fiche produit (`/product/[id]` + `ProductClient`)

**Force(s)**
- Galerie image principale + thumbnails grid-4.
- Sélecteur de quantité avec limites (1-99).
- Section "Caractéristiques" avec tags pastilles bleues groupées par catégorie.
- **Produits similaires intelligents** : stratégie "même gamme" + fallback "tags communs sur skin_type ∧ category ∧ need".
- Calcul "Prix total" dynamique avec la quantité.

**Friction(s)**
- **Deux composants pour la même page** : `ProductClient.tsx` (utilisé) et `ProductDetailCard.tsx` (mort, non importé). Risque de divergence et confusion développeur.
- Image principale en **`<img>` natif** (pas `next/image`) — pas d'optimisation, pas de lazy ni de placeholder.
- Pas de **zoom image** au clic (standard sur dermo-cosmétique pour vérifier la composition INCI sur le packshot).
- Thumbnails sont **cliquables visuellement** (`hover:opacity-75 cursor-pointer`) mais ne changent pas l'image principale — pure illusion d'interaction.
- Pas d'**indication de stock** dans l'UI publique (alors que la BDD a `products.stock` et le drawer le respecte sur le `+`).
- Le **bouton "Ajouter au panier" n'a pas de feedback visuel** (pas de spinner, pas de "Ajouté !") — le composant `<button>` interne ignore les states de l'`AddToCartButton`. La quantité est aussi écrasée à 1 (l'`AddToCartButton` ignore la quantité du sélecteur).
- En réalité, le `handleAddToCart` du `ProductClient` appelle bien `addToCart(product.id, quantity)` du hook directement, **bypass de l'`AddToCartButton`** → pas de toast "Ajouté !".
- Pas de **lien marque** : "LA ROCHE-POSAY" est en `<p>` non cliquable. Devrait filtrer le catalogue sur la marque.
- Le label "Gamme {range}" en gris dans `ProductClient` vs badges pastilles dans `ProductDetailCard` (mort) → incohérence avec la carte produit catalogue qui montre les pastilles.
- Pas de **breadcrumb** (`Catalogue > Marque > Gamme > Produit`).
- Pas de **bouton wishlist / favoris** (utile sur de la cosmétique où l'achat est différé).
- Pas de **partage** (lien copiable, WhatsApp share — pertinent RD).
- Description tronquée à la longueur reçue, **sans Markdown** — si un admin met un saut de ligne dans `description`, ça s'affiche brut.
- `notFound()` est correctement appelé si le produit n'existe pas → bon point.

**Recommandation(s)**
1. **Supprimer `ProductDetailCard.tsx`** (ou inversement, le réutiliser et supprimer `ProductClient`).
2. Migrer l'image principale en `next/image` avec `fill` + `priority`.
3. Câbler les thumbnails à un state `selectedImageIndex`.
4. Afficher un **badge stock** : "En stock" / "Plus que 3 !" / "Rupture".
5. Remplacer le `<button>` natif par `<AddToCartButton variant="default" size="lg">` correctement, en lui passant la quantité (étendre la prop).
6. Ajouter un breadcrumb sticky.
7. Rendre la marque cliquable → `/catalogue?brand=LRP`.

---

### 4. Panier (page `/cart` + `CartDrawer` + `CartIcon` + `AddToCartButton`)

**Force(s)**
- Pattern panier anonyme via cookie `cart_id` + RPC `get_or_create_cart` : **excellent** pour la conversion (pas besoin de compte).
- **Optimistic updates** dans `useCart` (add/remove/update/clear) : très bonne UX perçue.
- Badge `CartIcon` avec compteur + ">99+", spinner si `isLoading`.
- Drawer right-slide avec backdrop blur, transition 300ms : visuellement propre.
- Verrouillage stock côté serveur (`product.stock < quantity → 400`).
- État vide propre dans le drawer ET dans `/cart`.

**Friction(s)**
- **Le bouton "Procéder au paiement" du drawer est disabled avec `(à venir)`** — message brut, sans alternative proposée (e.g. "Commander via WhatsApp").
- **Le bouton "Procéder au paiement" sur `/cart` n'est PAS disabled** (`CartClient.tsx:182`) — il a juste une classe bleue. **Incohérence majeure** : clique sans handler.
- **Aucun lien depuis le drawer vers `/cart`** : l'utilisateur ne peut pas accéder à la vue "panier complète". Le drawer est l'unique surface (sauf URL manuelle).
- **`shipping = 5.99` hardcodé** dans `CartClient.tsx:17` : prix de livraison fictif. À 5.99 DOP, c'est moins cher qu'un café — le visiteur RD comprend que c'est faux.
- **Format de prix incohérent** :
  - `CartDrawer` utilise `Intl.NumberFormat('fr-FR', { currency: 'DOP' })` → affiche `DOP 1 234,56`
  - `CartClient` utilise `${price.toFixed(2)} DOP` → affiche `1234.56 DOP`
  - `ProductCard` utilise `${price.toFixed(2)} ${product.currency}` → affiche `1234.56 DOP` (ou pire selon la BDD)
- Drawer width fixe `w-96` (384px) — sur mobile portrait < 384px, ça déborde. Pas de breakpoint mobile.
- Drawer pas de **focus trap** : Tab peut sortir du drawer ouvert (accessibilité).
- Pas d'**ESC pour fermer** le drawer (seulement clic backdrop ou bouton X).
- Pas de **scroll lock body** quand drawer ouvert → la page derrière scrolle aussi.
- **Tilt entre `<img>` natif** dans CartDrawer et `<Image>` next dans CartClient pour les mêmes thumbnails.
- "Vider le panier" sans **confirmation** (`clearCart()` direct) — destructif sans garde-fou.
- Quantité dans drawer va jusqu'à `item.product.stock`, mais dans `CartClient` jusqu'à 99 (sans check stock). Incohérence.
- L'`AddToCartButton` montre "Ajouté !" 2s avec `setTimeout` — bonne UX, mais il **n'ouvre PAS** le drawer après ajout (perte d'opportunité de cross-sell / progression).
- Optimistic update sur l'add : créé un item "Chargement..." avec `price: 0` pendant ~1s — visible si le réseau est lent.

**Recommandation(s)**
1. **Unifier les deux boutons** "Procéder au paiement" (drawer + page). En attendant le checkout, soit les disable les deux avec un même libellé clair "Commander via WhatsApp →", soit les router tous deux vers `https://wa.me/18094122468?text=...`.
2. Ajouter un **bouton "Voir tout le panier"** dans le footer du drawer, qui navigue vers `/cart`.
3. **Remplacer `shipping = 5.99`** par une vraie estimation (probablement 0 DOP pour pickup pharmacie, sinon variable selon zone).
4. Créer un util `formatPrice(price, currency)` centralisé et l'utiliser partout (drawer, page, card, fiche).
5. Ajouter `addEventListener('keydown', ESC)` + focus trap sur le drawer.
6. **Lock body scroll** quand drawer ouvert : `document.body.style.overflow = 'hidden'`.
7. Ouvrir le drawer automatiquement (ou afficher un mini-toast positionné sur le CartIcon) après ajout, optionnel.
8. Confirmation modale "Vider le panier ?" avec bouton rouge.

---

### 5. Login (`/login`)

**Force(s)**
- Identité visuelle FARMAU respectée (header beige `#CCC5BD`, fond `#EDEAE5`, logo User).
- Gestion d'erreurs ciblée : "Invalid login credentials" → "Email ou mot de passe incorrect".
- Banner d'erreur si redirection `?error=unauthorized` (utile pour les accès admin refusés).
- Détection admin → redirection `/admin/product` (sinon `redirect_to` du sessionStorage ou `/`).
- État `redirecting` séparé de `loading` → bon feedback ("Connexion réussie ! Redirection...").
- Lien "Créer un compte" bien visible.

**Friction(s)**
- **"Mot de passe oublié ?" pointe vers `#`** (`login/page.tsx:229`) — lien mort. Si l'utilisateur a oublié son mot de passe, il est piégé.
- Pas de **toggle "afficher mot de passe"** (eye icon) — standard.
- Pas d'**option "Se souvenir de moi"** ni durée de session explicite.
- Pas de **login social** (Google / Apple) — sur RD, Google et WhatsApp Business sont la norme. Réduire la friction d'inscription est critique pour conversion.
- Le commentaire bloc ASCII "⚠️ NE PAS MODIFIER SANS AUTORISATION ⚠️" (lignes 9-34) est intimidant et révèle des problèmes connus (ports, sessions privées) — symptôme de dette technique non résolue.
- Bouton style inline avec `onMouseEnter`/`onMouseLeave` JS pour changer la couleur (`#CCC5BD` ↔ `#B8B1A8`) au lieu d'utiliser Tailwind hover utilities. Anti-pattern.
- L'**état d'erreur** affiche uniquement le message Supabase brut quand pas reconnu — peu user-friendly.

**Recommandation(s)**
1. **Implémenter "Mot de passe oublié"** (Supabase `resetPasswordForEmail`).
2. Ajouter le toggle œil pour le mot de passe.
3. Évaluer **Sign in with Google** via Supabase OAuth (1-clic, marché RD très Google).
4. Migrer les `onMouseEnter`/`Leave` vers `hover:bg-[#B8B1A8]` en Tailwind (classes arbitraires acceptées).

---

### 6. Signup (`/signup`)

**Force(s)**
- Formulaire complet : prénom, nom, email, téléphone (optionnel), date de naissance (optionnel), mot de passe + confirmation.
- Validation côté client : matching, longueur 6+, champs requis.
- Gestion d'erreurs ciblée : email déjà utilisé, email invalide, jetable.
- Success state + redirection auto vers `/login` après 2s.
- Insertion `profiles` post-signup pour persister les champs additionnels.

**Friction(s)**
- **Mot de passe à 6 caractères minimum** — c'est en dessous des standards (NIST recommande 8+, OWASP 12+). Risque sécurité + perception "amateur".
- Aucune **règle de complexité** (juste longueur) ni indicateur de force.
- Pas de **CGU / politique de confidentialité** à accepter — obligatoire RGPD/loi RD sur données personnelles.
- Pas de toggle œil pour les mots de passe.
- **Placeholder téléphone est un format français** "+33 6 12 34 56 78" — incohérent pour le marché RD (`+1 809...`).
- Date de naissance sans **vérification d'âge** majeur (utile pour cosmétique active type rétinol).
- Si la mise à jour `profiles` échoue après signup, **silencieux** (`console.error` uniquement) → l'utilisateur a un compte sans nom dans la BDD.

**Recommandation(s)**
1. Élever le minimum à 8 caractères + indicateur de force (zxcvbn ou similaire).
2. Ajouter une checkbox CGU + lien vers la politique.
3. Adapter le placeholder téléphone : `+1 809 123 4567`.
4. Si update profile échoue → afficher un avertissement et proposer un reset depuis `/account`.

---

### 7. Contact (`/contact` + `ContactForm`)

**Force(s)**
- Page bien structurée : formulaire (gauche) + coordonnées (droite) + carte Google Maps (bas).
- WhatsApp mis en valeur dans un encart vert distinctif.
- Bouton "Contacter via WhatsApp" cliquable et fonctionnel.
- Bloc "Conditions d'envoi" informatif (24-48h).
- Carte Google Maps embarquée.

**Friction(s)**
- **"Vous devez avoir un compte pour nous contacter"** affiché 2 fois (sous-titre + bloc bleu "Conditions d'envoi") → la RPC `create_contact_message` valide en BDD que l'email existe en `auth.users`. C'est une friction inutile, contre-productive pour le canal pré-vente.
  - Un prospect qui veut juste demander "Avez-vous Avène Cleanance ?" doit créer un compte d'abord.
- L'utilisateur **ne sait pas** que l'erreur viendra de là tant qu'il n'a pas cliqué "Envoyer". Pas de check live sur le champ email.
- **Téléphone d'horaires différent** entre `/contact` (6h30-17h00) et `/a-propos` (idem ouf, mais sans samedi sur `/a-propos`). À aligner.
- Pas de **téléchargement d'un fichier** (utile pour envoyer une photo de prescription).
- Validation côté client absente (HTML5 `required` uniquement) — pas de feedback inline.

**Recommandation(s)**
1. **Supprimer l'obligation de compte** : valider juste un email valide + captcha anti-spam (hCaptcha / Cloudflare Turnstile).
2. Garder un champ "Téléphone optionnel" pour rappel.
3. Aligner les horaires entre `/contact` et `/a-propos` (source unique en BDD si possible).
4. Permettre upload de fichier (jpg/png/pdf, 5 Mo max).

---

### 8. À propos (`/a-propos`)

**Force(s)**
- Hero plein écran (60vh) avec photo de la pharmacie + baseline forte ("Première pharmacie 100 % dermatologique de République Dominicaine").
- Sections claires : produits populaires, équipe, avis clients, valeurs, horaires/contact, carte Maps.
- Avis fictifs mais crédibles, en espagnol prénoms (Valentina, Carlos, Ana-Luisa, Julia).
- Bloc "Nos Valeurs" : Qualité Certifiée FDA/EMA, Expertise Médicale, Accompagnement Personnalisé.

**Friction(s)**
- **Boutons "Voir la tendance" et "Voir plus" sans onClick** : interaction simulée. Frustrant.
- "Produits Populaires" est **hardcodé** (3 cartes `BestProductsCard` statiques) — devrait être dynamique depuis la BDD.
- Avis également hardcodés — pas de table `reviews`, donc impossible à modérer / faire évoluer.
- Page très longue, **pas d'ancre TOC** ni de back-to-top.
- Le carrousel d'images de la section "équipe" est un `<Image width=600 height=240>` fixe.
- **Section "Horaires" duplique** la section sur `/contact` → maintenance double.
- Pas de **lien vers le catalogue** depuis "Produits Populaires" (pas de CTA).
- "WhatsApp Commandes" est mentionné ici (`+1 809 412 2468`) mais pas exposé dans le panier ni le footer.

**Recommandation(s)**
1. Câbler "Voir la tendance" → `/catalogue?sort=bestsellers`.
2. Câbler "Voir plus" → une page `/avis` ou supprimer.
3. Charger les produits populaires dynamiquement depuis Supabase.
4. Source unique des horaires (BDD `store_config` ou fichier `data/store.ts`).
5. CTA en bas de section produits populaires : "Découvrir tout le catalogue".

---

### 9. NavBar (`NavBar.tsx`)

**Force(s)**
- Header 2 lignes : ligne 1 (langue, logo, contact/cart/auth), ligne 2 (navigation).
- Logo centré, prefetch sur Accueil.
- Affichage conditionnel : non-connecté (UserIcon + "Se connecter") / connecté (badge admin Shield + "Se déconnecter").
- CartIcon avec badge dynamique + ouverture drawer.
- Boutons accessibles avec `aria-label`.
- Couleur identitaire `#CCC5BD` correctement appliquée.

**Friction(s)**
- **Dropdown langue NON FONCTIONNEL** : les 3 entrées `<li>` (Français / English / Español) n'ont aucun handler. Pour un marché RD trilingue, c'est un signal de défiance.
- **Pas de menu hamburger mobile** : sur mobile (< md), la nav `flex justify-center gap-6` se serre mais reste visible. Acceptable à 3 liens, mais le bouton "Langue" et "Se connecter" à droite peuvent déborder.
- Le **logo 140×140** prend la pleine hauteur de la ligne 1 et déborde via `-top-4` — joli mais fragile si la marque ajoute "Beta" ou un sous-titre.
- "Langue" est un mot pas un icône (globe) — moins reconnaissable.
- "Contact par email" via icône `Mail` qui pointe vers `/contact` → mais sémantiquement "Mail" suggère un mailto, pas une page.
- **Lien "Clinic"** mentionné comme supprimé récemment — le commit `940dbb7` ("réorganisation navigation et création page contact") l'a effectivement retiré. Pas trace dans le code, OK.
- Pas de **barre de recherche** dans le NavBar (alors que c'est un site avec 353 produits) — l'utilisateur doit aller sur Catalogue d'abord.
- L'icône admin `Shield` apparaît à côté de "Se déconnecter" : ordre visuel inhabituel (en général dropdown profil avec items dedans).

**Recommandation(s)**
1. **Soit câbler i18n** (next-intl + 3 traductions), **soit supprimer le dropdown** langue. Garder un dropdown non fonctionnel est plus dommageable que rien.
2. Ajouter un input recherche dans le NavBar (visible md+, icône loupe mobile qui ouvre une overlay).
3. Menu hamburger mobile dédié.
4. Remplacer l'icône Mail par un téléphone/casque (le contact n'est pas que mail).

---

### 10. Footer (`Footer.tsx`)

**Force(s)**
- 4 colonnes thématiques : Logo+réseaux / Produits / Besoins / Service+Marque.
- Liste exhaustive des catégories produits et besoins (cohérent avec les filtres catalogue).
- Couleur identitaire `#CCC5BD`.

**Friction(s)**
- **AUCUN lien cliquable** sauf "Contact". Les 9 catégories de produits (Démaquillants, Sérums, Crèmes...) et 11 besoins (Rides, Hydratation, Fermeté...) sont des `<li>` plain text. **Anti-pattern majeur**.
- **Réseaux sociaux non cliquables** : 4 icônes (Instagram, TikTok, Facebook, YouTube) avec `cursor-pointer` mais aucun `href`. Trompeur.
- "À propos de nous / Nos valeurs / Notre équipe" → trois entrées qui pointeraient toutes vers `/a-propos` (sections), mais pas même un `<a>`.
- "Nos points de vente" sans lien (alors que la pharmacie a une adresse unique sur RD ?).
- **Pas d'adresse, téléphone, email** dans le footer — alors qu'ils sont sur `/a-propos`. C'est attendu en footer.
- **Pas de mentions légales, CGV, politique de confidentialité** — obligatoires.
- **Pas responsive** : `grid-cols-4` fixe → sur mobile, les 4 colonnes vont se compresser ou déborder. Devrait être `grid-cols-2 md:grid-cols-4` au minimum.

**Recommandation(s)**
1. **Câbler tous les liens** vers le catalogue filtré : "Sérums" → `/catalogue?tag=Sérum`, "Hydratation" → `/catalogue?tag=Hydratation`, etc.
2. **Réseaux sociaux** : `<a href="https://instagram.com/farmau" target="_blank" rel="noopener noreferrer">`.
3. Ajouter une 5e colonne ou enrichir colonne 4 avec adresse / tél / email.
4. Ajouter une 6e ligne avec liens légaux : Mentions légales, CGV, Confidentialité, Cookies.
5. `grid-cols-2 md:grid-cols-4` pour le responsive.

---

### 11. Admin (rapide — `/admin/product`, layout)

**Force(s)**
- Sidebar collapsable, état actif via `pathname`.
- Navigation cohérente : Produits, Marques, Stock, Tags, Messages, Annonces, Mon équipe, Paramètres, Configuration.
- Garde-fou : si pas admin / pas connecté, redirige vers `/login?redirectedFrom=...`.
- Page produit admin : table avec image, marque, tags, prix, stock, actions edit/delete + modal CRUD complet.
- Slug auto-généré depuis le nom.
- Pagination serveur (`/api/admin/products/with-tags?page=&limit=10&search=`).
- Modal de confirmation pour la suppression (TrashIcon + "Cette action est irréversible").

**Friction(s)**
- **"Mon équipe" et "Paramètres" sont en mode démo** (données fictives, `Paramètres` affiche un bandeau jaune "Mode démo — Les modifications ne sont pas persistées"). Présents dans la nav comme s'ils étaient fonctionnels — risque de confusion admin.
- **`alert()` natifs** pour les erreurs ("Erreur: " + error.error) — vieille UX, devrait être un toast.
- **Pagination admin** affiche tous les numéros (`[...Array(totalPages)]`) → même problème qu'au catalogue.
- Le **format de prix** dans la table admin affiche "1234 DOP" sans formatage.
- **Pas de filtre par statut** (`is_active`) ni par marque dans la liste produit.
- **Pas de bulk actions** (sélection multiple → activer/désactiver/supprimer en lot).
- Upload image PNG uniquement (pourquoi pas JPG/WEBP ?).
- Aucune **historisation** (qui a modifié quoi, quand).
- `range_id: range?.range_id || ''` en ligne 192 utilise une propriété qui peut ne pas exister (cf. `product_ranges: any[]`) — fragile.

**Recommandation(s)**
1. **Masquer ou marquer clairement** "Mon équipe", "Paramètres" et "Configuration" comme "(démo)" dans la sidebar, ou les retirer du menu tant qu'elles ne sont pas câblées.
2. Migrer les `alert()` vers `sonner` ou `react-hot-toast`.
3. Pagination compacte.
4. Filtres par marque / statut / catégorie dans la liste produit.
5. Permettre JPG et WEBP en upload.

---

### 12. États d'erreur, vides, chargement (transverse)

**Force(s)**
- **Empty state panier (`CartClient`)** : icône grande, message, CTA "Continuer les achats".
- **Empty state filtres catalogue** : "Aucun produit trouvé" + bouton "Réinitialiser les filtres".
- **Empty state drawer** : icône + texte simple.
- **Loading state drawer** : spinner centré.
- **Loading state admin** : spinner + "Vérification des permissions...".
- **Loading state AddToCartButton** : icône Loader2 spin + "Ajout...".
- **Success state AddToCartButton** : Check + "Ajouté !" 2s.
- **404 fiche produit** : `notFound()` Next correctement appelé.

**Friction(s)**
- **Pas de skeleton** : aucune des pages catalogue / fiche / cart utilise un skeleton. Sur connexion lente, l'utilisateur voit un **blank** puis tout d'un coup le contenu.
- **Pas de fallback image** explicite : `ProductCard` utilise `/placeholder.png` (présent ? à vérifier) si pas d'image. Mais aucun `onError` pour gérer une URL d'image cassée à l'exécution.
- **Pas d'error boundary** : si la fetch Supabase échoue dans le catalogue, on a un texte brut "Erreur de chargement" en `<p>` (ligne 56 de `catalogue/page.tsx`) — pas de retry, pas de support contact.
- **Erreurs réseau côté client** : `useCart` log dans la console mais ne propage pas à l'UI (sauf via re-throw qui n'est pas catché par le drawer → seulement console.error).
- **`ContactForm` erreur silencieuse** : "Erreur de connexion. Veuillez réessayer." sans détail, pas de retry automatique.
- **AddToCartButton erreur silencieuse** : `console.error('Erreur ajout au panier:', error)` sans affichage utilisateur. Commentaire dans le code : `// Ici on pourrait afficher une notification d'erreur`.

**Recommandation(s)**
1. Ajouter des **skeletons** sur catalogue (grille de cartes grises animées) et fiche produit.
2. Implémenter un **toast système** global (sonner) pour les erreurs.
3. `onError` sur les `<Image>` → swap pour `/placeholder.png`.
4. **Error boundary** au niveau de `(app)` layout avec retry.

---

### 13. Cohérence visuelle (palette, typo, composants)

**Constat**

Variables CSS `:root` dans `globals.css` :
- `--background: #EDEAE5` (beige clair)
- `--foreground: #333333`
- `--primary: #3B82F6` (**bleu Tailwind générique**)
- `--primary-hover: #2563EB`

NavBar / Footer / Login : `#CCC5BD` (beige plus sombre, harmonieux)

**Conséquence** : les CTA (Ajouter au panier, Procéder au paiement, boutons login) sont **bleus**, alors que la marque est **beige**. La cohérence est cassée.

**Friction(s)**
- 3 palettes coexistent : `#CCC5BD` (identité brand), `#EDEAE5` (fond), `bg-blue-600` Tailwind (CTA).
- Page d'accueil "Nos Services" utilise `bg-blue-100`, `bg-green-100`, `bg-purple-100` — 3 couleurs sémantiques sans rapport avec la marque.
- Page produit "Caractéristiques" tags en `bg-blue-100 text-blue-800` au lieu du beige.
- Section "Nos Valeurs" sur `/a-propos` mélange `from-blue-50 to-purple-50` (gradient pastel) + bullets de couleurs (`bg-blue-100`, `bg-green-100`, `bg-purple-100`). Visuellement bruyant.
- **Typo Geist** chargée via `--font-geist-sans` — bonne, neutre, lisible. Cohérence OK.
- Mais les **tailles de titres varient** : `text-3xl` sur fiche produit, `text-4xl` sur Contact, `text-2xl` partout ailleurs. Pas de hiérarchie typographique formelle.
- `text-primary-700`, `text-primary-200` utilisés dans `ProductDetailCard`/`a-propos` → ces classes n'existent pas si Tailwind n'est pas configuré pour `primary` (vérifier `tailwind.config.ts`).

**Recommandation(s)**
1. **Définir une vraie palette FARMAU** en CSS variables :
   - Brand primary : `#CCC5BD` (et nuances 100→900)
   - Background : `#EDEAE5`
   - Accent (CTA fort) : à choisir, e.g. un vert pharmacie `#2D6A4F` ou un terracotta `#C97B5F`
   - Neutre : grays Tailwind
2. **Bannir `bg-blue-600`** des CTA principaux ; standardiser sur la couleur accent.
3. Refondre `Nos Services` et `Nos Valeurs` avec la nouvelle palette.
4. Centraliser la typo : `<h1 className="text-3xl md:text-4xl">`, `<h2 className="text-2xl md:text-3xl">`, etc. dans un composant ou des classes utility.

---

### 14. Mobile / responsive (transverse)

**Force(s)**
- `min-h-screen`, `flex flex-col` partout → footer toujours en bas.
- Grilles produit : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (responsive).
- Cart drawer pleine hauteur.
- Page produit : `grid-cols-1 lg:grid-cols-2` → images en haut, infos en bas sur mobile.
- Page contact : `grid-cols-1 lg:grid-cols-2`.

**Friction(s)**
- **Footer en `grid-cols-4` fixe** → désastre mobile (colonnes <200px chacune, texte tronqué).
- **NavBar : pas de hamburger menu** mobile. Les 3 liens + logo + 5 icônes/boutons à droite + bouton Langue à gauche ne tiennent pas sur 375px.
- **Filtres catalogue mobile** : le panneau filtres est au-dessus de la grille produits sur mobile. L'utilisateur doit scroller pour passer une longue liste de filtres avant de voir le 1er produit.
- **CartDrawer `w-96`** (384px) : déborde sur mobile portrait < 384px (iPhone SE 320×568).
- **Tableau admin produits** non responsive : `<table>` avec 6 colonnes → scroll horizontal ou cassé sur mobile.
- **Modal admin** : `max-w-4xl` → trop large pour mobile, scroll horizontal probable.

**Recommandation(s)**
1. Footer : `grid-cols-2 md:grid-cols-4` minimum.
2. NavBar : burger menu mobile, à minima un drawer left avec les liens.
3. Filtres catalogue : bottom-sheet mobile.
4. CartDrawer : `w-full sm:w-96` ou `w-[min(384px,100vw)]`.

---

## Recommandations prioritaires

Classement par **impact business × effort**.

### Priorité 1 (à faire immédiatement, < 1 semaine)

1. **Débloquer le tunnel de conversion via WhatsApp.**
   - Remplacer le bouton "Procéder au paiement (à venir)" du drawer et de `/cart` par un lien WhatsApp pré-rempli avec le panier.
   - Format : `https://wa.me/18094122468?text=Bonjour FARMAU, je souhaite commander : ${items.map(i => `${i.name} x${i.quantity}`).join(', ')}. Total: ${totalPrice} DOP`.
   - Effort : 1 h. Impact : transforme un site en démo en site qui génère des leads.

2. **Câbler le footer** (catégories, besoins, réseaux sociaux).
   - Effort : 2 h. Impact : SEO + navigation utilisable.

3. **Augmenter la limite catalogue de 100 à 500.**
   - `src/app/catalogue/page.tsx:45` : `.limit(500)` au lieu de `.limit(100)`.
   - Effort : 5 min. Impact : 253 produits redeviennent visibles.

4. **Supprimer le dropdown langue non fonctionnel** ou y mettre un placeholder "(bientôt)" + désactiver le bouton.
   - Effort : 10 min.

5. **Supprimer `FiltersNew.tsx` et `ProductDetailCard.tsx`** (composants morts).
   - Effort : 5 min. Impact : -28 Ko de bundle, moins de confusion.

### Priorité 2 (semaine 2-3)

6. **Recherche server-side** (multi-champs : nom, description, marque, tags) avec debounce.
   - Effort : 1 jour.

7. **Refonte palette** : poser une vraie identité couleur FARMAU dans `:root`, bannir les `bg-blue-*` arbitraires.
   - Effort : 1 jour.

8. **Pagination compacte** (catalogue + admin).
   - Effort : 2 h.

9. **Burger menu mobile** sur NavBar + bottom-sheet filtres catalogue mobile.
   - Effort : 1 jour.

10. **Format de prix centralisé** : util `formatDOP(price)` partout (drawer, page, card, fiche, admin).
    - Effort : 2 h.

11. **Mot de passe oublié** côté login (Supabase `resetPasswordForEmail`).
    - Effort : 2 h.

12. **Supprimer l'obligation de compte** pour le formulaire de contact + captcha.
    - Effort : 3 h.

### Priorité 3 (mois 1-2)

13. **Skeletons** sur catalogue + fiche produit.
14. **Error boundary** + toast système (sonner).
15. **Reviews dynamiques** (table BDD + modération admin).
16. **i18n complet** (FR / ES / EN) ou décision de rester FR seul.
17. **Wishlist / favoris** persistante.
18. **Page profil utilisateur** (`/account` ou `/profile`) — actuellement inexistante.
19. **Système de checkout** ou **intégration paiement DR** (Azul, CardNet, Lakanis).
20. **Tracking analytics** (Plausible/Posthog) pour valider les hypothèses UX (taux de rebond catalogue, drop-off panier, etc.).

---

## Annexe — Indicateurs à instrumenter

| Métrique | Hypothèse | Mesure cible 3 mois |
|----------|-----------|---------------------|
| Taux de visiteurs catalogue → fiche produit | actuellement non mesuré | > 35 % |
| Taux fiche → ajout panier | non mesuré | > 8 % |
| Taux panier → checkout (clic WhatsApp) | non mesuré | > 40 % |
| Recherche : top 10 termes | non mesuré | dashboard admin |
| Filtres : top 5 utilisés | non mesuré | dashboard admin |
| Time-to-First-Byte catalogue | non mesuré | < 800 ms |
| Erreurs API (cart, contact) | non mesuré | < 0.5 % |

---

## Annexe — Composants morts / code à nettoyer

| Fichier | Status | Action |
|---------|--------|--------|
| `src/components/FiltersNew.tsx` | Non importé | Supprimer |
| `src/components/ProductDetailCard.tsx` | Non importé | Supprimer (ou inverser avec `ProductClient`) |
| Lien "Mot de passe oublié" `href="#"` | Cassé | Implémenter ou enlever |
| `<button>` "Voir la tendance" / "Voir plus" sur `/a-propos` | Sans onClick | Câbler ou enlever |
| Section "Consultation" home (`<div>` au lieu de `<Link>`) | Faux lien | Câbler ou enlever |
| Réseaux sociaux footer (Instagram, TikTok, Facebook, YouTube) | Sans href | Câbler |
| Catégories + Besoins footer | Sans href | Câbler vers `/catalogue?tag=...` |
| Dropdown langue NavBar | Sans handler | Câbler i18n ou retirer |
| Page admin `my-team` | Données fictives hardcodées | Marquer "(démo)" ou retirer |
| Page admin `settings` | Bandeau "Mode démo" affiché | Marquer dans la sidebar |

---

**Total findings** : 14 sections + 20 recommandations priorisées + tableau composants morts.
