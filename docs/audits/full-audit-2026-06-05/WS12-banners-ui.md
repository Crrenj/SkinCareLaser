# WS12 — Bannières + primitives UI + layout racine

**Périmètre** : `src/components/banners/{BannerEditorial,BannerHero,BannerQuote}.tsx`, `src/components/Banner.tsx`, `src/components/ui/{Plate,PopClose,Scrim}.tsx`, `src/components/brand/FarmauLogo.tsx`, `src/app/[locale]/not-found.tsx`, `src/app/[locale]/error.tsx`, `src/app/not-found.tsx`, `src/app/layout.tsx`
**Fichiers lus** : 11 (+ recoupements : `page.tsx` home, `getThemeConfig.ts`, `themeModeScript.ts`, `schemas.ts`, `api/admin/banners/route.ts`, `globals.css`, `i18n/navigation.ts`, `messages/{fr,en,es}.json`)
**Lignes parcourues (approx.)** : ~900 (périmètre) + ~600 (recoupements)
**Synthèse** : P0=0 · P1=1 · P2=4 · P3=6

## Findings

### [WS12-01] CTA de bannière cassé pour toute URL externe (next-intl Link préfixe la locale) — P1
- **Fichier** : `src/components/banners/BannerEditorial.tsx:78-79` · `src/components/banners/BannerHero.tsx:65-66` · construction du `ctaHref` dans `src/app/[locale]/page.tsx:171` (`ctaHref={banner.link_url || undefined}`)
- **Catégorie** : bug / logique-métier
- **Constat** : les deux bannières CTA utilisent `Link from '@/i18n/navigation'` (next-intl `createNavigation`), qui traite tout `href` comme un **chemin interne** et lui **préfixe la locale active**. Or `link_url` est saisi librement par l'admin (`/admin/annonce`) et validé seulement par `link_url: z.string().nullish()` (`src/lib/schemas.ts:78,98`) — aucune contrainte « chemin interne uniquement ». Si l'admin met une URL externe (cas plausible pour une « Hero/campagne » : `https://wa.me/...`, Instagram, site de marque), le rendu produit `/{locale}/https://wa.me/...` → lien mort. Aucune branche `if (isExternal)` n'utilise un `<a>` brut.
- **Impact** : tout CTA externe d'une bannière home est cassé en silence (404 interne). La bannière « Hero » est précisément l'emplacement où une campagne externe est attendue.
- **Reco** : dans `BannerEditorial`/`BannerHero`, détecter l'externe (`/^https?:\/\//` ou `mailto:`/`tel:`) et rendre un `<a href={ctaHref} target="_blank" rel="noopener noreferrer">` au lieu du `Link` next-intl ; sinon garder `Link`. Idéalement valider/normaliser `link_url` côté schéma (interne `^/` OU URL absolue http(s)).
- **Confiance** : haute

### [WS12-02] Titre de bannière injecté en HTML brut sans sanitisation (XSS stocké, admin-only) — P2
- **Fichier** : `src/components/banners/BannerEditorial.tsx:68-71` (`dangerouslySetInnerHTML={{ __html: title }}`) · `src/components/banners/BannerHero.tsx:55-58` (idem) · source non assainie : `src/lib/schemas.ts:75,95` (`title: z.string()`), persistance `src/app/api/admin/banners/route.ts`
- **Catégorie** : sécurité
- **Constat** : `title` est rendu via `dangerouslySetInnerHTML` (pour autoriser le pivot `<em>`) mais n'est **jamais assaini** : le schéma Zod accepte une string arbitraire, la route POST/PATCH la persiste telle quelle, et la home l'injecte. Le blog, lui, passe par `DOMPurify` (cf. `RichTextEditor.tsx:21`) — la bannière ne bénéficie pas de la même protection. Un `title` = `<img src=x onerror=alert(document.cookie)>` s'exécuterait sur la home publique pour **tous** les visiteurs. La surface d'écriture est `requireAdmin()` (`api/admin/banners/route.ts:45`), donc l'exploit suppose un admin malveillant/compromis — d'où P2, pas P0 — mais c'est aussi un **footgun** : un collage de contenu riche casse/défigure la home sans avertissement.
- **Impact** : XSS stocké servi sur la page la plus exposée du site si un compte admin est compromis ou hostile ; risque de défiguration en usage normal.
- **Reco** : assainir `title` avec une allowlist minimale (`<em>` seul) via `isomorphic-dompurify` (`ALLOWED_TAGS: ['em']`) soit côté écriture (route admin), soit au rendu dans les deux composants. La même remarque vaut pour `description` si elle devait un jour passer en HTML (actuellement rendue en texte — OK).
- **Confiance** : haute

