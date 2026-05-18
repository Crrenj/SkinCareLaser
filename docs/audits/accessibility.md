# Audit Accessibilité (WCAG 2.1 AA)

## Synthèse

**Site audité** : SkinCareLaser / FARMAU - E-commerce dermo-cosmétique (français)
**Cible** : pharmaciens-dermatologues + grand public
**Standard de référence** : WCAG 2.1 niveau AA
**Date** : 2026-05-19
**Périmètre** : 13 composants + 7 routes (auth, admin, catalogue, contact, accueil)

### Note globale : 38/100 — Conformité estimée ~45% WCAG 2.1 AA

Le site présente plusieurs efforts d'accessibilité (certains `aria-label`, `aria-current`, `aria-haspopup`, support `prefers-reduced-motion`, libellés `<label htmlFor>` corrects sur les formulaires d'authentification et de contact). Toutefois, des **manquements critiques** compromettent l'utilisabilité par les technologies d'assistance et la navigation clavier, en particulier :

1. **Attribut `lang="en"` sur du contenu francophone** (`src/app/layout.tsx:31`) — bloque la prononciation des lecteurs d'écran et la traduction.
2. **Aucun mécanisme de focus visible global** (toutes les classes `focus:outline-none` sans `focus-visible:ring` ni équivalent) — rend le site inutilisable au clavier.
3. **Absence de gestion modale conforme** (CartDrawer, modales admin) : pas de focus trap, pas de retour de focus, pas de fermeture par `Escape`, pas de `role="dialog"`/`aria-modal`.

### Top 3 blockers (à corriger en priorité)

| # | Blocker | WCAG | Sévérité |
|---|---------|------|----------|
| 1 | `<html lang="en">` sur contenu FR | 3.1.1 (A) | Critical |
| 2 | `focus:outline-none` sans alternative visible partout | 2.4.7 (AA) | Critical |
| 3 | Modales (CartDrawer + admin) non conformes (pas de trap, pas d'Escape, pas de `aria-modal`) | 2.1.2, 4.1.2 (A) | Critical |

### Conformité estimée par dimension

| Dimension | Score | Statut |
|-----------|-------|--------|
| Semantic HTML | 55% | Partiellement conforme |
| ARIA | 45% | Partiellement conforme |
| Navigation clavier / focus | 20% | Non conforme |
| Focus management modal | 5% | Non conforme |
| Contraste couleurs | 50% | À vérifier / problèmes identifiés |
| Alt text images | 70% | Partiellement conforme |
| Forms (labels + erreurs) | 60% | Partiellement conforme |
| Loading states (live regions) | 10% | Non conforme |
| Skip link | 0% | Absent |
| Langue du document | 0% | Erroné |

---

## Findings

### 1. Attribut `lang` erroné sur HTML racine — Severity: Critical — WCAG: 3.1.1 (A)
**Fichier** : `src/app/layout.tsx:31`
**Problème** : `<html lang="en">` est codé en dur alors que l'intégralité du contenu est en français ("Connexion à votre compte", "Panier", "Catalogue", "Ajouter au panier"…). Conséquences :
- Les lecteurs d'écran (NVDA, JAWS, VoiceOver) appliquent la prononciation anglaise au texte français, rendant la voix synthétique incompréhensible.
- Les moteurs de traduction et l'outil "Reader" des navigateurs sont mal orientés.
- Échec du critère **WCAG 3.1.1 Language of Page (niveau A)**.

**Remediation** :
```tsx
// AVANT
<html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>

// APRES
<html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
```
Si une internationalisation multi-langues est prévue (un toggle « Langue » existe dans `NavBar.tsx:41`), faire dépendre `lang` du locale Next.js (App Router : `params.locale`).

---

### 2. `focus:outline-none` systématique sans alternative visible — Severity: Critical — WCAG: 2.4.7 (AA)
**Fichiers concernés** :
- `src/components/NavBar.tsx:44, 66, 82, 99, 107, 117, 124, 135-137`
- `src/components/CartDrawer.tsx:82, 131, 140, 203, 219, 231`
- `src/components/CartIcon.tsx:18`
- `src/components/Filters.tsx:86, 132, 143, 257`
- `src/components/CatalogueClient.tsx:285, 341, 356, 366, 381`

**Problème** : `focus:outline-none` est utilisée partout sans `focus-visible:ring-…` ni `focus:ring-…` de remplacement. L'utilisateur clavier ne voit pas où il se trouve. Échec du critère **WCAG 2.4.7 Focus Visible (AA)**.

**Note** : `globals.css:45` définit `.focus-visible:focus { outline: 2px solid var(--primary); }` mais la classe `.focus-visible` n'est jamais appliquée et ce sélecteur CSS est incorrect (devrait être `:focus-visible`, pas `.focus-visible:focus`).

**Remediation** :
```tsx
// AVANT
className="... focus:outline-none rounded p-1"

// APRES
className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 rounded p-1"
```
Et dans `globals.css` (corriger le sélecteur) :
```css
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

---

### 3. CartDrawer : pas de gestion modale conforme — Severity: Critical — WCAG: 2.1.2, 2.4.3, 4.1.2 (A)
**Fichier** : `src/components/CartDrawer.tsx:56-149`
**Problème** : Le drawer panier se comporte comme une modale (overlay opaque, `z-50`, ferme tout focus arrière), mais :
- Aucun `role="dialog"` ni `aria-modal="true"`.
- Aucun `aria-labelledby` pointant vers le `<h2>Panier (...)</h2>`.
- Pas de focus trap (le clavier peut Tab vers les éléments derrière l'overlay).
- Pas de fermeture par touche `Escape`.
- Le focus n'est pas déplacé sur le drawer à l'ouverture, ni restauré sur le bouton déclencheur (`CartIcon`) à la fermeture.
- L'overlay (`div` cliquable ligne 60-63) n'est pas accessible au clavier (manque `role="button"` + handler clavier — ou mieux, gérer Escape).

Échecs : **2.1.2 No Keyboard Trap**, **2.4.3 Focus Order**, **4.1.2 Name, Role, Value**.

**Remediation** :
```tsx
// Ajout d'effets pour Escape + focus management
useEffect(() => {
  if (!isOpen) return
  const previousActive = document.activeElement as HTMLElement | null
  const drawer = document.querySelector('[data-testid="cart-drawer"]') as HTMLElement | null
  drawer?.focus()
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }
  document.addEventListener('keydown', onKey)
  return () => {
    document.removeEventListener('keydown', onKey)
    previousActive?.focus()
  }
}, [isOpen, onClose])

