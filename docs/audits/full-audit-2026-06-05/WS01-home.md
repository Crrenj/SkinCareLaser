# WS01 — Page d'accueil (Home)

**Périmètre** : `src/app/[locale]/page.tsx`, `src/app/[locale]/layout.tsx`, `src/components/home/*` (HomeHero, HomeBestsellers, HomeBrands, HomeByNeed, HomeExpertise, HomeRoutine, HomeSectionHeader), `src/lib/homeSections.ts`
**Fichiers lus** : 9 du périmètre + 8 dépendances (Plate, Banner, BannerQuote, IframeHeightReporter, getShopSettings, getThemeConfig, supabaseServer, i18n/request, catalogue/page) + manifestes build + vue `v_bestsellers` (live) + colonnes DB (live)
**Lignes parcourues (approx.)** : ~900 (périmètre) + ~500 (dépendances)
**Synthèse** : P0=0 · P1=1 · P2=4 · P3=7

## Findings

### [WS01-01] La home est rendue en DYNAMIC (pas SSG/ISR) — ~6-9 requêtes DB séquentielles à CHAQUE requête — P1
- **Fichier** : `src/app/[locale]/page.tsx:124` (`createSupabaseServerClient()`), conséquence sur tout le fichier ; recoupé `src/lib/supabaseServer.ts:10` (`cookies()`)
- **Catégorie** : perf | archi | seo
- **Constat** : `page.tsx` utilise `createSupabaseServerClient()` (client cookie-based) pour des lectures **purement publiques/anonymes** (banners, brands, bestsellers, tags, count produits). Or ce client appelle `cookies()` (next/headers), ce qui **opte la route en rendu dynamique**. Vérifié en build réel : `.next/routes-manifest.json` classe `/[locale]` (et toutes les pages `[locale]`) en `dynamicRoutes`, et `.next/prerender-manifest.json` ne contient **aucune** page locale prérendue (1 seule route statique : `/robots.txt`). Le `export const revalidate = 60` du fichier est donc **inopérant** : la home n'est ni SSG ni ISR, elle est re-rendue à chaque requête avec un `Promise.all` de 5 lectures + `fetchBestsellers` (1-2 requêtes) + `fetchFeaturedNeeds` (1 + 1 par tag featured, soit 4 aujourd'hui) ≈ **8-9 round-trips Supabase par hit**, sans cache. Le projet **sait** que c'est à éviter : `src/lib/getThemeConfig.ts:19-24` documente explicitement qu'on utilise un client anon sans cookies « qui … forcerait tout le site en rendu dynamique ». La home contredit ce pattern. CLAUDE.md affirme de façon répétée « les pages `[locale]` restent SSG » → **drift doc ↔ réalité**.
- **Impact** : page la plus visitée du site re-calculée intégralement à chaque visite (TTFB dépendant de Supabase, charge DB proportionnelle au trafic, pas de cache CDN). Régression de perf/SEO vs l'intention affichée.
- **Reco** : pour les lectures publiques de la home, soit (a) wrapper les requêtes dans `unstable_cache` (tags + `revalidate: 60`) avec un client anon sans cookies (comme `getThemeConfig`), soit (b) extraire un `getHomeData()` cookieless caché. Cela rétablit l'ISR 60s documenté et coupe la charge DB. Note : `i18n/request.ts:27` appelle aussi `cookies()` mais seulement dans la branche `else` (locale non issue de l'URL) — pour `[locale]`, `requestLocale` est défini, donc la cause dominante reste le client Supabase de la page.
- **Confiance** : haute (confirmé par les manifestes de build + lecture du code)

### [WS01-02] Le SELECT principal des bestsellers omet `is_new` → le badge « Nuevo » ne s'affiche JAMAIS sur le chemin normal — P2
- **Fichier** : `src/app/[locale]/page.tsx:257-261` (chemin vue) vs `:243` (chemin fallback)
- **Catégorie** : bug | data
- **Constat** : la requête de détails sur le chemin normal (vue `v_bestsellers` OK) sélectionne `id, slug, name, description, price, currency, product_images (...), range (...)` — **sans `is_new`**. Le chemin fallback (vue absente/vide), lui, sélectionne bien `is_new` (ligne 243). `RawBestseller.is_new` (type ligne 80) reste donc `undefined` sur le chemin nominal, `mapBestseller` (ligne 221) met `isNew: undefined`, et `HomeBestsellers` (ligne 50-54) ne pose le tag `tagNew` que si `p.isNew` est truthy → **en fonctionnement normal, aucun produit n'obtient le badge « Nuevo »**. Il n'apparaîtrait que dans le mode dégradé (vue vide), incohérence d'autant plus invisible.
- **Impact** : feature visuelle (signalement « nouveau » sur la grille bestsellers) silencieusement morte sur le rendu réel.
- **Reco** : ajouter `is_new` au SELECT ligne 258 (aligner sur le fallback).
- **Confiance** : haute

