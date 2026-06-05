# WS19 — Admin Blog + Apparence + Éditeurs

**Périmètre** : `src/app/admin/blog/page.tsx`, `src/app/admin/apariencia/page.tsx`, `src/components/admin/blog/BlogClient.tsx`, `src/components/admin/RichTextEditor.tsx`, `src/components/admin/ImageUploadField.tsx`, `src/components/admin/ConfirmDialog.tsx`
**Fichiers lus** : 14 (6 périmètre + 8 dépendances : `useModalA11y`, `uploadImage`, `/api/admin/upload`, `/api/admin/posts`, `/api/admin/appearance`, `themes.ts`, `schemas.ts`, `getThemeConfig`, blog public `[slug]`/index, `BlogPostJsonLd`)
**Lignes parcourues (approx.)** : ~1 500
**Synthèse** : P0=0 · P1=0 · P2=4 · P3=5

> Verdict d'entrée sur la **surface XSS** (focus du brief) : **bien défendue**. Défense en profondeur réelle : (1) l'éditeur est Tiptap v3 (pas de `contentEditable` brut ni `document.execCommand`), pas de collage/saisie de HTML arbitraire ; (2) l'extension `@tiptap/extension-link` 3.23.6 embarque `isAllowedUri`/`allowedProtocols`/`defaultProtocol` (bloque `javascript:` par défaut) ; (3) l'upload valide les **magic-bytes** côté serveur ; (4) le rendu public passe par `DOMPurify.sanitize(post.body)` (`blog/[slug]/page.tsx:113`), seul site qui injecte `body` en `dangerouslySetInnerHTML`. L'index blog n'utilise que `title`/`excerpt`. Aucun vecteur XSS stocké exploitable trouvé.

## Findings

### [WS19-01] Focus-trap mort dans le modal Blog : `dialogRef` retourné par `useModalA11y` jamais attaché — P2
- **Fichier** : `src/components/admin/blog/BlogClient.tsx:63` (appel) + `:220-224` (dialog sans `ref`)
- **Catégorie** : a11y
- **Constat** : `useModalA11y(modalOpen, closeModal)` est appelé en mode « void » (sa valeur de retour, le `dialogRef`, est ignorée). Le `<div role="dialog" aria-modal="true">` (l.220) ne reçoit **aucun** `ref`. Or `useModalA11y` ne pose le focus initial et ne piège le Tab **que** si `dialogRef.current` est non-null (cf. `useModalA11y.ts:35` et `:53` `if (e.key !== 'Tab' || !dialog) return`). Résultat : dans ce modal, **seuls** le scroll-lock du body et la touche Escape fonctionnent ; le **focus n'entre pas** dans le dialog à l'ouverture et **Tab s'échappe** vers les contrôles de fond (liste des posts, bouton « Nouvel article »). C'est exactement le piège noté au brief (WS29) — confirmé concret ici. (Note : `closeModal` est bien mémoïsé via `useCallback([])` l.57-61, donc **pas** de churn de re-trap — ce point-là est sain.)
- **Impact** : modal d'édition d'article non accessible au clavier/lecteur d'écran (WCAG 2.4.3 / 2.1.2). Le dialog n'est pas `aria-labelledby` (le `<h2>` l.226 n'a pas d'`id` lié), donc le titre n'est pas annoncé non plus.
- **Reco** : `const dialogRef = useModalA11y(modalOpen, closeModal)` puis `ref={dialogRef}` + `tabIndex={-1}` sur le `<div role="dialog">` (l.220), et `aria-labelledby` pointant vers un `id` ajouté au `<h2>`. Aligner sur le pattern documenté dans le JSDoc de `useModalA11y` (et déjà respecté par `ConfirmDialog.tsx:100`).
- **Confiance** : haute