// Et sur le drawer
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="cart-drawer-title"
  tabIndex={-1}
  data-testid="cart-drawer"
  className="..."
>
  <h2 id="cart-drawer-title">Panier ({totalItems})</h2>
  ...
</div>
```
Utiliser une lib comme `@radix-ui/react-dialog` ou `focus-trap-react` est fortement recommandé pour gérer correctement le piège à focus.

---

### 4. Modales admin (produit, tags, marques) : mêmes problèmes — Severity: Critical — WCAG: 2.1.2, 4.1.2 (A)
**Fichiers** :
- `src/app/admin/product/page.tsx:477-700` (modal ajout/édit produit + modal confirmation suppression)
- `src/app/admin/tags/page.tsx:510-700+` (2 modales : type de tag, tag)
- `src/app/admin/marques/page.tsx:483-700+` (2 modales : marque, gamme, suppressions)

**Problème** : ces modales sont implémentées avec `fixed inset-0 bg-gray-600 bg-opacity-50` sans :
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Aucune fermeture par `Escape`.
- Pas de focus trap.
- Pas de restauration du focus.
- Le bouton de fermeture (croix `XMarkIcon`) n'a pas de `aria-label` (ex. `admin/product/page.tsx:485` `<button onClick={() => setShowModal(false)}><XMarkIcon /></button>`).

**Remediation** : extraire un composant `<Modal>` accessible (basé sur Radix, Headless UI ou implémentation custom robuste) et y migrer toutes les modales admin. Minimum sur la croix :
```tsx
<button
  onClick={() => setShowModal(false)}
  aria-label="Fermer le formulaire"
  className="..."
>
  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
</button>
```

---

### 5. Skip link "Aller au contenu principal" absent — Severity: High — WCAG: 2.4.1 (A)
**Fichiers** : `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/catalogue/page.tsx`, `src/app/contact/page.tsx`
**Problème** : Aucun lien d'évitement n'est présent. Un utilisateur clavier ou de lecteur d'écran doit traverser la navbar entière (Langue + logo + 3 icônes droite + 3 liens nav) avant d'atteindre le `<main>`. Échec **WCAG 2.4.1 Bypass Blocks (A)**.

**Remediation** : Ajouter dans `layout.tsx` (ou dans un composant `<SkipLink>`) :
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:outline focus:outline-2 focus:outline-blue-600"
>
  Aller au contenu principal
</a>
```
Et ajouter `id="main-content"` (+ `tabIndex={-1}`) sur le `<main>` de chaque page.

---

### 6. Notifications/erreurs/succès non annoncées (pas de live region) — Severity: High — WCAG: 4.1.3 (AA)
**Fichiers** :
- `src/components/ContactForm.tsx:68-86` (succès & erreur)
- `src/components/AddToCartButton.tsx:82-97` (état "Ajouté !")
- `src/app/(auth)/login/page.tsx:146-155` (erreurs + redirection)
- `src/app/(auth)/signup/page.tsx:151-161` (erreurs + succès)

**Problème** : Les messages d'état (succès, erreur, "Ajouté !", "Redirection en cours…") apparaissent visuellement mais ne sont **jamais annoncés aux lecteurs d'écran**. Aucune `aria-live`, `role="status"` ou `role="alert"` n'est présent dans tout le code (`grep` retourne 0 occurrence). Échec **WCAG 4.1.3 Status Messages (AA)**.