### [WS01-03] Le fallback bestsellers ne filtre pas `is_active` → des produits inactifs peuvent remonter sur la home — P2
- **Fichier** : `src/app/[locale]/page.tsx:240-248`
- **Catégorie** : bug | data
- **Constat** : le commentaire ligne 239 dit « premiers 4 produits actifs (degraded) », mais la requête fallback ne pose **aucun** `.eq('is_active', true)` — uniquement `.limit(4)`. Si la vue `v_bestsellers` renvoie vide (erreur/0 ligne), on retombe sur 4 produits **quelconques**, potentiellement inactifs/brouillons. (Le chemin nominal est sûr : la vue filtre `WHERE is_active IS DISTINCT FROM false`.)
- **Impact** : risque de vitriner des produits désactivés en façade dans un scénario de dégradation. Faible probabilité mais effet visible et contraire à l'intention documentée.
- **Reco** : ajouter `.eq('is_active', true)` à la requête fallback (et idéalement un `.order(...)` déterministe).
- **Confiance** : haute

### [WS01-04] `product_images` lu sans ordre → image « principale » non déterministe (latent) — P2
- **Fichier** : `src/app/[locale]/page.tsx:244,259` (`product_images ( url, alt )`) ; consommé `src/components/home/HomeBestsellers.tsx:48` (`p.images?.[0]`)
- **Catégorie** : data | bug
- **Constat** : les deux SELECT récupèrent `product_images` **sans `.order()`**, et la table `product_images` (vérifié live) n'a **aucune** colonne d'ordre (`id, product_id, url, alt`). `HomeBestsellers` prend `images[0]` comme miniature : l'ordre étant non spécifié côté Postgres, le « premier » est arbitraire et peut varier d'un rendu à l'autre — d'autant plus que la home est désormais dynamique (cf. WS01-01). **État réel** : 0 produit a >1 image aujourd'hui → impact nul pour l'instant, mais le défaut se déclenche dès qu'un produit reçoit une 2ᵉ image.
- **Impact** : miniature bestseller potentiellement incohérente (et instable entre requêtes) une fois le multi-images utilisé.
- **Reco** : soit ajouter une colonne d'ordre (`position`) + `.order('position')`, soit, faute de mieux, `.order('id')` pour un choix stable. (Transverse : le catalogue a le même SELECT sans ordre — `catalogue/page.tsx:104`.)
- **Confiance** : haute (schéma + code vérifiés)

### [WS01-05] Drift logique/doc : bestsellers « triés par sold_30d » alors que la vue renvoie `sold_30d = 0` constant — P2
- **Fichier** : `src/app/[locale]/page.tsx:226,265` (commentaires) ; `src/components/home/HomeBestsellers.tsx:23-25` (commentaire + tag « le plus réservé ») ; recoupé vue live
- **Catégorie** : logique-métier | data | dette
- **Constat** : commentaires et UX affirment un tri par ventes 30 j (`sold_30d desc`) et qualifient le produit #1 de « le plus réservé » (clé `tagHot`). La définition **live** de `v_bestsellers` (confirmée via SELECT) hardcode `0::bigint AS sold_30d` et trie en fait par `is_featured DESC NULLS LAST, created_at DESC` (héritage de la suppression des tables `orders`, migration `20260527110000`). Le tri par ventes n'existe plus ; `sold_30d` est mort. Le #1 est donc « le produit featured le plus récent », pas « le plus réservé ».
- **Impact** : libellé trompeur pour l'utilisateur (« le plus réservé » sans donnée de réservation) ; commentaires de code mensongers induisant en erreur la maintenance. Pas de crash.
- **Reco** : soit recâbler `sold_30d` (compter les `reservation_items` 30 j dans la vue), soit assumer le tri éditorial et renommer la clé/le tag (`tagHot` → « sélection » / « coup de cœur ») + corriger les commentaires.
- **Confiance** : haute (vue live inspectée)

