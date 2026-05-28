# WS01 — Architecture & Rendu (Audit PRE-V1, lecture seule)

Date : 2026-05-28 · Auditeur : Claude Opus 4.7 · Périmètre : frontières RSC/Client, layouts & chaîne de rendu, middleware, navigation next-intl, stratégie SSG/ISR vs dynamic, système de thèmes, dédup de fetch serveur.

## Verdict

L'architecture de séparation Server/Client est **saine** : 3 clients Supabase bien cloisonnés, aucun secret service-role ne fuit côté client, le système de thèmes (`getThemeConfig` + `unstable_cache` + `revalidateTag`) est **correctement conçu** et n'introduit **pas** la régression SSG qu'on lui prête. **MAIS** la promesse répétée dans CLAUDE.md/HANDOFF — « les pages `[locale]` restent SSG » — est **FAUSSE en l'état** : la quasi-totalité du site public rend en **dynamic (SSR par requête)**, pour deux raisons indépendantes du thème : (1) le **root `layout.tsx` appelle `getLocale()`** qui résout via `i18n/request.ts` → `await cookies()`, et (2) le **`Footer` (Server Component présent sur toutes les pages publiques) appelle `getShopSettings()` → `createSupabaseServerClient()` → `cookies()`. Le build de référence (`.next/`) ne prérend **aucune** page `[locale]` (0 fichier `.html`, `prerender-manifest.routes` = `{favicon, robots}` uniquement). C'est le finding **P0/P1** majeur de ce workstream (perf + coût + le `revalidate=…` de 14 pages est ignoré). Le reste = points sains + quelques P2.

## Findings détaillés