**Remediation** :
```tsx
// Succès
<div role="status" aria-live="polite" className="...">
  <p>Votre message a été envoyé avec succès !</p>
</div>

// Erreur
<div role="alert" aria-live="assertive" className="...">
  <p>{error}</p>
</div>

// Bouton "Ajouté !"
{showSuccess && (
  <span role="status" aria-live="polite" className="sr-only">
    Produit ajouté au panier
  </span>
)}
```

---

### 7. Loading spinners sans rôle ni texte accessible — Severity: High — WCAG: 1.1.1, 4.1.3
**Fichiers** :
- `src/components/CartDrawer.tsx:93-96` (spinner liste vide)
- `src/components/CartIcon.tsx:38-40` (spinner overlay)
- `src/components/AddToCartButton.tsx:82-85`
- `src/components/ContactForm.tsx:155-158`
- `src/app/admin/layout.tsx:63-65` ("Vérification des permissions…")
- `src/app/admin/product/page.tsx:319-323`

**Problème** : Les spinners (`<div className="animate-spin …">`) sont purement visuels. Pas de `role="status"`, pas de texte caché (`sr-only`), pas d'`aria-live`. Un utilisateur de lecteur d'écran ignore qu'une opération est en cours.

**Remediation** :
```tsx
<div role="status" aria-live="polite">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" aria-hidden="true"></div>
  <span className="sr-only">Chargement en cours</span>
</div>
```

---

### 8. Réseaux sociaux et listes du footer non actionnables au clavier — Severity: High — WCAG: 2.1.1, 4.1.2 (A)
**Fichier** : `src/components/Footer.tsx:14-19, 25-65`
**Problème** :
- Les icônes sociaux `<Instagram />`, `<SiTiktok />`, `<Facebook />`, `<Youtube />` ont `cursor-pointer` mais **ne sont entourées d'aucun `<a>` ni `<button>`** — elles ne reçoivent pas le focus clavier, n'ont ni label, ni URL.
- Les listes de produits / besoins / marque (`<li>Sérums</li>`, `<li>Rides</li>`, `<li>À propos de nous</li>`…) sont du texte brut sans liens.

Échec **WCAG 2.1.1 Keyboard** et **4.1.2 Name, Role, Value**.

**Remediation** :
```tsx
<a href="https://instagram.com/farmau" aria-label="Instagram (nouvelle fenêtre)" target="_blank" rel="noopener noreferrer">
  <Instagram className="w-6 h-6" aria-hidden="true" />
</a>
```
Convertir les `<li>` du footer en `<li><Link href="/catalogue?category=serums">Sérums</Link></li>` pour rendre la navigation réellement utile.

---

### 9. Hiérarchie de titres incohérente — Severity: Medium — WCAG: 1.3.1 (A), 2.4.6 (AA)
**Fichiers** :
- `src/app/page.tsx` : pas de `<h1>` sur l'accueil (seulement `<h2>Nos Services</h2>`).
- `src/app/contact/page.tsx:14` : `<h1>Contactez-nous</h1>` puis `ContactForm.tsx:60` redéfinit un `<h2>Contactez-nous</h2>` (doublon).
- `src/components/Banner.tsx:47, 217, etc.` : utilise des `<h3>` pour des titres de bannières — sans `<h2>` parent dans la page d'accueil.
- `src/app/(auth)/login/page.tsx:135` & `signup/page.tsx:141` : `<h2>Connexion à votre compte</h2>` sans `<h1>` correspondant — les pages d'auth n'ont pas de `<h1>`.

Échec **WCAG 1.3.1 Info and Relationships** : la structure des titres doit être logique et séquentielle.

**Remediation** :
- Ajouter un `<h1>` significatif à chaque page (peut être visuellement masqué : `sr-only`).
- Sur `/`, démarrer la hiérarchie à `<h1>FARMAU — Cosmétiques dermatologiques</h1>`.
- Sur login/signup, remplacer `<h2>` par `<h1>`.
- Sur `Banner.tsx`, exposer un prop `headingLevel` pour adapter `h2`/`h3` selon le contexte.

---

### 10. Contraste insuffisant du fond beige `#CCC5BD` avec texte gris — Severity: High — WCAG: 1.4.3 (AA)
**Fichiers** :
- `src/components/NavBar.tsx:36` `backgroundColor: '#CCC5BD'` + `text-gray-600` ligne 44 (sur le bouton "Langue").
- `src/components/NavBar.tsx:134-137` : nav links en `text-gray-700` sur fond `#CCC5BD`.
- `src/app/(auth)/login/page.tsx:131` & `signup/page.tsx:137` : header avec `#CCC5BD` + `text-gray-700/800` sur le sous-titre `text-gray-700`.
- `src/app/(auth)/login/page.tsx:208-212` : Bouton principal `Se connecter` avec `backgroundColor: '#CCC5BD'` + `text-white` — **ratio ~1.96:1, échec total**.
- `src/app/(auth)/login/page.tsx:251` : Lien "Créer un compte" texte `#CCC5BD` sur fond blanc — **ratio ~1.83:1, échec**.
- `src/app/(auth)/signup/page.tsx:331-332` : Lien "Connectez-vous" couleur `#CCC5BD` sur fond blanc.
- `src/components/Footer.tsx:8` : `#CCC5BD` + `text-primary` (couleur indéterminée dans le code visible).