### [WS19-02] Suppression d'article sans confirmation (destructif, irréversible, en 1 clic) — P2
- **Fichier** : `src/components/admin/blog/BlogClient.tsx:124-136` (`handleDelete`) + `:205-210` (bouton)
- **Catégorie** : bug / logique-métier
- **Constat** : le bouton « Supprimer » appelle directement `handleDelete(post)` → `DELETE /api/admin/posts` (hard-delete SQL `delete().eq('id', id)`, `posts/route.ts:120`). Aucun garde-fou : pas de `useConfirmDialog`, pas de `window.confirm`. Le reste de l'admin utilise systématiquement `useConfirmDialog` pour les actions destructives (`reservations`, `product`, `tags`, `marques`, `messages` — vérifié par grep). Le blog est la seule surface admin qui supprime sans confirmation.
- **Impact** : un clic accidentel détruit définitivement un article publié (perte de contenu, et 404 si l'URL était indexée/partagée). Incohérence UX avec le reste de l'admin.
- **Reco** : brancher `useConfirmDialog()` (déjà présent dans le repo, `ConfirmDialog.tsx`) avec `tone: 'danger'` avant l'appel DELETE, comme dans `reservations/page.tsx`.
- **Confiance** : haute

### [WS19-03] Schéma Zod `posts` : aucune borne de longueur et `slug` non validé en format — P2
- **Fichier** : `src/lib/schemas.ts:193-216` (`postCreate` / `postUpdate`)
- **Catégorie** : data / sécurité
- **Constat** : `title`/`slug` n'ont que `.min(1)` ; `body`/`excerpt`/`author_name`/`cover_image_url` sont des `z.string()` **sans `.max()`**. Contraste net avec `ticketCreate`/`messagePatch` qui plafonnent à 200/4000 (`schemas.ts:124,131-135`). De plus, `slug` n'a **aucune** validation de forme : on peut enregistrer un slug avec espaces, `/`, accents, ce qui casse la route publique `/blog/[slug]` (route literale Supabase `.eq('slug', slug)`) et la canonical SEO. `cover_image_url` est un `z.string()` libre (pas `.url()`), réinjecté tel quel dans `<Image src>` (`blog/[slug]/page.tsx:82`) et dans le JSON-LD `image` (`BlogPostJsonLd.tsx:36`).
- **Impact** : un admin (ou une session admin compromise) peut stocker un `body` arbitrairement volumineux (DoS stockage / payload de page), ou un `slug` cassant la résolution d'URL. Risque réel mais **borné par l'auth admin** (pas d'entrée publique) → P2, pas P1.
- **Reco** : ajouter `.max()` raisonnables (ex. `title` 200, `excerpt` 500, `body` ~50 000, `author_name` 160) et valider `slug` par regex (`/^[a-z0-9-]+$/`) ou re-dériver via `generateSlug` côté serveur. Optionnellement `cover_image_url: z.string().url().nullish()`.
- **Confiance** : haute

### [WS19-04] `apariencia` : pas de re-fetch on-focus ni de retry sur erreur réseau du save — P2
- **Fichier** : `src/app/admin/apariencia/page.tsx:31` (`revalidateOnFocus: false`) + `:75-80` (catch)
- **Catégorie** : bug / a11y
- **Constat** : (a) le SWR est en `revalidateOnFocus: false` ; si deux admins éditent l'apparence, l'écran reste sur une valeur périmée sans signal. (b) En cas d'échec réseau du PATCH (catch l.75), on affiche un toast mais l'état local reste « dirty » sans aucune indication persistante ni mécanisme de retry hors re-clic. (c) L'état d'erreur du fetch initial (l.106-109) n'offre pas de bouton « réessayer » (juste un message). Mineur mais c'est l'unique écran de config visuelle globale du site.
- **Impact** : risque d'écraser une modif concurrente / friction en cas de réseau instable. Faible occurrence (1 admin en pratique).
- **Reco** : tolérable en l'état ; à minima ajouter un bouton « Réessayer » sur l'état d'erreur (l.107) et envisager `revalidateOnFocus` à `true`.
- **Confiance** : moyenne

### [WS19-05] Dates affichées via `toLocaleDateString()` sans locale → locale du navigateur, pas de l'admin — P3
- **Fichier** : `src/components/admin/blog/BlogClient.tsx:195` + `src/app/admin/apariencia/page.tsx:200`
- **Catégorie** : i18n
- **Constat** : `new Date(...).toLocaleDateString()` (sans 1er argument) formate selon la locale **du runtime navigateur**, alors que l'admin est localisé via le cookie `farmau_admin_locale` (FR/ES/EN). Un admin en interface ES sur un navigateur en-US verra des dates au format US. Incohérent avec les pages publiques qui passent explicitement `locale` (`blog/[slug]/page.tsx:100`).
- **Impact** : format de date incohérent avec la langue choisie dans l'admin. Cosmétique.
- **Reco** : passer la locale courante (`useLocale()` de next-intl) en 1er argument, ou utiliser `next-intl` `format.dateTime`.
- **Confiance** : haute

### [WS19-06] `ALLOWED_IMAGE_TYPES` inclut `image/jpg` mais `IMAGE_ACCEPT` ne le liste pas — incohérence mineure — P3
- **Fichier** : `src/lib/uploadImage.ts:11` vs `:13`
- **Catégorie** : dette
- **Constat** : `ALLOWED_IMAGE_TYPES` = `['image/png','image/jpeg','image/jpg','image/webp']` (valide côté JS), mais `IMAGE_ACCEPT` (attribut `accept` du `<input>`) = `'image/png,image/jpeg,image/webp'` (sans `image/jpg`). `image/jpg` n'est de toute façon pas un MIME standard et n'apparaît jamais réellement. Sans impact (la branche serveur `EXT_BY_TYPE` mappe quand même `image/jpg`), mais c'est du bruit/incohérence entre listes censées « rester alignées » (commentaire l.7-8).
- **Impact** : aucun runtime ; risque de divergence future.
- **Reco** : retirer `image/jpg` de `ALLOWED_IMAGE_TYPES` (non-standard) pour aligner les 3 listes (ici + `EXT_BY_TYPE`/`sniffImageType` dans la route).
- **Confiance** : haute

### [WS19-07] Modal Blog : overlay et dialog rendus dans un conteneur sans le pattern Scrim/PopClose partagé — P3
- **Fichier** : `src/components/admin/blog/BlogClient.tsx:217-326`
- **Catégorie** : dette / a11y
- **Constat** : le modal réimplémente à la main backdrop (`<div onClick={closeModal}>`) + bouton de fermeture `&times;` (l.229-231, sans `aria-label`) au lieu de réutiliser `ui/Scrim` + `ui/PopClose` (documentés au CLAUDE.md comme primitives partagées pour drawers/modales). Le bouton `×` n'a pas de libellé accessible. Combiné à WS19-01, l'a11y du modal est globalement en retrait du reste de l'admin.
- **Impact** : incohérence design-system + bouton de fermeture non étiqueté pour lecteurs d'écran.
- **Reco** : migrer vers `Scrim`/`PopClose` et ajouter `aria-label={t('cancel')}` au bouton `×`.
- **Confiance** : moyenne

### [WS19-08] `RichTextEditor` : `linkPrompt`/`window.prompt` pour les liens (UX rudimentaire, pas de validation d'URL côté UI) — P3
- **Fichier** : `src/components/admin/RichTextEditor.tsx:89-97`
- **Catégorie** : dette / a11y
- **Constat** : la pose de lien utilise `window.prompt()` (bloquant, non stylé, non i18n-cohérent avec les toasts), et n'effectue aucune validation/normalisation d'URL côté UI — on s'en remet à `isAllowedUri` de Tiptap (qui bloque `javascript:`) + DOMPurify au rendu. C'est **sûr** (cf. note d'entrée), mais l'UX est minimale et `prompt` est déconseillé. Le `defaultProtocol` n'étant pas configuré, un lien sans schéma (`exemple.com`) peut être interprété comme relatif.
- **Impact** : UX faible, liens potentiellement relatifs involontaires. Pas de risque de sécurité.
- **Reco** : remplacer `prompt` par un petit popover/champ inline ; passer `defaultProtocol: 'https'` à l'extension Link.
- **Confiance** : moyenne

### [WS19-09] `apariencia` : couleur d'aperçu codée en dur (`rgba(184,111,74,.12)`) hors système de thème — P3
- **Fichier** : `src/app/admin/apariencia/page.tsx:128`
- **Catégorie** : dette
- **Constat** : le `boxShadow` de la carte de thème sélectionnée utilise un RGBA littéral (la teinte clay/Terra) au lieu d'un token `--c-*`/`clay`. Sur les 5 autres thèmes (Noir, Marino…), le halo de sélection reste teinté « Terra ». Anecdotique (les `swatches` viennent bien de `themes.ts`), mais c'est une valeur hors-système dans l'écran… de gestion du système de thème.
- **Impact** : halo de sélection légèrement off-palette selon le thème actif. Cosmétique.
- **Reco** : dériver depuis `th.swatches[2]` (accent du thème) ou un token thémé.
- **Confiance** : haute

## Points positifs (court)
- **Surface XSS solide** : Tiptap (pas de HTML brut), Link avec `rel="noopener noreferrer nofollow"` + `isAllowedUri`, upload **magic-bytes** côté serveur (`upload/route.ts:23-28,69`), chemin serveur en `crypto.randomUUID()` (anti-traversée), et `DOMPurify.sanitize` au rendu public. Défense en profondeur réelle.
- **i18n impeccable** : toutes les clés `Admin.{editor,upload,blog,appearance}` référencées existent et sont à **parité parfaite FR/ES/EN** (editor=12, upload=8, blog=26, appearance=20) — zéro clé manquante (vérifié programmatiquement).
- **API blog** : toutes les méthodes `requireAdmin()` + Zod (`postCreate/postUpdate/postDelete`), gestion propre du `23505` (slug dupliqué → 409), `published_at` auto-renseigné à la publication, pagination.
- **`ImageUploadField`** : erreurs `UploadError` typées (type/size/server) → toasts localisés, validation client+serveur, reset de l'input après upload, états de chargement soignés.
- **`getThemeConfig`/appearance** : invalidation `revalidateTag` au save, `globalMutate('/api/theme')` pour le live, `updated_by` tracé (colonne existe), client anon sans cookies (préserve le SSG) — architecture thème cohérente avec la doc.
- **`ConfirmDialog`** attache correctement `dialogRef` + `aria-labelledby`/`aria-describedby` + `tabIndex={-1}` (le bon pattern — contraste avec le modal Blog).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `ConfirmDialog.tsx:76` reçoit `onCancel` = closure recréée à chaque render (`useConfirmDialog` l.47) → `useModalA11y` re-exécute son effet (re-trap) à chaque rendu du parent ; territoire WS29 (hook a11y), pas un défaut du blog/apparence.
- `ConfirmDialog` utilise des `id` fixes (`confirm-dialog-title/message`) → collision DOM si deux dialogs montés simultanément (improbable, un seul à la fois).
- Blog index `blog/page.tsx:63` & `:71` utilisent `bg-white` littéral (pas tokenisé) → pas dark-mode-ready (WS thème/public).

## Zones non couvertes / à re-vérifier humainement
- Comportement réel du focus-trap (WS19-01) et de la suppression sans confirm (WS19-02) à valider en navigateur ; je n'ai pas exécuté l'UI.
- Le flux upload réel (réponse `/api/admin/upload` → bucket `product-image` public) n'a pas été testé live ; analyse statique uniquement.
- Confirmation que le bucket `product-image` n'autorise pas le service de SVG/HTML malgré le filtre magic-bytes (policy Storage / `allowed_mime_types`) → relève de WS Storage/RLS, pas de ce périmètre.
