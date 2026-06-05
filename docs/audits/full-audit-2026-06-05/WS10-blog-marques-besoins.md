# WS10 — Blog + Marques + Besoins + Favoris

**Périmètre** : `src/app/[locale]/blog/page.tsx`, `src/app/[locale]/blog/[slug]/page.tsx`, `src/app/[locale]/marques/page.tsx`, `src/app/[locale]/marques/[slug]/page.tsx`, `src/app/[locale]/besoins/[slug]/page.tsx`, `src/app/[locale]/favoris/page.tsx`, `src/components/blog/BlogPostJsonLd.tsx`
**Fichiers lus** : 7 (périmètre) + ~10 de contexte (schemas, seo.ts, supabaseServer.ts, getThemeConfig.ts, RichTextEditor.tsx, posts API, migrations posts/baseline, sitemap.ts, not-found.tsx, ProductCard.tsx)
**Lignes parcourues (approx.)** : ~1 100
**Synthèse** : P0=0 · P1=2 · P2=5 · P3=4

## Findings

### [WS10-01] `revalidate` mort : le client cookie force le rendu dynamique sur blog/marques/besoins — N+1 marques rejoué à chaque hit — P1
- **Fichier** : `src/app/[locale]/marques/page.tsx:11,46-125` · `src/app/[locale]/blog/page.tsx:10,37` · `src/app/[locale]/blog/[slug]/page.tsx:13,48` · `src/app/[locale]/besoins/[slug]/page.tsx:10,113`
- **Catégorie** : perf / archi
- **Constat** : Ces 4 pages déclarent `export const revalidate = 60/300` (intention ISR/statique) mais s'alimentent via `createSupabaseServerClient()`, qui lit `cookies()` (`supabaseServer.ts:9-11`). Lire les cookies **opte la route en rendu dynamique** : le `revalidate` est alors **inopérant**. Le commentaire de `src/lib/getThemeConfig.ts:18-21` documente noir sur blanc ce piège (« un client anon dédié, pas `supabaseServer` (qui lit les cookies et forcerait tout le site en rendu dynamique) ») — les auteurs le savent, mais ces 4 pages utilisent malgré tout le client cookie. Conséquence aggravante sur `/marques` : `fetchBrandCards` exécute un **N+1** (`Promise.all` sur les 13 marques × {1 requête `ranges` + 1 requête `products` ids + 1 `count` + 1 image} ≈ **40-52 round-trips Supabase**), désormais **rejoué à CHAQUE requête** sans aucun cache (confirme WS35-02). `prerender-manifest.json` ne contient aucune de ces routes (aucun prerender).
- **Impact** : `/marques` = ~50 allers-retours réseau par visite (TTFB élevé, charge DB inutile) ; le blog et les besoins refont leurs requêtes à chaque hit alors que le contenu change rarement. Le `revalidate` exporté induit en erreur (faux sentiment de cache).
- **Reco** : (a) Pour les données **publiques** (blog, marques, besoins), passer à un client anon **sans cookies** wrappé dans `unstable_cache` (même pattern que `getThemeConfig`) pour restaurer le cache et le SSG/ISR ; ou au minimum retirer les `revalidate` trompeurs. (b) `/marques` : remplacer le N+1 par **une seule requête** agrégée (ex. SELECT sur `products` joint `ranges`+`brands` filtré `is_active`, groupé en mémoire ; ou une vue/`rpc` `brand_cards`). Confiance : **haute**.