**Calcul rapide** (basé sur les valeurs typiques) :
| Combinaison | Ratio approx. | Cible AA texte normal | Verdict |
|-------------|---------------|------------------------|---------|
| `#CCC5BD` / `#4B5563` (text-gray-600) | ~3.7:1 | 4.5:1 | ÉCHEC |
| `#CCC5BD` / `#374151` (text-gray-700) | ~5.5:1 | 4.5:1 | OK |
| `#CCC5BD` / `#FFFFFF` (text-white) | ~1.96:1 | 4.5:1 | ÉCHEC GRAVE |
| `#FFFFFF` / `#CCC5BD` (lien) | ~1.83:1 | 4.5:1 | ÉCHEC GRAVE |
| `#EDEAE5` / `#9CA3AF` (placeholder/grey-medium) | ~1.74:1 | 4.5:1 | ÉCHEC GRAVE |

Échec **WCAG 1.4.3 Contrast (Minimum)**. Particulièrement critique sur le bouton de connexion principal.

**Remediation** :
- Boutons primaires : assombrir vers `#8C8377` ou `#6B635A` (testés à 4.5+ avec blanc).
- Liens d'action : utiliser une couleur de marque assombrie (`#5B554F`) ou le bleu existant `#3B82F6`.
- Texte gris : passer de `text-gray-600` (#4B5563) à `text-gray-700` (#374151) ou `text-gray-800` sur fond `#CCC5BD`.
- Vérifier avec un outil tel que Stark, Accessible-Colors, ou `npm install wcag-contrast`.

---

### 11. Labels non associés aux inputs dans les modales admin — Severity: High — WCAG: 1.3.1, 3.3.2 (A)
**Fichiers** :
- `src/app/admin/product/page.tsx:498-571` : tous les `<label>` n'ont pas de `htmlFor`, les `<input>` n'ont pas d'`id` correspondant.
- `src/app/admin/tags/page.tsx:528-700` : idem (vérifié `grep htmlFor` = 0 occurrence).
- `src/app/admin/marques/page.tsx` : idem (`grep htmlFor` = 0 occurrence).

**Problème** : Le `<label>` se contente d'envelopper le texte. L'association `label`-`input` n'existe pas, donc :
- Cliquer le label ne focusse pas l'input.
- Les lecteurs d'écran n'annoncent pas le label à la prise de focus.

Échec **WCAG 1.3.1 Info and Relationships** et **3.3.2 Labels or Instructions**.

**Remediation** :
```tsx
// AVANT
<label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
<input type="text" required value={formData.name} ... />

// APRES
<label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
<input id="product-name" type="text" required value={formData.name} ... />
```
À noter : les formulaires `ContactForm`, `login`, `signup` sont **corrects** sur ce point (`htmlFor` + `id` présents).

---

### 12. ProductClient + ProductDetailCard : éléments interactifs sans label + utilisation de `<img>` brut — Severity: Medium — WCAG: 1.1.1, 4.1.2 (A)
**Fichier** : `src/components/ProductClient.tsx:67, 80, 159-175`
**Problèmes** :
- Les boutons +/− de quantité (`<button>−</button>` et `<button>+</button>` ligne 159-175 et 169) n'ont **pas de `aria-label`** ; un lecteur d'écran annonce uniquement "−" et "+" (signes ambigus).
- Galerie d'images secondaires (`ProductClient.tsx:77-87`) : les `<img>` ont `cursor-pointer` mais ne sont pas dans un `<button>` ni un `<a>` — pas d'interaction clavier réelle, et pas de mécanisme pour changer l'image principale.
- Utilise `<img>` natif au lieu de `next/image` (ligne 68, 80). Risque CLS et perf, et l'`alt` est fallback `product.name` (acceptable mais inférieur à un alt descriptif).

Échec **WCAG 1.1.1** (image non décorative sans alt utile) et **4.1.2**.

**Remediation** :
```tsx
<button
  type="button"
  aria-label="Diminuer la quantité"
  onClick={() => handleQuantityChange(quantity - 1)}
  disabled={quantity <= 1}
>−</button>

// Galerie cliquable
<button
  type="button"
  onClick={() => setSelectedImage(i)}
  aria-label={`Voir l'image ${i + 2} de ${product.name}`}
  className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
>
  <Image src={img.url} alt={img.alt || `${product.name} - vue ${i + 2}`} ... />
</button>
```

---

### 13. NavBar : dropdown langue non conforme — Severity: Medium — WCAG: 2.1.1, 4.1.2 (A)
**Fichier** : `src/components/NavBar.tsx:41-61`
**Problème** :
- Le bouton "Langue" a bien `aria-expanded` et `aria-haspopup="true"`. 
- Toutefois, les éléments `<li role="menuitem">` :
  - Ne sont pas dans un container `role="menu"` cohérent (l'`<ul role="menu">` est correct, mais...)
  - Ne sont pas interactifs : ce sont des `<li>` sans `tabIndex`, sans `<button>`, sans `onClick`, sans `onKeyDown`. Donc cliquer ne fait rien et la "sélection de langue" est un placeholder.
  - Pas de gestion des flèches haut/bas (ARIA menu pattern).
  - Pas de fermeture sur `Escape`, `Tab`, ou click extérieur.

**Remediation** : soit utiliser `@radix-ui/react-dropdown-menu` (recommandé), soit refactoriser en :
```tsx
<ul role="menu" aria-label="Choix de la langue">
  {LANGS.map(l => (
    <li role="none" key={l.code}>
      <button role="menuitem" onClick={() => switchLang(l.code)}>{l.label}</button>
    </li>
  ))}
</ul>
```
+ gérer `Escape` et focus initial sur le premier item.

---

### 14. Filtres : checkboxes natives masquées (`sr-only`) sans focus visible — Severity: High — WCAG: 2.4.7, 4.1.2 (AA/A)
**Fichier** : `src/components/Filters.tsx:101, 168, 211, 273, 358, 271`
**Problème** : Les inputs (`type="checkbox"` et `type="radio"`) sont masqués avec `className="sr-only"` et c'est un `<div>` qui présente l'état visuel (case cochée). Le focus reste sur l'input invisible, donc **aucune indication visuelle quand on tabule** sur ces 50+ filtres. Échec **2.4.7 Focus Visible**.
De plus, les `<label>` enveloppent l'input mais l'utilisateur lecteur d'écran peut entendre la position uniquement si JAWS/NVDA détecte le mode formulaire.

**Remediation** : Utiliser `peer-focus-visible:ring-2` sur le `<div>` visuel :
```tsx
<label className="flex items-center cursor-pointer group">
  <input
    type="checkbox"
    checked={selectedBrands.has(brand)}
    onChange={() => onBrandToggle(brand)}
    className="sr-only peer"
  />
  <div className="w-5 h-5 border-2 rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 ...">
    {selectedBrands.has(brand) && (...)}
  </div>
  ...
</label>
```

---

### 15. Map iframe sans titre descriptif & WhatsApp link annonce manquante — Severity: Low — WCAG: 2.4.1, 4.1.2
**Fichier** : `src/app/contact/page.tsx:106-115, 86-96`
**Problème** :
- L'iframe Google Maps a `title="Localisation FARMAU"` (BON), mais aucune alternative pour ceux qui désactivent les iframes. Pas de critique majeure.
- Le lien WhatsApp (`<a href="https://wa.me/18094122468" target="_blank">`) ouvre une nouvelle fenêtre sans indication accessible ("(nouvelle fenêtre)"). L'icône SVG `<svg>` n'a pas `aria-hidden="true"`.

**Remediation** :
```tsx
<a
  href="https://wa.me/18094122468"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Contacter via WhatsApp (s'ouvre dans une nouvelle fenêtre)"
  className="..."
>
  <svg aria-hidden="true" className="w-5 h-5 mr-2" ...>...</svg>
  Contacter via WhatsApp
</a>
```

---

### 16. Footer : sections sans `<nav>` et liens manquants — Severity: Medium — WCAG: 1.3.1, 2.4.1
**Fichier** : `src/components/Footer.tsx:6-72`
**Problème** : Le footer est un `<footer>` (bon), mais les listes "PRODUITS", "BESOINS", "SERVICE", "MARQUE" ne sont pas dans une `<nav aria-label="Footer">`, et la majorité des éléments `<li>` sont du texte plain sans lien (cf. finding #8). Pour un utilisateur de lecteur d'écran, le footer est très désorganisé.

**Remediation** :
```tsx
<nav aria-label="Navigation pied de page" className="grid grid-cols-4 gap-8 p-8">
  <section aria-labelledby="footer-products">
    <h3 id="footer-products" className="font-semibold mb-2">PRODUITS</h3>
    <ul>
      <li><Link href="/catalogue?cat=demaquillants">Démaquillants & Nettoyants</Link></li>
      ...
    </ul>
  </section>
  ...
</nav>
```

---

### 17. ContactForm : placeholder utilisé comme label complémentaire ambigu — Severity: Low — WCAG: 3.3.2
**Fichier** : `src/components/ContactForm.tsx:104, 126, 144`
**Problème** : Les placeholders ("votre@email.com", "Quel est l'objet de votre message ?", "Décrivez votre demande en détail…") apportent une info utile mais disparaissent dès qu'on tape. Pour les utilisateurs cognitifs ou avec faible vision, mieux vaut une aide persistante (`aria-describedby`). Le label est présent (bon point), mais l'`aria-describedby` n'est pas utilisé pour le `<p className="mt-1 text-xs">Utilisez l'email de votre compte utilisateur</p>` (ligne 108-110).

**Remediation** :
```tsx
<input id="email" aria-describedby="email-help" ... />
<p id="email-help" className="mt-1 text-xs text-gray-500">
  Utilisez l'email de votre compte utilisateur
</p>
```

---

### 18. AdminLayout sidebar : navigation non sémantique & labels manquants — Severity: Medium — WCAG: 1.3.1, 4.1.2
**Fichier** : `src/app/admin/layout.tsx:71-136`
**Problème** :
- Le `<nav>` (ligne 91) est bon, mais sans `aria-label` (deux nav peuvent coexister sur une page admin).
- Les liens `Link` (ligne 95-110) en mode réduit (`!sidebarOpen`) n'affichent **que l'icône**. Le `title={!sidebarOpen ? item.name : undefined}` aide les utilisateurs souris, mais pas les lecteurs d'écran. Il faut `aria-label`.
- Le bouton "Déconnexion" (ligne 122-133) en mode réduit a `title` mais pas `aria-label`.
- Aucun `aria-current="page"` sur le lien actif (la classe visuelle distingue, mais pas pour les lecteurs d'écran).

**Remediation** :
```tsx
<nav className="..." aria-label="Navigation administration">
  {NAVIGATION.map((item) => (
    <Link
      key={item.name}
      href={item.href}
      aria-label={!sidebarOpen ? item.name : undefined}
      aria-current={isActive ? 'page' : undefined}
      ...
    >
      <item.icon aria-hidden="true" className="..." />
      {sidebarOpen && item.name}
    </Link>
  ))}
</nav>
```

---

## Checklist par composant

- [ ] **NavBar** (`src/components/NavBar.tsx`)
  - [ ] Dropdown langue inutile/non fonctionnel (finding #13)
  - [ ] `focus:outline-none` partout (finding #2)
  - [ ] Contraste `text-gray-600` sur `#CCC5BD` insuffisant (finding #10)
  - [x] `aria-label`, `aria-haspopup`, `aria-expanded` corrects sur bouton langue
  - [x] `aria-label="Accueil FARMAU"` sur lien logo
  - [x] Bonne sémantique `<nav role="navigation" aria-label="Navigation principale">`

- [ ] **Footer** (`src/components/Footer.tsx`)
  - [ ] Icônes sociales non actionnables (finding #8)
  - [ ] Listes sans liens fonctionnels (finding #8, #16)
  - [ ] Pas de `<nav aria-label>` (finding #16)
  - [ ] Contraste `#CCC5BD` à vérifier (finding #10)

- [ ] **CartDrawer** (`src/components/CartDrawer.tsx`)
  - [ ] Pas de `role="dialog"` / `aria-modal` (finding #3)
  - [ ] Pas d'Escape / focus trap / restauration focus (finding #3)
  - [ ] Bouton "Procéder au paiement" disabled sans annonce de la raison
  - [ ] Loading spinner sans `role="status"` (finding #7)
  - [x] Bouton close a `aria-label="Fermer le panier"`
  - [x] Bouton remove a `aria-label` dynamique

- [ ] **CartIcon** (`src/components/CartIcon.tsx`)
  - [ ] `focus:outline-none` (finding #2)
  - [ ] Badge total panier non annoncé dynamiquement (pourrait avoir `aria-live="polite"`)
  - [x] `aria-label="Ouvrir le panier"`

- [ ] **ProductCard** (`src/components/ProductCard.tsx`)
  - [x] `<article>` sémantique
  - [x] Alt text avec fallback `product.name`
  - [ ] `<h2>` dans la card mais le contexte de page peut nécessiter `<h3>`
  - [ ] Pas de label sur badges brand/range (lecteur d'écran lit "ROCHE-POSAY")
  - [ ] `AddToCartButton` à l'intérieur du `<Link>` : conflit cliquable (double action, vraie source de bug a11y)

- [ ] **ProductClient** (`src/components/ProductClient.tsx`)
  - [ ] Boutons +/− sans `aria-label` (finding #12)
  - [ ] Galerie images non cliquable au clavier (finding #12)
  - [ ] `<img>` natif au lieu de `next/image` (finding #12)
  - [x] `<h1>` correct

- [ ] **ProductDetailCard** (`src/components/ProductDetailCard.tsx`)
  - [ ] Boutons +/− sans `aria-label` (similaire au finding #12)
  - [x] `next/image` utilisé, `alt="Image de {nom}"` (préférer juste le nom)
  - [x] `<h1>` présent

- [ ] **CatalogueClient** (`src/components/CatalogueClient.tsx`)
  - [x] Recherche : `aria-label="Rechercher un produit"`, SVG `aria-hidden="true"`
  - [x] Pagination : `<nav aria-label="Pagination">`, `aria-current="page"`
  - [ ] `focus:outline-none` partout (finding #2)
  - [ ] Aucun "résultats X produits trouvés" avec `aria-live` (finding #6)

- [ ] **Filters** (`src/components/Filters.tsx`)
  - [ ] Checkboxes/radios masquées sans focus visible (finding #14)
  - [ ] Boutons d'expand sans `aria-expanded` / `aria-controls`
  - [ ] `focus:outline-none` (finding #2)

- [ ] **FiltersNew** (`src/components/FiltersNew.tsx`)
  - [ ] Mêmes problèmes que Filters (semble être une version legacy non utilisée)
  - [ ] Pas de `aria-expanded` sur boutons accordéon
  - [ ] Pas de `focus:outline-none` non plus, mais sans alternative

- [ ] **ContactForm** (`src/components/ContactForm.tsx`)
  - [x] `htmlFor` + `id` correctement associés
  - [x] `*` indique champs obligatoires
  - [ ] Notifications succès/erreur sans `role="status"` / `role="alert"` (finding #6)
  - [ ] Pas de `aria-describedby` pour les aides (finding #17)
  - [ ] SVG icônes input sans `aria-hidden="true"`
  - [ ] Bouton submit avec spinner sans `aria-busy`/`role=status` (finding #7)

- [ ] **AddToCartButton** (`src/components/AddToCartButton.tsx`)
  - [ ] Pas de `aria-live` pour le passage "Ajout..." → "Ajouté !" (finding #6)
  - [ ] Pas de `aria-label` qui inclue le nom du produit (un screen reader entend juste "Ajouter au panier")
  - [ ] Pas de `aria-busy={isAdding}`

- [ ] **Banner** (`src/components/Banner.tsx`)
  - [ ] Image décorative dans certains layouts : `alt={title}` redondant avec le `<h3>` adjacent
  - [ ] `<h3>` utilisé hors hiérarchie cohérente (finding #9)
  - [ ] SVG flèche dans CTA sans `aria-hidden="true"`
  - [ ] `onView` callback dans useEffect : aucun impact a11y

- [ ] **Login page** (`src/app/(auth)/login/page.tsx`)
  - [x] `htmlFor`/`id` associés
  - [x] `autoComplete="email"`, `"current-password"`
  - [ ] Erreur/succès sans `role="alert"` / `aria-live` (finding #6)
  - [ ] Bouton "Se connecter" contraste insuffisant (finding #10)
  - [ ] `<h2>` au lieu de `<h1>` (finding #9)
  - [ ] Lien "Mot de passe oublié ?" `href="#"` (placeholder cassé)
  - [ ] Suspense fallback `<div>Chargement…</div>` sans `role="status"`

- [ ] **Signup page** (`src/app/(auth)/signup/page.tsx`)
  - [x] Tous les `htmlFor`/`id` associés, autocomplete correctes
  - [ ] Mêmes problèmes que login (finding #6, #9, #10)
  - [ ] Apostrophe française manquante : `S'inscrire` (ligne 315) — risque syntaxe JSX (parse via `'`)
  - [ ] `birth_date` champ sans aide (format attendu non documenté)

- [ ] **Admin layout** (`src/app/admin/layout.tsx`)
  - [ ] Liens icônes sans `aria-label` quand sidebar réduite (finding #18)
  - [ ] Pas de `aria-current="page"` (finding #18)
  - [ ] `<nav>` sans `aria-label` (finding #18)
  - [ ] Spinner "Vérification des permissions…" sans `role="status"` (finding #7)

- [ ] **Admin product page** (`src/app/admin/product/page.tsx`)
  - [ ] Modal sans `role="dialog"`/Escape (finding #4)
  - [ ] Labels sans `htmlFor` (finding #11)
  - [ ] `alert()` natif pour erreurs (UX dégradée)
  - [ ] Boutons d'action (Pencil, Trash) ont `title` mais pas `aria-label`
  - [ ] Table sans `<caption>`, sans `scope="col"` sur `<th>`

- [ ] **Admin tags page** (`src/app/admin/tags/page.tsx`)
  - [ ] 2 modales sans gestion accessible (finding #4)
  - [ ] Labels sans `htmlFor` (finding #11)
  - [ ] Sélecteurs d'icônes : boutons sans `aria-pressed` ni `aria-label` (juste `title`)
  - [ ] Sélecteurs de couleur : boutons `<button style={{ backgroundColor: color }} />` sans `aria-label="Couleur bleu"` ni texte

- [ ] **Admin marques page** (`src/app/admin/marques/page.tsx`)
  - [ ] Modales sans gestion accessible (finding #4)
  - [ ] Labels sans `htmlFor` (finding #11)
  - [ ] Boutons expand/collapse marque sans `aria-expanded`

- [ ] **Home page** (`src/app/page.tsx`)
  - [ ] Pas de `<h1>` (finding #9)
  - [ ] La 3e carte "Consultation" est un `<div cursor-pointer>` non interactif au clavier (idem finding #8)
  - [ ] Pas de skip link (finding #5)

- [ ] **Catalogue page** (`src/app/catalogue/page.tsx`)
  - [ ] Pas de `<h1>` (le titre est implicite)
  - [ ] Pas de skip link (finding #5)
  - [ ] "Erreur de chargement" sans `role="alert"`

- [ ] **Contact page** (`src/app/contact/page.tsx`)
  - [x] `<h1>Contactez-nous</h1>` présent
  - [ ] Doublon avec `<h2>Contactez-nous</h2>` du ContactForm (finding #9)
  - [x] iframe Google Maps a un `title`
  - [ ] Lien WhatsApp ouvre nouvelle fenêtre sans annonce (finding #15)
  - [ ] Pas de skip link (finding #5)

---

## Recommandations prioritaires

### Sprint 1 — Blockers critiques (1-2 jours)

1. **Corriger `lang="fr"`** dans `src/app/layout.tsx:31` — 1 ligne de code, impact immédiat sur tous les utilisateurs de lecteur d'écran et la SEO.
2. **Remplacer tous les `focus:outline-none`** par `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600`. Faire un search/replace global (~50 occurrences). Corriger aussi `globals.css:45` (sélecteur `:focus-visible`).
3. **Ajouter un Skip Link** dans `layout.tsx` + `id="main-content"` sur tous les `<main>` (4 fichiers de pages).
4. **Corriger les contrastes critiques** : bouton "Se connecter" et lien "Créer un compte" sur login/signup. Choisir une teinte assombrie de `#CCC5BD` (cf. `#6B635A`).

### Sprint 2 — Forms et notifications (2-3 jours)

5. **Live regions** : envelopper toutes les notifications (succès/erreur/redirection/ajout panier) dans `<div role="status"|"alert" aria-live="polite"|"assertive">`. Faire un wrapper réutilisable `<StatusMessage>`.
6. **Spinners** : créer un composant `<Spinner label="Chargement"/>` avec `role="status"` et `sr-only` text. Migrer les 6+ occurrences.
7. **Labels admin** : ajouter `htmlFor`/`id` sur les ~15 paires label/input des modales admin.

### Sprint 3 — Modales et navigation (3-5 jours)

8. **Composant `<Modal>` accessible** (idéalement Radix Dialog) avec focus trap, Escape, `role="dialog"`, `aria-modal`, restauration de focus. Migrer :
   - CartDrawer
   - 2 modales `admin/product`
   - 4+ modales `admin/tags` / `admin/marques`
9. **Filtres** : ajouter `peer-focus-visible:ring-2` sur les checkbox custom + `aria-expanded`/`aria-controls` sur les boutons accordéon.
10. **Dropdown langue** : utiliser `@radix-ui/react-dropdown-menu` ou supprimer si non implémenté.

### Sprint 4 — Sémantique et structure (2-3 jours)

11. **Hiérarchie de titres** : audit complet, ajouter `<h1>` à chaque page (visuellement caché si nécessaire), normaliser `Banner.tsx` avec un prop `headingLevel`.
12. **Footer** : convertir les `<li>` texte en `<li><Link>`, ajouter `<nav aria-label>` et `<a>` sur les icônes sociales.
13. **Tableaux admin** : ajouter `<caption>`, `scope="col"` sur les `<th>`, et `aria-label` sur les boutons d'action icônes.

### Sprint 5 — Tests automatisés (recommandé)

14. Intégrer **axe-core** ou **@axe-core/react** en dev pour détecter régressions.
15. Ajouter tests Playwright avec `@axe-core/playwright` sur les routes critiques (/, /catalogue, /product/[id], /contact, /login, /signup).
16. Étendre la checklist manuelle clavier (Tab/Shift+Tab/Escape/Enter) sur les flux : panier, achat, recherche, filtre, formulaire de contact.

### Outils suggérés

- **axe DevTools** (extension navigateur)
- **WAVE** (WebAIM)
- **Lighthouse a11y audit** (Chrome DevTools)
- **NVDA** (Windows, gratuit) ou **VoiceOver** (macOS) pour tester
- **Stark** ou **WebAIM Contrast Checker** pour contrastes
- **focus-trap-react** ou **@radix-ui/react-dialog** pour les modales
- **eslint-plugin-jsx-a11y** (à activer en CI)

### Effort estimé total

| Sprint | Effort | Impact |
|--------|--------|--------|
| 1 (Blockers) | 1-2 j | +20 pts → 58/100 |
| 2 (Forms) | 2-3 j | +10 pts → 68/100 |
| 3 (Modales) | 3-5 j | +12 pts → 80/100 |
| 4 (Sémantique) | 2-3 j | +8 pts → 88/100 |
| 5 (Tests) | 2 j | Garde-fou pérenne |

**Total : 10-15 jours pour atteindre une conformité WCAG 2.1 AA satisfaisante (~88%)**, avec un investissement initial très rentable (Sprint 1 = 20 points en 2 jours).
