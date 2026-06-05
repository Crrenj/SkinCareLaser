# WS31 — SEO (transverse)

**Périmètre** : `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo.ts`, `src/app/layout.tsx` (metadataBase/OG global), `generateMetadata` des pages publiques `[locale]/**`, JSON-LD (`pdp/ProductJsonLd.tsx`, `blog/BlogPostJsonLd.tsx`, CollectionPage dans `catalogue/page.tsx` + `marques/page.tsx`).
**Fichiers lus** : 22 · **Lignes parcourues (approx.)** : ~1700
**Synthèse** : P0=0 · P1=1 · P2=4 · P3=3

## Findings

### [WS31-01] hreflang « mensonger » sur les articles de blog (et dans le sitemap) — P1
- **Fichier** : `src/app/[locale]/blog/[slug]/page.tsx:34-37` + `:50-55` ; `src/app/sitemap.ts:107-124`
- **Catégorie** : seo | i18n
- **Constat** : Le blog est **mono-langue par article** (colonne `posts.locale` ; un badge de langue est affiché). Vérifié en base : **3 posts publiés, tous `locale='es'`**. Or la page de post **(a)** déclare des alternates hreflang pour les **3 locales** via `buildLanguageAlternates('/blog/${slug}')` (donc `fr`+`es`+`en`+`x-default`), et **(b)** ne filtre **jamais** la requête par locale (`.eq('slug', slug).eq('is_published', true)` ligne 50-55) → le **même contenu espagnol** est servi à l'identique sur `/fr/blog/[slug]`, `/es/blog/[slug]`, `/en/blog/[slug]`. Le sitemap reproduit le mensonge (lignes 119-124 : 3 alternates par post + URL primaire forcée en `fr`).
- **Impact** : On annonce à Google des équivalents FR et EN qui n'existent pas (contenu identique = pas une traduction). Conséquences classiques : Google ignore le hreflang et/ou signale « These pages are not translations », canonical mal choisi, dilution du jus SEO entre 3 URLs servant le même texte ES. Aggravé par le canonical de la page qui vaut `/${locale}/blog/${slug}` (donc `/fr/blog/[slug]` côté FR) alors que le contenu est ES.
- **Reco** : Aligner l'annonce sur la réalité mono-langue. Deux options : (1) **ne déclarer que la locale réelle** du post en hreflang (lire `post.locale`, ne mettre qu'une entrée + `x-default` pointant cette locale) et émettre dans le sitemap **une seule** URL par post (`/${post.locale}/blog/${slug}`) sans bloc d'alternates multi-langues ; ou (2) servir le post **uniquement** sous sa locale (404/redirect 301 vers `/${post.locale}/...` si la locale d'URL ≠ `post.locale`) et indexer cette seule URL. Option (1) est la moins intrusive et conserve la visibilité voulue sur `/fr` et `/en`.
- **Confiance** : haute