### [WS10-02] hreflang mensonger sur les articles de blog (post mono-langue annoncé en FR+ES+EN) — P1
- **Fichier** : `src/app/[locale]/blog/[slug]/page.tsx:34-37` (`buildLanguageAlternates`) + page index `blog/page.tsx:46-48` (affiche tous les posts toutes langues)
- **Catégorie** : seo / i18n
- **Constat** : Un post a **une seule** `locale` (`posts.locale ∈ {fr,es,en}`, contenu non traduit). Pourtant `generateMetadata` émet `alternates.languages` pour **les 3 locales** (`buildLanguageAlternates` → `fr`/`es`/`en`/`x-default`), toutes pointant vers `/<loc>/blog/<slug>`. Comme l'index liste **tous** les posts quelle que soit leur langue (décision assumée commit `4acc999`), un post espagnol est accessible et lié depuis `/en/blog/<slug>` et `/fr/blog/<slug>` : on sert du contenu ES sous un canonical/hreflang `en`/`fr`. hreflang déclare des traductions inexistantes (réciprocité fausse). Même défaut répliqué dans `src/app/sitemap.ts:119-124` (hors périmètre strict mais identique).
- **Impact** : Signal hreflang incohérent (Google ignore/pénalise les clusters non réciproques) ; risque de servir la mauvaise langue à l'utilisateur depuis la SERP ; canonical par locale sur un contenu unilingue.
- **Reco** : Pour un post, ne déclarer **que** sa propre locale en `canonical` + un seul `hreflang` (sa langue), sans alternates cross-locale ; idéalement canonicaliser tous les `/<loc>/blog/<slug>` vers `/<post.locale>/blog/<slug>`. Aligner `sitemap.ts` (1 entrée par post dans sa langue). Confiance : **haute**.

### [WS10-03] `og:image` absent sur le blog (index + article) malgré `cover_image_url` — P2
- **Fichier** : `src/app/[locale]/blog/page.tsx:19-26` · `src/app/[locale]/blog/[slug]/page.tsx:31-38`
- **Catégorie** : seo
- **Constat** : Aucun `openGraph` (donc aucun `og:image`) dans les `generateMetadata` du blog, alors que `cover_image_url` existe et est déjà passé au JSON-LD (`BlogPostJsonLd image`). Les pages marques/besoins, elles, peuplent `openGraph.images` (`marques/[slug]:89-95`, `besoins/[slug]:96-102`). Incohérence interne au périmètre.
- **Impact** : Partages sociaux (WhatsApp/FB/X — canal clé pour une pharmacie RD) sans vignette → cartes ternes, CTR réduit.
- **Reco** : Ajouter `openGraph: { title, description, type:'article', images: post.cover_image_url ? [{ url: post.cover_image_url }] : [] }` sur `blog/[slug]` ; idem une image par défaut sur l'index. Confiance : **haute**.

### [WS10-04] Double fetch DB non dédupliqué sur l'article (metadata + body) — P2
- **Fichier** : `src/app/[locale]/blog/[slug]/page.tsx:22-27` (metadata `select('title, excerpt')`) puis `50-55` (page `select('*')`)
- **Catégorie** : perf
- **Constat** : `generateMetadata` et le composant de page interrogent `posts` **séparément** pour le même slug (2 requêtes), sans `React.cache`/dédup. Même schéma sur `marques/[slug]` (`fetchBrand` appelé en metadata ET en page) et `besoins/[slug]` (`fetchNeedTag` ×2).
- **Impact** : 2 round-trips DB par rendu d'article/marque/besoin là où 1 suffirait (amplifié par WS10-01 qui rend tout dynamique).
- **Reco** : Envelopper `fetchBrand`/`fetchNeedTag` et la lecture du post dans `React.cache(...)` (déduplique sur un même render entre `generateMetadata` et la page). Confiance : **haute**.

### [WS10-05] JSON-LD Article sans `dateModified` (et `image` non absolu garanti) — P2
- **Fichier** : `src/components/blog/BlogPostJsonLd.tsx:31-49`
- **Catégorie** : seo
- **Constat** : Le schéma `Article` n'expose pas `dateModified` alors que `posts.updated_at` existe (Google recommande `dateModified` pour la fraîcheur). Par ailleurs `image` est passé tel quel : si `cover_image_url` est un chemin relatif (l'upload bucket renvoie des URLs absolues, mais rien ne le garantit côté données saisies manuellement), `image` JSON-LD doit être une URL absolue.
- **Impact** : Rich snippet moins riche / fraîcheur non signalée ; `image` relatif = champ ignoré par Google.
- **Reco** : Ajouter `dateModified: post.updated_at` (passer la prop). Normaliser `image` en absolu (préfixer `SITE_URL` si commence par `/`). Confiance : **moyenne** (dépend du format réel des URLs en base).