### WS01-01 · P1 · confirmé — Tout le site public rend en dynamic (SSG/ISR cassé) via `getLocale()` dans le root layout
- **Preuve** : `src/app/layout.tsx:52` `const locale = await getLocale()`. `getLocale()` (next-intl 4.12) résout le request config `src/i18n/request.ts`, qui appelle `await cookies()` (`request.ts:27`, lecture du cookie `farmau_admin_locale`). Le root layout ne peut pas appeler `setRequestLocale()` (il n'a pas le param `locale`). Lire `cookies()` dans un layout opt-out **tout l'arbre** en rendu dynamique.
- **Preuve build** (`.next/`, BUILD_ID `mc0huIvOlypohP4iWLUBn`, 28 mai 15:42) : `find .next/server/app -name "*.html"` → **0**. `prerender-manifest.json` → `routes` = `/favicon.ico`, `/robots.txt` seulement. Aucune des 28 pages `[locale]` n'est prérendue malgré 14 `export const revalidate`.
- **Impact** : les `revalidate=60/300/86400` posés sur home, catalogue, product, marques, besoins, blog, faq, legal, livraison, manifeste, pharmacie, a-propos sont **inopérants** — chaque hit = SSR complet + requêtes Supabase synchrones (home : bannières + bestsellers + tags ; catalogue : 500 produits + tags). Coût compute/DB par requête, TTFB plus élevé, pas de cache CDN edge HTML. Contredit la doc.
- **Reco** : faire que le root layout n'appelle **pas** `getLocale()`. Options : (a) hardcoder/passer la locale autrement pour `<html lang>` (les routes `[locale]` peuvent fournir `lang` via un layout intermédiaire, ou accepter `lang="fr"` au root puisque `[locale]/layout` setRequestLocale déjà) ; (b) déplacer l'injection thème + `<html>` sous une frontière qui a la locale. Ne PAS lire de cookie dans le chemin du root layout. (Voir aussi WS01-02 qui doit être corrigé conjointement, sinon le gain est nul.)
- **Effort** : M

### WS01-02 · P1 · confirmé — `Footer` (sur toutes les pages publiques) force dynamic via `getShopSettings()` → `cookies()`
- **Preuve** : `src/components/Footer.tsx:8` importe `getShopSettings` ; le composant l'appelle (async Server Component). `src/lib/getShopSettings.ts:47` `createSupabaseServerClient()` → `src/lib/supabaseServer.ts:10` `await cookies()`. Le `Footer` est rendu par 18/20 pages `[locale]` (grep `import Footer` : home, catalogue, product, marques, besoins, blog, faq, legal/*, livraison, manifeste, pharmacie, a-propos, contact, cart, reservation, favoris, not-found).
- **Impact** : **vecteur de dynamic indépendant de WS01-01** — même si on corrige le root layout, ces pages resteraient dynamic à cause du Footer. Idem `getShopSettings()` appelé directement dans plusieurs pages (a-propos, pharmacie). C'est aussi un mismatch avec `getThemeConfig` qui, lui, a justement été écrit « sans cookies » pour préserver le SSG — effort annulé par le Footer.
- **Reco** : lire `shop_settings` pour le Footer/pages éditoriales via un client **anon sans cookies + `unstable_cache`** sur le même modèle que `getThemeConfig.ts` (le tag pourrait être `shop-settings` invalidé par `/api/admin/settings`). `shop_settings` est en RLS public SELECT donc aucun besoin du contexte cookie. Conserver `getShopSettings()` cookie-based uniquement pour les pages déjà `force-dynamic` (account/*).
- **Effort** : M

### WS01-03 · P2 · confirmé — Pages à slug dynamique sans `generateStaticParams`
- **Preuve** : `grep generateStaticParams src/app` → **seul** `src/app/[locale]/layout.tsx:14` (les 3 locales). `product/[slug]`, `marques/[slug]`, `besoins/[slug]`, `blog/[slug]` n'en déclarent aucun.
- **Impact** : même après correction de WS01-01/02, ces pages ne seront pas prérendues au build → première visite = SSR (cold), puis cache ISR. Acceptable pour un catalogue qui évolue, mais le premier hit de chaque produit (353) paie le SSR. Pas bloquant V1.
- **Reco** : optionnel — `generateStaticParams` sur `product/[slug]` (slugs actifs) et `marques/[slug]` (faible cardinalité, 13 marques) pour prérendre les pages chaudes. Laisser blog/besoins en ISR pur.
- **Effort** : S

### WS01-04 · P2 · confirmé — `images.remotePatterns` ouvert (`hostname: '**'`)
- **Preuve** : `next.config.ts` `images.remotePatterns: [{ protocol:'https', hostname:'**', pathname:'/**' }]`.
- **Impact** : l'optimiseur d'images Next (`/_next/image`) peut être utilisé comme proxy/relais vers **n'importe quel** hôte HTTPS (abus de bande passante, SSRF léger, cache-poisoning d'images tierces). Les sources réelles sont Supabase Storage (URLs connues) + `cover_image_url` blog (saisie admin). Frontière archi trop large.
- **Reco** : restreindre `hostname` au domaine Supabase Storage (`*.supabase.co`) + éventuels CDN attendus. (Recoupe potentiellement un finding sécurité d'un autre WS — signalé ici sous l'angle frontière archi.)
- **Effort** : S

### WS01-05 · P2 · suspecté — Root layout passe la locale par défaut (`fr`) à `<html lang>` pour `/admin/*` et toutes routes non-`[locale]`
- **Preuve** : `src/app/layout.tsx:52` + commentaire l.49-51. Pour `/admin/*` (pas de segment locale), `getLocale()` retombe sur le cookie `farmau_admin_locale` ou `fr`. Le `<html lang>` admin reflète donc le cookie admin, pas un vrai contenu localisé page-par-page.
- **Impact** : mineur — l'admin est interne et mélange FR/ES/EN ; `lang` approximatif sans impact SEO (admin non indexé). À noter seulement car c'est le **même** appel `getLocale()` qui cause WS01-01 : la correction de WS01-01 doit préserver un `lang` raisonnable côté admin.
- **Reco** : lors du fix WS01-01, dériver `lang` admin du cookie sans repasser par le chemin `cookies()` global (ou accepter `fr`).
- **Effort** : S (couplé à WS01-01)

### WS01-06 · P2 · confirmé — `i18n/request.ts` lit `cookies()` même pour les routes `[locale]` (chemin chaud inutile)
- **Preuve** : `src/i18n/request.ts:20-31`. La branche cookie n'est censée servir que `/admin/*`, mais `getRequestConfig` s'exécute aussi pour les pages `[locale]` chaque fois que `getLocale()`/`getMessages()` est invoqué hors `setRequestLocale` résolu — et surtout pour le root layout (WS01-01). Quand `requestLocale` est défini (pages `[locale]` ayant fait `setRequestLocale`), la branche cookie est court-circuitée (`hasLocale(...) === true`), donc OK ; le coût réel vient du root layout qui n'a jamais `requestLocale`.
- **Impact** : confirme la racine de WS01-01 ; en soi pas un finding distinct mais documente pourquoi `getThemeConfig` (sans cookies) ne suffit pas à garder le SSG tant que `getLocale()` reste dans le root layout.
- **Reco** : voir WS01-01. Aucune action propre.
- **Effort** : —

## Tableau récapitulatif

| ID | Sév | Sujet | Fichier:ligne | Effort | État |
|---|---|---|---|---|---|
| WS01-01 | P1 | SSG cassé : `getLocale()` root layout → `cookies()` → tout dynamic | `src/app/layout.tsx:52` ; `src/i18n/request.ts:27` | M | confirmé |
| WS01-02 | P1 | `Footer`/`getShopSettings` → `cookies()` force dynamic sur ~18 pages | `src/components/Footer.tsx:8` ; `src/lib/getShopSettings.ts:47` ; `src/lib/supabaseServer.ts:10` | M | confirmé |
| WS01-03 | P2 | Pas de `generateStaticParams` sur les pages à slug | `product/[slug]`, `marques/[slug]`, `besoins/[slug]`, `blog/[slug]` | S | confirmé |
| WS01-04 | P2 | `images.remotePatterns` ouvert (`**`) — proxy image abusable | `next.config.ts` (images) | S | confirmé |
| WS01-05 | P2 | `<html lang>` admin dérivé du cookie via `getLocale()` global | `src/app/layout.tsx:52` | S | suspecté |
| WS01-06 | P2 | `request.ts` lit cookies dans le chemin chaud (racine de WS01-01) | `src/i18n/request.ts:20-31` | — | confirmé |

## Points sains confirmés

- **Frontière service-role étanche** : `supabaseAdmin` (`src/lib/supabaseAdmin.ts`) et `SUPABASE_SERVICE_ROLE_KEY` référencés uniquement côté serveur (`src/app/api/cart/route.ts`, routes `/api/admin/*`) ; aucun fichier `'use client'` ne l'importe. `SUPABASE_SERVICE_*` n'apparaît jamais dans un composant client.
- **3 clients Supabase bien cloisonnés** : browser (`supabaseClient.ts`, plus de fallback localStorage — audit sécu #4 tient), server cookies (`supabaseServer.ts`), service-role singleton typé (`supabaseAdmin.ts`). Usage cohérent par couche.
- **Système de thèmes correctement isolé** : `getThemeConfig()` (`src/lib/getThemeConfig.ts`) utilise un client **anon sans cookies** + `unstable_cache(tags:[THEME_CONFIG_TAG], revalidate:300)`. Il ne force PAS le dynamic par lui-même. `revalidateTag(THEME_CONFIG_TAG)` bien appelé au PATCH (`src/app/api/admin/appearance/route.ts:67`). Le script anti-flash est inline dans `<head>` (résout `data-mode` avant paint). L'admin est neutralisé `data-theme="terra"` (`_AdminShell.tsx:54`). Conception : OK. (Le seul souci est que le SSG visé est déjà cassé en amont — WS01-01/02 — pas par le thème.)
- **Middleware ordre & matcher corrects** : `src/middleware.ts` chaîne API/_next/fichiers → `/auth/*` passthrough → `/admin/*` (auth) → `intlMiddleware`. Admin utilise `getUser()` (validation JWT serveur, pas `getSession()`) + RPC `is_user_admin` (source unifiée). Matcher `'/((?!api|_next|.*\\..*).*)'` exclut bien API/statics. Les cookies posés sont `sameSite:'lax'` + `secure` en prod.
- **Layout `[locale]`** : `generateStaticParams` (3 locales), `setRequestLocale(locale)` appelé avant `getMessages()`, `hasLocale` guard + `notFound()`. Conforme aux conventions next-intl pour le rendu statique (la frontière est bonne ; c'est le root layout au-dessus qui casse tout).
- **`force-dynamic` justifié** : `account/*` (5 pages, user-dépendant), `reservation` + `reservation/confirmation/[id]` (panier/réservation user), `favoris` (wishlist), `admin/*` (client-gated). Le `catalogue` consomme `searchParams` donc dynamic est légitime là.
- **Dédup serveur** : `getShopSettings` enveloppé dans React `cache()` (dédup intra-render) ; `getThemeConfig` dans `unstable_cache` (dédup inter-requêtes). Pattern correct (le souci de WS01-02 est le `cookies()`, pas la dédup).
- **Pas de fuite de logique serveur en props** : `CatalogueClient` reçoit des données déjà sérialisées (produits mappés en POJO `CatalogueProduct`, `src/app/[locale]/catalogue/page.tsx:137-154`) ; aucun client/handler Supabase passé en prop.
- **Navigation next-intl** : helpers `Link/useRouter/usePathname/redirect` centralisés (`src/i18n/navigation.ts`). Convention respectée (login/signup utilisent volontairement `next/navigation` pour viser `/admin/*` non localisé, documenté).
- **Blog (nouveau)** : `blog/[slug]` sanitize via `DOMPurify.sanitize(post.body)` (`:113`), ISR `revalidate=60`, pas de frontière douteuse. (XSS = WS sécu, mais frontière rendu OK.)

## À confirmer DB live

Aucune requête DB nécessaire pour ce workstream (analyse statique du rendu). Pour quantifier l'impact perf de WS01-01/02 en conditions réelles, mesurer le TTFB de `/fr` en prod et observer le nombre de requêtes Supabase par hit (devrait montrer bestsellers+banners+tags+shop_settings à chaque requête, signe de dynamic). Côté DB, RLS public SELECT sur `shop_settings` est requis par la reco WS01-02 :

```sql
-- vérifier que shop_settings a bien une policy SELECT pour anon (requis pour le fix WS01-02 sans cookies)
select polname, polcmd, polroles::regrole[]
from pg_policy where polrelid = 'public.shop_settings'::regclass;
```

## Note de propreté

L'audit a involontairement créé un répertoire vide `.audit-tmp/` à la racine (workaround d'un tmpfs agent saturé). La suppression a été refusée par la deny-list. À retirer manuellement : `rmdir .audit-tmp`. Aucun autre fichier projet n'a été modifié (audit lecture seule).