### [WS12-03] Télémétrie `onView`/`onClick` morte + `data-banner-id` incohérent — P2
- **Fichier** : `src/components/Banner.tsx:37-38,47-51,69,82` (`onView`/`onClick` jamais passés) · `src/app/[locale]/page.tsx:158-181` (le seul consommateur ne câble ni `onView` ni `onClick`) · `data-banner-id` présent sur `BannerHero.tsx:37` et `BannerQuote.tsx:28` mais **absent** de `BannerEditorial.tsx`
- **Catégorie** : dette / archi
- **Constat** : (a) l'unique site d'usage (`<Banner …>` dans la home) ne fournit aucun callback, donc `useEffect(() => props.onView?.(props.id))` et les `onClick?.(id)` ne déclenchent jamais rien → `view_count`/`click_count` (colonnes `banners`) restent à 0 (confirmé : aucun `IntersectionObserver`/handler ne lit `data-banner-id`, grep `src/`). (b) `data-banner-id` n'a aucun consommateur (grep) et n'est posé que sur 2 des 3 sous-composants → attribut décoratif mort et asymétrique. La doc CLAUDE.md liste ce tracking comme « à wirer » — constat = écart non régressé mais code prêt à pourrir.
- **Impact** : faux signal de complétude (props de télémétrie laissent croire que c'est branché) ; KPI bannières inertes ; surface morte qui se désynchronise (Editorial sans l'attribut).
- **Reco** : soit brancher réellement le tracking (POST léger vers une route incrémentant `view_count`/`click_count`, IntersectionObserver lisant `data-banner-id`, et passer `onView`/`onClick` depuis la home), soit **retirer** `onView`/`onClick`/`data-banner-id` jusqu'à ce que le besoin existe. Au minimum, homogénéiser `data-banner-id` sur les 3.
- **Confiance** : haute