### [WS10-06] Blog public : cap dur à 50 articles, aucune pagination — P2
- **Fichier** : `src/app/[locale]/blog/page.tsx:44` (`.limit(50)`)
- **Catégorie** : bug / archi
- **Constat** : L'index liste `.limit(50)` sans pagination ni « voir plus ». Au-delà de 50 posts publiés, les plus anciens deviennent **inatteignables** depuis l'UI (les URLs directes restent valides, mais plus aucun lien). Aujourd'hui 3 posts publiés → pas d'impact immédiat, mais dette qui se déclenche silencieusement.
- **Impact** : Perte de découvrabilité/SEO du contenu ancien à terme.
- **Reco** : Pagination (`?page=`) ou chargement incrémental, comme l'admin (`/api/admin/posts` gère déjà `page`/`limit`). Confiance : **haute**.

### [WS10-07] Favoris : produits désactivés disparaissent silencieusement, compteur incohérent, pas de purge — P2
- **Fichier** : `src/app/[locale]/favoris/page.tsx:63-95,107`
- **Catégorie** : data / logique-métier
- **Constat** : `wishlistRows` lit les `product_id` favoris, puis le SELECT produits passe par le client cookie (rôle `authenticated`) dont la policy `products` « View active products » ne renvoie **que** `is_active=true` (vérifié en base). Si un produit favori est désactivé/supprimé du catalogue, il **tombe** de `ordered` (l-93-95 `filter`), mais le compteur affiché `t('count', { count: ordered.length })` reflète seulement les actifs alors que la ligne `wishlists` persiste. Aucun nettoyage des lignes orphelines.
- **Impact** : Écart entre « favoris réels » (lignes DB) et affichage ; favoris qui « disparaissent » sans explication ; accumulation de lignes mortes. Cas limite mais réel pour un catalogue vivant.
- **Reco** : Soit afficher une carte « produit indisponible » pour les ids absents, soit purger les `wishlists` orphelins, soit aligner le compteur sur le nombre réellement rendu avec un message. Confiance : **moyenne**.

### [WS10-08] `besoins/[slug]` : `capitalize` sur un nom de tag déjà localisé/saisi — P3
- **Fichier** : `src/app/[locale]/besoins/[slug]/page.tsx:129`
- **Catégorie** : i18n / a11y
- **Constat** : Le `<h1>` applique `capitalize` sur `tag.name` (issu de `tags.name` en base). Pour un tag comme « anti-âge » ou un nom multi-mots, `text-transform: capitalize` force une majuscule à **chaque mot** (« Anti-Âge », « Peaux Grasses »), ce qui peut contredire l'orthographe voulue. La marque (`marques/[slug]:122`) n'a pas ce `capitalize`.
- **Impact** : Casse typographique potentiellement incorrecte sur les titres de besoins ; cosmétique.
- **Reco** : Retirer `capitalize` et soigner la casse en base, ou utiliser `first-letter:uppercase` si seul le 1er caractère doit être forcé. Confiance : **moyenne**.