### [WS01-06] `HomeSectionHeader.invert` : prop + toute la branche de style sombre sont du code mort — P3
- **Fichier** : `src/components/home/HomeSectionHeader.tsx:13,27,31-67` ; aucun appelant ne passe `invert` (HomeBestsellers/HomeByNeed/HomeRoutine passent seulement index/kicker/title/cta*)
- **Catégorie** : dette
- **Constat** : `invert` vaut toujours `false` (3 sites d'appel vérifiés). Toutes les variantes `invert ? ... : ...` (≈ 6 chaînes ternaires de classes) sont inatteignables.
- **Impact** : bruit/maintenance, classes Tailwind jamais générées pour rien (`text-clay-400`, `border-ink-700`… côté invert).
- **Reco** : retirer la prop `invert` et les branches associées, ou la câbler si une section sombre est prévue.
- **Confiance** : haute

### [WS01-07] `description` sur-récupérée pour les bestsellers mais jamais rendue — P3
- **Fichier** : `src/app/[locale]/page.tsx:243,258` (SELECT `description`) + `mapBestseller:215` ; non utilisée dans `HomeBestsellers.tsx` (l'interface locale `MappedProduct` lignes 7-16 ne contient pas `description`)
- **Catégorie** : perf | dette
- **Constat** : `description` est sélectionnée et mappée, transmise via `products`, mais le composant bestsellers ne l'affiche pas.
- **Impact** : sur-fetch mineur (texte potentiellement long ×4) à chaque rendu (aggravé par WS01-01).
- **Reco** : retirer `description` des SELECT bestsellers (et du type) ou l'afficher.
- **Confiance** : haute

### [WS01-08] `lang={locale}` redondant sur le `<div>` racine de la home — P3
- **Fichier** : `src/app/[locale]/page.tsx:193`
- **Catégorie** : dette | a11y
- **Constat** : `<html lang={locale}>` est déjà posé par le root layout (`src/app/layout.tsx:62`). Le `lang` sur le `<div>` interne est superflu (et pourrait diverger si l'un change un jour).
- **Impact** : nul fonctionnellement ; bruit. (Transverse : d'autres pages publiques répliquent ce `lang` sur leur wrapper.)
- **Reco** : retirer l'attribut sur le `<div>`.
- **Confiance** : haute

### [WS01-09] `HomeHero` est inutilement un Client Component — P3
- **Fichier** : `src/components/home/HomeHero.tsx:1` (`'use client'`)
- **Catégorie** : perf | archi
- **Constat** : `HomeHero` n'utilise ni état, ni effet, ni handler — uniquement `useTranslations` (dispo en Server via `getTranslations`) et `<Link>`. Les autres composants de section sont des Server Components et passent par `getTranslations`. `HomeHero` force un boundary client + l'envoi de son JS au navigateur sans nécessité.
- **Impact** : bundle client légèrement plus gros ; incohérence avec le reste du dossier `home/`.
- **Reco** : convertir en Server Component (`getTranslations('Home.hero')`), comme `HomeBestsellers`/`HomeByNeed`.
- **Confiance** : haute

### [WS01-10] Pas de `<h1>` si l'admin désactive la section `hero` — P3
- **Fichier** : `src/app/[locale]/page.tsx:151,198-202` (layout piloté par `shop_settings.home_layout`) ; seul `HomeHero.tsx:32` émet un `<h1>`
- **Catégorie** : a11y | seo
- **Constat** : l'unique `<h1>` de la home vit dans `HomeHero`. Le layout est réordonnable/masquable par l'admin (`resolveHomeLayout`). Si `hero.enabled=false`, la page n'a **plus aucun `<h1>`** (les `<h2>` de section deviennent le sommet), ce qui dégrade la structure pour lecteurs d'écran et SEO.
- **Impact** : risque a11y/SEO conditionnel à une action admin légitime.
- **Reco** : garantir un `<h1>` (visuellement masqué si besoin) indépendant de la section hero, ou interdire la désactivation de `hero` côté panneau admin.
- **Confiance** : moyenne (dépend d'une config admin ; le défaut a `hero` actif)

### [WS01-11] `fetchHomeQuote` : un `pharmacist_advice = ''` (chaîne vide) peut faire disparaître la citation malgré d'autres lignes valides — P3
- **Fichier** : `src/app/[locale]/page.tsx:281-296`
- **Catégorie** : bug | logique-métier
- **Constat** : le filtre SQL `.not('pharmacist_advice', 'is', null)` exclut NULL mais **pas** les chaînes vides `''`. Un `''` passe donc dans l'échantillon de 10, peut être tiré par `Math.random()` (ligne 290), puis `if (!random.pharmacist_advice) return null` (ligne 291) annule **toute** la section — alors que d'autres lignes non vides existaient dans l'échantillon. **État réel** : 0 produit avec `pharmacist_advice` non vide aujourd'hui → la section quote ne s'affiche jamais pour l'instant (comportement gracieux), le bug est latent.
- **Impact** : intermittence/disparition de la citation une fois du contenu saisi, si des entrées vides cohabitent.
- **Reco** : filtrer aussi le vide (`.neq('pharmacist_advice', '')`) et/ou re-tirer dans l'échantillon plutôt que d'abandonner. Accessoirement, `Math.random()` côté serveur est OK ici (valeur passée en prop, pas d'hydratation), mais combiné au rendu dynamique (WS01-01) la citation change à chaque requête.
- **Confiance** : haute

### [WS01-12] `IframeHeightReporter` monté sur la home publique pour une feature admin-only — P3
- **Fichier** : `src/app/[locale]/page.tsx:5,195` ; `src/components/IframeHeightReporter.tsx`
- **Catégorie** : perf | archi
- **Constat** : ce composant client ne sert que l'aperçu iframe de `/admin/annonce`. Il est inerte hors iframe (`window.parent === window.self`), mais il est tout de même livré (JS + boundary client) à **tous** les visiteurs publics de la home.
- **Impact** : surcoût négligeable, mais c'est du code admin embarqué dans le parcours public. (Les listeners/ResizeObserver sont correctement nettoyés — pas de fuite.)
- **Reco** : acceptable tel quel ; sinon le charger en `next/dynamic({ ssr:false })` ou via un flag d'aperçu.
- **Confiance** : haute

## Points positifs (court)
- `resolveHomeLayout` (`homeSections.ts`) est robuste et bien pensé : tolère JSONB null/partiel/clés inconnues, garde l'ordre stocké, ré-ajoute en fin les sections manquantes — défensif et pur (réutilisable client+serveur).
- Gestion des cas vides exemplaire : chaque section (`HomeBestsellers`, `HomeBrands`, `HomeByNeed`, quote, banners) renvoie `null`/fallback proprement quand la donnée manque ; `getShopSettings`/`fetchBestsellers` ont des fallbacks gracieux.
- Parité i18n complète : **toutes** les clés `Home.*` consommées existent en FR/ES/EN (vérifié) ; aucune string FR en dur dans les composants.
- Pas d'injection via `dangerouslySetInnerHTML` : il n'est alimenté que par des chaînes de traduction (HTML statique `<br>/<em>/<strong>` contrôlé par le dev). Le contenu DB (quote pharmacien) passe par `BannerQuote` en **texte échappé** (`{title}`), pas en HTML.
- Marquee `HomeBrands` correct : duplication exacte `[...brands,...brands]` pour la boucle `-50%`, items dupliqués `aria-hidden`+`tabIndex=-1`, `motion-reduce:animate-none`, pause au survol. Liens `?brand=<name>` cohérents avec le filtre catalogue (par nom).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `catalogue/page.tsx:104` lit `product_images` sans `.order()` (même latence d'image principale non déterministe que WS01-04).
- `Banner.tsx:48-51` : `useEffect`/`onView` télémétrie jamais branchée depuis la home (props `onView/onClick` non passées) — colonnes `view_count/click_count` toujours à 0 (déjà connu, voir WS « annonce »).
- Pattern `lang={locale}` redondant sur le wrapper sur plusieurs pages publiques (transverse, voir WS01-08).

## Zones non couvertes / à re-vérifier humainement
- WS01-01 (dynamic vs SSG) est tranché via les manifestes du dernier build local (`.next/`) ; à reconfirmer après un `next build` propre si le cache `.next` est régénéré. La correction (client cookieless + `unstable_cache`) touche aussi potentiellement d'autres pages publiques → coordination avec l'équipe perf.
- L'impact réel des badges « Nuevo » (WS01-02) et de l'image principale (WS01-04) est nul tant qu'aucun produit n'est `is_new` mis en avant / multi-images ; à re-tester dès que du contenu réel est saisi.