### [WS12-04] Pas de `global-error.tsx` : une erreur du root layout n'a pas de filet — P2
- **Fichier** : `src/app/[locale]/error.tsx` (existe) · `src/app/layout.tsx:52-91` (root layout async, appelle `getLocale()` + `getThemeConfig()`) · absence vérifiée de `src/app/global-error.tsx`
- **Catégorie** : bug / archi
- **Constat** : Next App Router n'attrape une erreur de rendu du **root layout** que via `app/global-error.tsx`. Ici il n'existe pas (seuls `[locale]/error.tsx` et `admin/error.tsx` existent), et un `error.tsx` de segment **ne couvre pas** le layout au-dessus de lui. `app/layout.tsx` fait du I/O réseau (`getThemeConfig` → Supabase) ; bien que `getThemeConfig` retourne un `DEFAULT` en cas d'erreur (catché), tout throw inattendu dans le layout (ou dans `getLocale()`) renverrait l'écran d'erreur Next par défaut, non stylé/non i18n, sans bouton « réessayer ».
- **Impact** : dégradation brutale (page blanche Next par défaut) pour les pannes les plus globales, alors qu'un `error.tsx` soigné existe pour le reste.
- **Reco** : ajouter `src/app/global-error.tsx` minimal (doit rendre ses propres `<html><body>`), réutilisant le visuel de `[locale]/error.tsx` en copie statique (pas d'i18n possible à ce niveau).
- **Confiance** : haute

### [WS12-05] `error.tsx` avale l'erreur (aucun log) — P3
- **Fichier** : `src/app/[locale]/error.tsx:6-31`
- **Catégorie** : dette / observabilité
- **Constat** : la prop `error: Error` est typée mais ni utilisée ni journalisée. Le projet a un `src/lib/logger.ts` (128 migrations console→logger). L'error boundary ne fait aucun `logger.error(error)` ni report — les erreurs runtime publiques disparaissent sans trace côté client.
- **Impact** : perte de diagnostic sur les crashes en prod (pas de signal, pas de `digest`).
- **Reco** : `useEffect(() => logger.error('[LocaleError]', error), [error])` (ou hook Sentry futur). Idem pour `admin/error.tsx` (hors périmètre, à signaler).
- **Confiance** : haute

### [WS12-06] Bannière « quote » sans `description` : eyebrow == citation (doublon visuel) — P3
- **Fichier** : `src/components/Banner.tsx:88-95`
- **Catégorie** : logique-métier / bug cas-limite
- **Constat** : pour `type:'quote'`, le dispatcher fait `eyebrow={props.eyebrow ?? props.title}` ET `title={props.description || props.title}`. Si l'admin ne remplit **ni** `eyebrow` **ni** `description` (seulement `title`), alors `BannerQuote` reçoit `eyebrow = title` et `title = title` → le même texte s'affiche en surtitre mono ET en citation serif. Le commentaire décrit l'intention (title=intitulé court, description=cita) mais rien ne garantit que les deux soient remplis.
- **Impact** : rendu dégradé/redondant sur une bannière mal remplie (cas réaliste vu l'UI admin libre).
- **Reco** : ne pas retomber sur `title` pour l'eyebrow quand `description` est absente (eyebrow = `props.eyebrow` seul), ou imposer `description` requise pour le type quote côté schéma/UI.
- **Confiance** : moyenne

### [WS12-07] `BannerHero` : `alt=""` sur image campagne even quand l'image porte le message — P3
- **Fichier** : `src/components/banners/BannerHero.tsx:41`
- **Catégorie** : a11y
- **Constat** : l'image hero est `alt=""` (décorative). C'est défendable car le titre est dans le DOM textuel à côté ; mais pour une **campagne** dont le visuel peut porter du texte/branding non répété dans `title`, un alt vide prive les lecteurs d'écran. `BannerEditorial` fait mieux (`alt={stripHtml(title)}`).
- **Impact** : a11y dégradée pour les hero porteurs d'info visuelle.
- **Reco** : utiliser `alt={stripHtml(title)}` (cohérent avec Editorial) ou exposer un champ alt dédié dans le schéma bannière.
- **Confiance** : moyenne

### [WS12-08] `not-found.tsx` racine : CTA en espagnol, reste en anglais (incohérence langue) — P3
- **Fichier** : `src/app/not-found.tsx:15-24`
- **Catégorie** : i18n
- **Constat** : ce 404 global (hors `[locale]`, donc volontairement sans i18n) mélange les langues : titre/paragraphe en **anglais** (« Page not found », « doesn't exist… »), mais le bouton dit **« Volver al inicio »** (espagnol) et pointe vers `/fr`. Trois langues se télescopent sur un même écran.
- **Impact** : écran de repli incohérent (rare — seulement les chemins ne matchant aucun segment locale, cf. commentaire du fichier), mais visiblement non relu.
- **Reco** : choisir une langue unique (la défaut FR du projet) pour ce fallback, ou au moins aligner le label du bouton sur le reste (anglais → « Back to home », cible `/fr`).
- **Confiance** : haute

### [WS12-09] `PopClose` : label de fermeture en dur « Cerrar » (non i18n) — P3
- **Fichier** : `src/components/ui/PopClose.tsx:11`
- **Catégorie** : i18n / a11y
- **Constat** : `label = 'Cerrar'` par défaut (espagnol) sur l'`aria-label` du bouton X. Les appelants peuvent passer `label`, mais le défaut espagnol s'applique à tout site public FR/EN qui n'override pas. Primitive partagée → le défaut fuit potentiellement sur des surfaces publiques tri-langue.
- **Impact** : lecteur d'écran annonce « Cerrar » en contexte FR/EN si l'appelant oublie d'override.
- **Reco** : soit pas de défaut (forcer l'appelant à passer un label traduit), soit défaut neutre ; idéalement chaque drawer public passe sa clé i18n `Nav.close`/équivalent. À recouper avec les appelants (drawers).
- **Confiance** : moyenne

### [WS12-10] Clé i18n `Banner.ctaArrowAlt` morte — P3
- **Fichier** : `src/messages/{fr,en,es}.json:923` (`"ctaArrowAlt"`) — aucun usage
- **Catégorie** : dette / i18n
- **Constat** : la clé `Banner.ctaArrowAlt` (« Flèche »/« Arrow »/« Flecha ») n'est lue nulle part (grep `ctaArrowAlt` → 0 dans `src/`). Les flèches CTA sont des `<span>→</span>` décoratifs sans alt. Reliquat d'une version antérieure.
- **Impact** : bruit i18n (3 entrées mortes), faux signal de surface traduite.
- **Reco** : supprimer la clé des 3 fichiers de messages.
- **Confiance** : haute

## Points positifs (court)
- **Script anti-flash** (`themeModeScript.ts` + injection `layout.tsx:70`) : robuste — `try/catch` autour de `localStorage`, fallback `'light'` si valeur inattendue, et le hash SHA-256 du script est calculé par `next.config.ts` pour garder la CSP `script-src` sans `'unsafe-inline'` tout en préservant le SSG. Très propre.
- **`getThemeConfig`** : `server-only` + client anon **sans cookies** + `unstable_cache`/`revalidateTag` → injecte `data-theme/data-mode` SSR **sans** forcer le rendu dynamique (pages `[locale]` restent SSG). Dégrade proprement sur `DEFAULT` en cas d'erreur DB.
- **`<html lang={locale}>`** dynamique via `getLocale()` + `metadataBase` pointant le domaine prod `farmau.do` : SEO/hreflang corrects au niveau racine.
- **`FarmauLogo`** : recoloration thème via `mask-image` + `--c-bird` (override `color` optionnel), `aria-hidden` sur le glyphe, `aria-label="FARMAU"` sur le lien/bouton conteneur, focus-visible géré. `[locale]/not-found.tsx` est soigné (i18n riche, quick-links, design FARMAU).
- **`normalizeType`** : mapping exhaustif des 6 legacy `banner_type` + `default` sûr, dispatcher mince et lisible.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/app/admin/error.tsx` (hors périmètre) : à vérifier qu'il logge aussi l'erreur et qu'il rend un `<html>` si c'est un `global-error` admin (sinon même angle mort que WS12-04/05).
- `src/lib/schemas.ts:77,90,98,110` : `image_url`/`attribution_photo_url`/`link_url` sont `z.string()` sans `.url()` — validation d'URL absente côté bannières (recoupe WS12-01/02), à confirmer par le WS schémas/API.
- `src/app/[locale]/page.tsx:158-181` : le rendu des bannières ne mémoïse rien et n'a pas de garde sur le nombre de bannières actives (DoS contenu mineur), à noter par le WS home.

## Zones non couvertes / à re-vérifier humainement
- **WS12-01 (Link externe)** : confirmer en navigateur qu'une bannière avec `link_url` absolu produit bien `/{locale}/https://…` (comportement next-intl `createNavigation` sur href absolu — très probable mais non exécuté ici).
- **WS12-09 (`PopClose` défaut « Cerrar »)** : recouper la liste réelle des appelants publics (drawers) pour savoir si le défaut espagnol fuit effectivement sur FR/EN ou si tous overrident.
- Rendu visuel du **mode sombre** des bannières (`BannerQuote` toujours `bg-ink-900`, `BannerHero` overlay fixe) non vérifié contre les tokens `--c-ink-panel*` — limite connue du système de thèmes (sombre récent), à confirmer.