### [WS10-09] Marges de confiance JSON-LD : `name` brut sur l'index marques, OG sans dimensions — P3
- **Fichier** : `src/app/[locale]/marques/page.tsx:143-149,156-159`
- **Catégorie** : seo / dette
- **Constat** : Le `CollectionPage` JSON-LD ne porte que `name`/`url`/`numberOfItems` (pas d'`itemListElement`) ; acceptable mais minimal. `name: t('title').replace(/<[^>]+>/g,'')` strip le HTML i18n — OK. `og:image` (marques/besoins) n'indique pas `width/height/alt`. Aucun risque, juste sous-optimal.
- **Impact** : Rich result limité ; cosmétique SEO.
- **Reco** : Optionnel : ajouter `itemListElement` (liste des marques) et `alt`/dimensions OG. Confiance : **basse**.

### [WS10-10] Incohérences mineures de chrome/markup — P3
- **Fichier** : `src/app/[locale]/favoris/page.tsx:98` (`lang={locale}`) · `blog/page.tsx:63,74` (`bg-white`) vs reste du site en tokens `sand`
- **Catégorie** : dette / a11y
- **Constat** : (a) `favoris/page.tsx:98` ajoute `lang={locale}` sur le `<div>` racine alors que `<html lang>` est déjà posé globalement (next-intl `getLocale`) — redondant et seule page du périmètre à le faire. (b) Le blog utilise `bg-white` littéral (l-63, 72) au lieu des tokens thématiques `bg-sand-*`/`bg-surface` ; en mode sombre du thème, ces cartes resteront blanches (incohérence visuelle légère ; pages publiques rarement en dark mais le toggle visiteur existe).
- **Impact** : Cosmétique / micro-incohérence de thème.
- **Reco** : Retirer `lang={locale}` redondant ; remplacer `bg-white` par un token (`bg-sand-50`/surface). Confiance : **haute**.

## Points positifs (court)
- **XSS blog correctement mitigé** : le corps est généré par un éditeur TipTap restreint (`RichTextEditor.tsx`, tags limités h2/h3/p/list/quote/link/img) **et** ré-assaini à l'affichage via `DOMPurify.sanitize(post.body)` côté serveur (isomorphic-dompurify) — défense en profondeur. Confirme WS19/WS25 : le site de rendu `blog/[slug]:113` est bien assaini. `BlogPostJsonLd` et le `jsonLd` marques passent par `JSON.stringify` (échappement correct), et `t.raw('title')` provient de fichiers i18n de confiance.
- **Besoins : le bug historique 404 est bien fermé** — `fetchNeedTag` filtre sur `tag_type='besoins'` (= `tt.slug` lowercase exposé par la vue `tags_with_types`, baseline:136), pas `tt.name`. Aucune collision de slug inter-types en base (vérifié) → `maybeSingle()` sûr.
- **Filtrage `is_active=true`** explicite et cohérent sur marques/[slug] et besoins/[slug] (défense alignée avec la policy RLS `products`).
- **i18n complet et à parité** sur tout le périmètre (Blog/BrandsIndex/BrandPage/NeedPage/Favoris + PageMeta.* présents et égaux en FR/ES/EN ; ICU plural correct).
- **Gestion 404 propre** : `notFound()` sur post/marque/besoin manquants → page `[locale]/not-found.tsx` design soignée. Favoris : `robots noindex` + redirect login correct (`redirect()` jette, donc `user!` post-garde est sûr).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/lib/getThemeConfig.ts:18-21` documente que `supabaseServer` force le dynamique : la home (`[locale]/page.tsx`) et le catalogue utilisent pourtant ce même client cookie → la prétention CLAUDE.md « pages [locale] restent SSG » est douteuse globalement (à recouper par WS « home/catalogue/perf »).
- `tags_with_types` et `v_bestsellers` n'ont **aucun** `reloptions` → ce sont des vues **SECURITY DEFINER** (pas `security_invoker`) : la vue besoins consomme `tags_with_types` ; finding RLS/advisor connu → WS24.
- `src/app/sitemap.ts:119-124` répète le hreflang mensonger des posts (mêmes 3 locales sur contenu mono-langue) — à corriger conjointement avec WS10-02.
- `/api/admin/posts` (POST/PATCH) gère `published_at` auto si `is_published && !published_at` : robuste, mais rien n'empêche un `published_at` **futur** d'être quand même listé public (l'index ne filtre pas `published_at <= now()`) → contenu programmé visible immédiatement.

## Zones non couvertes / à re-vérifier humainement
- Confirmer en navigateur que blog/marques/besoins rendent bien en `dynamic` (la lecture cookie le suggère fortement + `prerender-manifest` vide, mais non observé en runtime).
- Format réel des `cover_image_url`/`product_images.url` (absolu vs relatif) pour trancher WS10-05 (image JSON-LD) — données saisies manuellement non échantillonnées.
- Comportement attendu produit pour les favoris pointant un produit désactivé (WS10-07) = décision produit, pas tranchable seul.