### [WS31-02] Pages d'auth sans métadonnées : ni title/description, ni `noindex` — P2
- **Fichier** : `src/app/[locale]/(auth)/login/page.tsx:1` (+ `signup`, `forgot-password`, `reset-password` — toutes `'use client'`, aucune n'exporte `generateMetadata`) ; aucun `(auth)/layout.tsx`
- **Catégorie** : seo
- **Constat** : Les 4 pages d'auth sont des Client Components au niveau page → impossible d'exporter `generateMetadata`. Aucun layout serveur dans `(auth)` pour porter le titre/`robots`. Résultat : elles héritent du **title/description génériques du root layout** (`"FARMAU — Dermo-cosmétique d'expert pharmacien"`) et n'ont **aucun `robots: noindex`**. `robots.txt` ne les couvre pas (le groupe `(auth)` n'est pas un segment d'URL ; les URLs réelles sont `/fr/login`, `/es/signup`… ; le disallow `/auth/` ne vise que le callback OAuth non localisé `/auth/callback`). `/login` est **lié en interne** depuis `NavBar.tsx:395` et `MobileDrawer.tsx:189` → crawlable et indexable. Ironie : `PageMeta.login` et `PageMeta.signup` existent **dans les 3 locales** mais ne sont **jamais utilisées**.
- **Impact** : Pages minces (login/signup) potentiellement indexées avec des **titres dupliqués** (toutes le même titre générique × 3 locales × 4 pages), pollution de l'index, gaspillage de budget crawl. Pas de canonical/hreflang non plus.
- **Reco** : Reproduire le pattern de `cart/page.tsx` (shell Server qui pose `robots: { index:false, follow:false }` + title/description via `PageMeta.login`/`PageMeta.signup` déjà traduits) : soit ajouter un `src/app/[locale]/(auth)/layout.tsx` Server avec `generateMetadata` (noindex pour tout le groupe), soit convertir chaque page en shell Server enveloppant le composant client.
- **Confiance** : haute

### [WS31-03] `robots.txt` : disallow `/account/` inopérant sur les URLs préfixées par locale — P2
- **Fichier** : `src/app/robots.ts:11-18`
- **Catégorie** : seo
- **Constat** : Le compte est sous `[locale]` → URLs réelles `/fr/account/profile`, `/es/account/...`. La règle `disallow: '/account/'` matche un **préfixe de chemin** : elle ne couvre **pas** `/fr/account/...` (qui commence par `/fr/`). Pour le panier, le code gère bien le cas avec `'/*/cart'`, mais l'équivalent `'/*/account/'` est absent. À l'inverse, `/admin/` et `/auth/` sont corrects car ces routes ne sont **pas** localisées (`src/app/admin`, `src/app/auth/callback`). La règle bare `'/cart'` est redondante (le panier localisé est couvert par `'/*/cart'`, et `/cart` non préfixé n'existe pas).
- **Impact** : Les crawlers ne sont pas dissuadés de parcourir `/fr/account/*`. Mitigé par le `robots: noindex` présent dans le `generateMetadata` de chaque page `account/*` (donc pas d'indexation), mais le crawl-budget est gaspillé et la confirmation de réservation `/[locale]/reservation/confirmation/[id]` n'a **que** le noindex (aucune ligne robots).
- **Reco** : Ajouter `'/*/account/'` (et au choix `'/*/reservation/confirmation/'`) au tableau `disallow` ; supprimer la règle `'/cart'` redondante.
- **Confiance** : haute

### [WS31-04] Aucune Twitter Card + aucune image OG par défaut — P2
- **Fichier** : `src/app/layout.tsx:37-45` (openGraph sans `images`, pas de champ `twitter`) ; pages statiques `home/catalogue/a-propos/faq/...` (`openGraph` sans image)
- **Catégorie** : seo
- **Constat** : Le root layout définit `openGraph.siteName`/`type` mais **aucune `openGraph.images`** par défaut, et **aucun champ `twitter`**. Aucune convention de fichier `opengraph-image`/`twitter-image` dans `src/app`. Next.js ne dérive **pas** les balises `twitter:*` à partir d'`openGraph` sans champ `twitter` explicite → **zéro balise Twitter Card** sur tout le site. Seules les pages produit/marque/besoin posent une image OG (issue de la DB) ; home, catalogue et toutes les pages éditoriales partagent **sans image**.
- **Impact** : Partages sociaux dégradés : sur X/Twitter aucune carte riche (`summary_large_image`), sur les autres réseaux la home/le catalogue s'affichent sans visuel → CTR social plus faible.
- **Reco** : Ajouter dans `src/app/layout.tsx` un `openGraph.images` par défaut (ex. `/og/default.png`, 1200×630) + un bloc `twitter: { card: 'summary_large_image', title, description, images }`. Les pages produit/marque/besoin continueront à surcharger l'image.
- **Confiance** : haute

### [WS31-05] hreflang multi-langues sur des pages légales non traduites — P2
- **Fichier** : `src/app/[locale]/legal/cookies/page.tsx:22-25` (+ `mentions-legales` FR-only ; `cgv`/`confidentialite` ont `en`→FR) 
- **Catégorie** : seo | i18n
- **Constat** : `cookies` et `mentions-legales` rendent leur **corps entièrement en français en dur** (titres/paragraphes littéraux, ex. `title="Politique de gestion des cookies"`), pour les 3 locales d'URL. `cgv`/`confidentialite` sont FR+ES mais `en` retombe sur FR (commentaire ligne 30-34 de `cgv`). Pourtant `generateMetadata` déclare `buildLanguageAlternates(...)` → hreflang `fr`+`es`+`en`+`x-default` annonçant 3 traductions là où le contenu est identique (FR) sur ≥2 locales. Même cause racine que WS31-01.
- **Impact** : hreflang trompeur (contenu dupliqué présenté comme traduit). Moins critique que le blog (pages légales = faible priorité, déjà à `priority 0.3`), mais Google peut signaler des pages alternatives non valides.
- **Reco** : Pour les pages dont le corps n'existe que dans 1 ou 2 langues, restreindre les alternates aux locales réellement servies (le `LegalShell` reçoit déjà le contenu par locale via le `CONTENT` map de `cgv` — exposer la liste des locales disponibles et la passer à un `buildLanguageAlternates` paramétrable). C'est une dette **liée à la traduction du contenu juridique** (déjà notée « à valider juriste ») ; à corriger en même temps que la traduction.
- **Confiance** : moyenne

### [WS31-06] JSON-LD CollectionPage : `url` en chemin relatif (pas d'URL absolue) — P3
- **Fichier** : `src/app/[locale]/catalogue/page.tsx:185` ; `src/app/[locale]/marques/page.tsx:147`
- **Catégorie** : seo
- **Constat** : Le `url` du JSON-LD CollectionPage vaut `localizedPath(locale, '/catalogue')` → `"/fr/catalogue"` (chemin **relatif**). `metadataBase` ne s'applique **qu'aux** objets `Metadata` de Next, **pas** au `<script type="application/ld+json">` injecté manuellement. Les `ProductJsonLd`/`BlogPostJsonLd` utilisent bien `SITE_URL + ...` (absolu) ; ces deux CollectionPage non.
- **Impact** : `url` non-absolu dans les données structurées (Google recommande des URLs absolues pour `url`/`@id`). Faible (CollectionPage n'a pas de rich-result fort), mais incohérent avec le reste.
- **Reco** : Préfixer par `https://farmau.do` (`${SITE_URL}${localizedPath(locale, '/catalogue')}`) comme dans les composants JSON-LD produit/article.
- **Confiance** : haute

### [WS31-07] Sitemap : hreflang sans `x-default` (incohérent avec le `<head>` des pages) — P3
- **Fichier** : `src/app/sitemap.ts:50-53, 67-72, 87-92, 99-103, 119-124`
- **Catégorie** : seo
- **Constat** : Chaque entrée du sitemap construit `alternates.languages` via `Object.fromEntries(routing.locales.map(...))` → **uniquement** `fr/es/en`, **sans** `x-default`. Or le `<head>` des pages, lui, ajoute `x-default` (via `buildLanguageAlternates`, `seo.ts:39`). Annonce hreflang **incohérente** entre sitemap et balises `<link>`.
- **Impact** : Google recommande d'inclure `x-default` aussi dans les alternates du sitemap. L'écart sitemap/`<head>` peut générer des avertissements et prive du fallback `x-default` au niveau sitemap.
- **Reco** : Réutiliser `buildLanguageAlternates(path)` (qui pose déjà `x-default`) au lieu de re-mapper `routing.locales` à la main dans `sitemap.ts`, ou ajouter explicitement la clé `x-default` → URL `defaultLocale`.
- **Confiance** : haute

### [WS31-08] Sitemap dépendant des cookies (rendu dynamique) + erreurs DB avalées silencieusement — P3
- **Fichier** : `src/app/sitemap.ts:16, 38-43, 58, 75-78, 107-110` (via `createSupabaseServerClient` → `src/lib/supabaseServer.ts:10` `await cookies()`)
- **Catégorie** : seo | perf | data
- **Constat** : Le sitemap instancie un client Supabase **lié aux cookies** (`createSupabaseServerClient`). L'appel à `cookies()` opte la route en **rendu dynamique** (regénéré à chaque requête de crawl = un hit DB par crawl) — acceptable pour un sitemap mais inutile ici (aucune donnée user nécessaire). Surtout, chaque requête fait `?? []` (lignes 43, 60, 80, 112) : si les policies RLS de lecture publique de `products`/`brands`/`posts`/`tags_with_types` étaient un jour restreintes, le sitemap renverrait **silencieusement un sitemap vide** (aucune erreur loggée), invisible jusqu'à une chute de trafic.
- **Impact** : Couplage fragile (le SEO dépend d'une RLS permissive) + surcoût dynamique évitable. Latent, pas un bug actuel.
- **Reco** : Utiliser un client **anon sans cookies** (comme `getThemeConfig`) pour découpler le sitemap de la session et permettre une éventuelle génération statique/ISR ; logguer (`logger.error`) si une des requêtes échoue au lieu d'avaler en `?? []`.
- **Confiance** : moyenne

## Points positifs (court)
- Couverture **title/description complète** : toutes les pages indexables ont `generateMetadata` ; toutes les clés `PageMeta.*` (et `Legal.pageMeta.*`) existent dans les 3 locales (vérifié, 0 manquante).
- `canonical` + hreflang (`buildLanguageAlternates` avec `x-default`) cohérents sur **toutes** les pages publiques statiques + dynamiques (produit/marque/besoin/catalogue).
- `noindex` correctement posé sur les pages privées qui ont un shell Server : cart, favoris, reservation, reservation/confirmation, account/{profile,security,preferences,reservations}.
- JSON-LD Product complet et correct : `offers` avec `priceCurrency` (= `products.currency`, DOP en base), `price.toFixed(2)`, `availability` dérivée du stock, `itemCondition`, `seller`, URLs **absolues**. Article (blog) et CollectionPage présents.
- PDP : redirection 301 (`permanentRedirect`) UUID→slug — évite le contenu dupliqué sur l'ancien format d'URL.
- `metadataBase` = `https://farmau.do`, robots `host`/`sitemap` cohérents, `localePrefix: 'always'` (canonicals distincts par locale, pas de duplicate root).

## Signalements hors périmètre (1 ligne chacun, max 5)
- WS06 : pas de JSON-LD **FAQPage** sur `/faq` ni **LocalBusiness/Pharmacy** sur `/pharmacie`/`/contact` (rich-results manqués) ; aucun **Organization+WebSite/SearchAction** global (boîte de recherche sitelinks) ni **BreadcrumbList**.
- WS24/sécurité : CSP `next.config.ts:65` est `script-src 'self' 'sha256-…'` **sans `unsafe-eval`** → le finding historique « CSP unsafe-eval » semble **résolu** (à confirmer côté WS24).
- Perf : `sitemap.ts` + `marques/page.tsx:58-122` font N+ requêtes Supabase en boucle (`Promise.all` par marque) — coûteux si le catalogue de marques grossit (WS25/perf).

## Zones non couvertes / à re-vérifier humainement
- Validation réelle des données structurées via Google Rich Results Test / Search Console (ce que je n'ai pu faire qu'en lecture de code).
- Canonicalisation **apex vs www** et redirection HTTP→HTTPS : gérées au niveau Vercel/DNS (hors code), non vérifiables ici.
- `og:image` réellement résolu en absolu : les images produit/marque proviennent de Supabase Storage (URLs déjà absolues) — OK en théorie, à confirmer sur un partage réel (Facebook Debugger).
