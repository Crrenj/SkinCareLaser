# WS25 — Sécurité : validation d'entrée / injection / XSS

**Périmètre** : `src/lib/schemas.ts`, `src/lib/uploadImage.ts`, `src/app/api/admin/upload/route.ts`, `src/app/api/search/route.ts`, rendu du HTML blog (`src/app/[locale]/blog/[slug]/page.tsx` + `isomorphic-dompurify`), `src/components/admin/RichTextEditor.tsx`, `src/components/admin/ImageUploadField.tsx`, `src/components/admin/blog/BlogClient.tsx`, tous les `dangerouslySetInnerHTML` (grep `src/`), couverture Zod de **toutes** les routes `/api/*` (38 routes), helpers `csrf.ts` + `rateLimit.ts` + `requireAdmin.ts`, sinks d'injection (ilike, PostgREST, cookies, href).
**Fichiers lus** : ~28 · **Lignes parcourues (approx.)** : ~2 100
**Synthèse** : P0=0 · P1=0 · P2=2 · P3=5

> Verdict d'ensemble : le périmètre validation/XSS est **solide**. La seule faille de classe « stocké/XSS » (corps de blog) est correctement assainie (DOMPurify 3.4.7, défaut sûr). Aucune injection exploitable. Les défauts restants sont des **gaps de validation sur routes admin-only** (donc faible exploitabilité) et de la défense-en-profondeur manquante.

## Findings

### [WS25-01] `/api/admin/products` POST/PATCH : validation Zod contournée + mass-assignment — P2
- **Fichier** : `src/app/api/admin/products/route.ts:79-83,130-136` · `src/app/api/admin/products/[id]/route.ts:17-19,64-71`
- **Catégorie** : sécurité / logique-métier
- **Constat** : Au POST, `parseBody(productCreate, body)` est appelé (l.80) **mais le résultat `parsed.data` est ignoré** : le code destructure ensuite depuis le `body` **brut** (l.83) et insère `...productData` brut en DB (l.133). Le schéma `productCreate` est en plus déclaré `.passthrough()` (`schemas.ts:171`), donc même s'il était utilisé il laisserait passer toute clé inconnue. Au PATCH (`[id]/route.ts`), il n'y a **aucune** validation Zod : `body` brut est lu (l.17), destructuré, puis `...updateData` est spread directement dans `.update()` (l.68). Conséquence : un admin peut écrire **n'importe quelle colonne** de `products` (`id`, `created_at`, `sold_30d`, `currency` non-DOP, `stock` négatif via un type inattendu, etc.) — la validation de bornes/types du schéma ne s'applique jamais au chemin d'écriture.
- **Impact** : Risque d'intégrité de données (champs système écrasables) et 500 silencieux sur type invalide. Exploitabilité **faible** (routes `requireAdmin()`-only, admin de confiance), mais c'est une régression réelle de l'intention « toutes les routes admin validées Zod » (CLAUDE.md) — la validation est purement décorative ici.
- **Reco** : Utiliser `parsed.data` (et non `body`) comme source d'écriture, retirer `.passthrough()` de `productCreate` au profit d'une allowlist explicite des colonnes éditables (`name`, `slug`, `description`, `price`, `volume`, `benefits`, `inci`, `usage`, `pharmacist_*`, `skin_type`, `texture`, `old_price`, `is_new`, `is_featured`, `is_active`, `stock`, `currency`…), et écrire un schéma `productUpdate` (champs optionnels) pour le PATCH. Aligner sur le pattern correct déjà utilisé par `brands`/`ranges`/`tags`/`banners`/`posts` (qui lisent bien `parsed.data`).
- **Confiance** : haute

### [WS25-02] `/api/cart` POST/PATCH : `productId`/`quantity` non strictement validés — P2
- **Fichier** : `src/app/api/cart/route.ts:173-181,253-261`
- **Catégorie** : bug / data
- **Constat** : Les handlers lisent `body` brut (typé `AddToCartRequest` mais le JSON est non fiable) et ne valident que `!productId || quantity <= 0`. `quantity` n'est jamais contraint à un **entier** ni borné par un max (le `MAX_CART_QUANTITY` de `constants.ts` n'est pas appliqué) : un `quantity` flottant (`1.5`) ou une string (`"3"`, qui passe `"3" <= 0 === false` par coercition JS) franchit le contrôle, puis le test stock `(product.stock ?? 0) < quantity` s'appuie aussi sur une comparaison coercée, et la quantité est écrite telle quelle (`add_to_cart` / `.update({ quantity })`). `productId` n'est pas validé comme UUID (passé directement à `.eq('id', productId)` + RPC).
- **Impact** : Quantités non entières/non bornées persistables en panier → totaux incohérents, lignes de panier dégradées. Pas d'injection (PostgREST paramétré) ni d'IDOR (cart_id dérivé côté serveur). Impact modéré, sur un flux cœur.
- **Reco** : Schéma Zod `cartItemBody = z.object({ productId: z.string().uuid(), quantity: z.number().int().positive().max(MAX_CART_QUANTITY) })` partagé POST/PATCH via `parseBody`. Conserver le check stock après.
- **Confiance** : haute

### [WS25-03] HTML blog : DOMPurify en config par défaut, sans allowlist explicite ni durcissement `target` — P3
- **Fichier** : `src/app/[locale]/blog/[slug]/page.tsx:113`
- **Catégorie** : sécurité (défense en profondeur)
- **Constat** : `DOMPurify.sanitize(post.body)` utilise la **configuration par défaut**. C'est sûr dans l'absolu (DOMPurify 3.4.7 strippe `<script>`, handlers `on*`, et les protocoles dangereux `javascript:`/`data:` dans les `href` — donc le scénario d'un lien `javascript:` saisi via `RichTextEditor.toggleLink()` (cf. WS25-05) est neutralisé au rendu). Mais : (a) aucune allowlist `ALLOWED_TAGS`/`ALLOWED_ATTR` n'est posée → la surface autorisée par défaut (ex. `<iframe>`, `<form>`, `<svg>`/MathML selon profil) est plus large que ce que produit Tiptap (h2/h3, p, strong, em, ul/ol/li, blockquote, a, img) ; (b) DOMPurify par défaut **ne pose pas** `rel="noopener noreferrer"` sur un `<a target="_blank">` → reverse-tabnabbing (atténué car Tiptap ajoute déjà `rel` à la création, mais un corps importé/édité hors éditeur n'en bénéficie pas).
- **Impact** : Défense-en-profondeur incomplète sur du contenu admin. Faible (admin de confiance + DOMPurify sûr par défaut), mais un durcissement réduit la surface si l'éditeur évolue ou si du HTML est collé.
- **Reco** : Passer une config explicite : `DOMPurify.sanitize(post.body, { ALLOWED_TAGS: [...], ALLOWED_ATTR: ['href','src','alt','class','target','rel'] })` et un hook `afterSanitizeAttributes` qui force `rel="noopener noreferrer nofollow"` sur les `<a target="_blank">`. Factoriser dans `src/lib/sanitizeHtml.ts` pour réutilisation.
- **Confiance** : moyenne

### [WS25-04] Bannières : `title` (HTML) + `link_url` (href) admin non assainis au rendu public — P3
- **Fichier** : `src/lib/schemas.ts:74-111` (`bannerCreate`/`bannerUpdate`) · `src/components/banners/BannerEditorial.tsx:70,79` · `src/components/banners/BannerHero.tsx:57,66` · `src/app/[locale]/page.tsx:175`
- **Catégorie** : sécurité (défense en profondeur)
- **Constat** : `bannerCreate.title` est rendu via `dangerouslySetInnerHTML={{ __html: title }}` **sans DOMPurify** (BannerEditorial:70, BannerHero:57), et `link_url` (schéma `z.string().nullish()`, aucune validation d'URL/scheme) est mappé en `ctaHref` (page.tsx:175) puis injecté dans `<Link href={ctaHref}>`. Un `title` contenant `<img onerror>` ou un `link_url` `javascript:…` serait stocké et rendu sur la **home publique**. Contenu admin-authored uniquement → pas de vecteur d'auto-XSS pour un visiteur.
- **Impact** : Stored-XSS théorique mais **auto-infligé par l'admin** (surface admin-only) ; reverse-tabnabbing/redirect si `link_url` pointe ailleurs. Faible.
- **Reco** : Assainir `title` via le helper DOMPurify proposé en WS25-03 (les bannières n'ont besoin que de `<em>`). Valider `link_url` en `z.string().url()` ou restreindre aux chemins relatifs/`https:` (`z.string().regex(/^(\/|https:\/\/)/)`).
- **Confiance** : moyenne

### [WS25-05] `RichTextEditor.toggleLink` : href saisi sans validation de scheme — P3
- **Fichier** : `src/components/admin/RichTextEditor.tsx:95-96`
- **Catégorie** : sécurité (défense en profondeur)
- **Constat** : `const url = window.prompt(...)`; `editor.chain().focus().setLink({ href: url.trim() })` — aucun contrôle de scheme. Un `javascript:alert(1)` est accepté et stocké dans `posts.body`. Neutralisé au rendu par DOMPurify (WS25-03), mais devrait être bloqué à la source.
- **Impact** : Crée du HTML « sale » qui ne dépend que de DOMPurify pour rester inoffensif. Faible.
- **Reco** : Rejeter à la saisie tout href dont le scheme n'est pas `http(s):`/`mailto:`/relatif (un simple test regex avant `setLink`).
- **Confiance** : haute

### [WS25-06] `/api/admin/settings` PATCH : champs texte sans borne de longueur — P3
- **Fichier** : `src/app/api/admin/settings/route.ts:66-95`
- **Catégorie** : data / dette
- **Constat** : Allowlist correcte (`TEXT_FIELDS`) + coercition `String()`, mais aucune limite de taille (`shop_name`, `pickup_address`, `pickup_hours`…). Pas de validation Zod (lecture `body` brut typé `Record<string, unknown>`). Admin-only.
- **Impact** : Un admin pourrait stocker des chaînes très longues (rendu plain-text → pas d'XSS). Risque négligeable.
- **Reco** : Schéma Zod `settingsPatch` avec `.max(...)` sur chaque champ ; cohérence avec les autres routes admin.
- **Confiance** : haute

### [WS25-07] `/api/wishlist` POST : `product_id` non validé en UUID — P3
- **Fichier** : `src/app/api/wishlist/route.ts:53-56`
- **Catégorie** : dette
- **Constat** : `product_id` validé seulement « non vide ». RLS + FK couvrent l'intégrité (un id invalide → erreur DB), mais une validation UUID en amont éviterait un round-trip et un 500 inutile.
- **Impact** : Négligeable (auth required, RLS).
- **Reco** : `z.object({ product_id: z.string().uuid() })`.
- **Confiance** : haute

## Points positifs (court)
- **Upload durci correctement** (`api/admin/upload/route.ts`) : `requireAdmin`, **vérification magic-bytes** (`sniffImageType`) en plus du `contentType` déclaré (défense contre `.html`/`.svg` déguisé), taille max 5 Mo, **nom de fichier généré côté serveur** (`crypto.randomUUID()`) → zéro path-traversal, zéro réutilisation du nom client. Double validation client (`uploadImage.ts`) + serveur. Pas de fetch d'URL distante → pas de SSRF.
- **Recherche `ilike` correctement échappée** (`api/search/route.ts:89`) : métacaractères LIKE `% _ \` neutralisés ; `limit` borné `[1,20]` ; commentaire pertinent (PostgREST couvre l'injection SQL, seuls les wildcards LIKE sont à traiter). Aucune ReDoS (regex linéaire).
- **Stored-XSS blog réellement assaini** : DOMPurify 3.4.7 côté SSR (isomorphic), l'admin `BlogClient` ne re-rend jamais `post.body` en HTML brut (édité via Tiptap), Tiptap configure déjà `rel="noopener noreferrer nofollow"` + `target=_blank` sur les liens.
- **CSRF centralisée** : `requireAdmin`/`requireSuperAdmin` appellent `assertOriginFromHeaders` (toutes les routes admin, même GET) ; les routes publiques mutantes passent `guardMutation` (Origin + `Content-Type: application/json`). `requireSuperAdmin` protège la promotion d'admin avec garde-fous anti-self / anti-super_admin.
- **Rate-limit IP non spoofable** (`rateLimit.ts:56-70`) : utilise `x-vercel-forwarded-for` (posé par l'edge) puis le **dernier** hop de `x-forwarded-for` — le finding historique « 1er hop XFF spoofable » (Lanjo) est **corrigé**. Zod : `.email().max()`, bornes numériques, enums partout ; aucun `z.coerce` dangereux ; unknown-keys strippés par défaut (sauf le `.passthrough()` de WS25-01).

## Signalements hors périmètre (1 ligne chacun, max 5)
- Open-redirect login (`redirectedFrom`/`next`) : non audité ici, possède son WS (WS23) — à vérifier dans l'état actuel.
- `THEME_MODE_SCRIPT` (`layout.tsx:70`, `dangerouslySetInnerHTML`) est une constante statique hashée SHA-256 pour la CSP — sûr ; la question `unsafe-eval` dans la CSP relève du WS CSP/headers.
- Tous les autres `dangerouslySetInnerHTML` du site (Home/About/FAQ/Footer/legal/JsonLd) rendent du `t.raw(...)` (messages i18n dev-controlled) ou `JSON.stringify(jsonLd)` — pas d'entrée utilisateur, hors scope XSS.
- `api/admin/products[/id]` lit aussi `imageFile` (base64) et l'upload en `image/png` codé en dur **sans** magic-bytes (contrairement à `/api/admin/upload`) — cohérence d'upload à signaler côté WS produits/admin.
- `/api/contact` GET reconstruit un client Supabase à partir du header `Authorization: Bearer` (l.87-95) au lieu du cookie SSR — pattern d'auth divergent, à recouper côté WS auth.

## Zones non couvertes / à re-vérifier humainement
- Comportement runtime exact de DOMPurify SSR sous Next 15 (jsdom d'`isomorphic-dompurify`) sur du HTML adverse — testé par lecture/version, pas exécuté. Recommander un test unitaire « le corps blog `<script>`/`<img onerror>`/`javascript:` est neutralisé ».
- Confirmer en base (MCP read-only non utilisé ici) qu'aucune colonne sensible de `products` n'a déjà été corrompue via le chemin WS25-01.
- Le rendu next-intl `<Link href="javascript:…">` (bannière) n'a pas été exécuté — Next/`<a>` pourrait le rendre tel quel ; à confirmer si WS25-04 est priorisé.
