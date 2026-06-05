# WS13 — Shell admin + tableau de bord

**Périmètre** : `src/app/admin/layout.tsx`, `src/app/admin/_AdminShell.tsx`, `src/app/admin/page.tsx`, `src/app/admin/error.tsx`, `src/app/admin/_dashboard/data.ts`, `src/components/admin/dashboard/*` (24 fichiers : tous les widgets + Sidebar, PageHeader, HeaderTools, AdminModeContext, StatCard, MeterBar, MiniStat, WidgetCard, DashboardSectionHeader, StatusBadge)
**Fichiers lus** : 29 (28 périmètre + supports : `useIsAdmin`, `supabaseAdmin`, `requireAdmin`, `formatPrice`, `reservation`, routes `set-locale`/`sidebar-stats`/`theme`, `layout.tsx` root, migrations reservations, `globals.css`)
**Lignes parcourues (approx.)** : ~2 100
**Synthèse** : P0=0 · P1=0 · P2=4 · P3=7

Le périmètre est **sain**. L'isolation service-role est correcte (aucune fuite client), l'auth-gate est juste, les calculs d'agrégation sont exacts. Les constats sont des cas-limites de correction (config Next contradictoire mais inoffensive, calcul de tendance/conversion imprécis sur des fenêtres décalées) et de la dette (feature WhatsApp morte, valeur stock trompeuse avec prix placeholder).

## Findings

### [WS13-01] Feature « 💬 cliente abrió WhatsApp » morte — toujours `false` — P2
- **Fichier** : `src/app/admin/_dashboard/data.ts:183` + `src/components/admin/dashboard/RecentReservationsWidget.tsx:11,29,61-65`
- **Catégorie** : bug | logique-métier
- **Constat** : `fetchRecentReservations` mappe **`whatsappOpened: false`** en dur (aucune colonne `reservations` ne trace cet événement — vérifié : `grep "whatsapp" supabase/migrations` ne renvoie que `contact_phone`). Pourtant le widget rend conditionnellement une pastille 💬 sur `r.whatsappOpened` et son sous-titre **annonce** « Últimas N · 💬 = cliente abrió WhatsApp » (ligne 28-30).
- **Impact** : la légende promet une information qui ne s'affiche **jamais** ; l'admin attend un signal qui n'arrive pas. Code et type (`whatsappOpened: boolean`) portés sans source. Dette qui simule une fonctionnalité.
- **Reco** : soit câbler un vrai tracking (colonne `whatsapp_opened_at` + endpoint), soit retirer le champ du type, le mapping `false`, le bloc `{r.whatsappOpened && …}` et la mention de la légende.
- **Confiance** : haute

### [WS13-02] `export const dynamic = 'force-dynamic'` neutralise `export const revalidate = 300` — P2
- **Fichier** : `src/app/admin/page.tsx:39-40`
- **Catégorie** : perf | dette
- **Constat** : les deux exports coexistent. `force-dynamic` force `cache: 'no-store'` / SSR à chaque requête → `revalidate = 300` (ISR 5 min) devient un **no-op**. Le commentaire du `metadata`/route laisse penser à un cache de 5 min qui n'existe pas. Chaque hit du dashboard relance les ~11 requêtes de `getDashboardData()`.
- **Impact** : intention de cache trompeuse (la doc CLAUDE.md dit « revalidate=300 » comme s'il s'appliquait). Léger surcoût : chaque chargement du dashboard = ~20 requêtes Supabase (cf. WS13-03). Pas bloquant — l'admin n'est pas un chemin chaud.
- **Reco** : choisir une seule sémantique. Si on veut vraiment du SSR frais (cohérent avec un dashboard temps réel), **supprimer `revalidate = 300`** (mort). Si un léger cache suffit, retirer `force-dynamic` et garder `revalidate` (mais alors `cookies()`/`getLocale()` re-forcent dynamic de toute façon → garder force-dynamic et drop revalidate est le choix net).
- **Confiance** : haute

### [WS13-03] « Valor stock » additionne des prix placeholder (100 DOP) → chiffre faux à ce stade — P2
- **Fichier** : `src/app/admin/_dashboard/data.ts:300` (`stockValue += Number(p.price ?? 0) * s`) ; affiché par `InventoryWidget.tsx:84-90`
- **Catégorie** : logique-métier | data
- **Constat** : `stockValue` somme `price × stock` sur **tous** les produits actifs, y compris les 353/353 encore à `price = 100` (placeholder, cf. CLAUDE.md). Le widget affiche `{fmt(data.stockValue)} DOP` comme une vraie valorisation, et n'affiche le caveat « precio placeholder » (`allPlaceholder`, ligne 57-58/88-90) **que si 100 % des actifs sont placeholder** — dès qu'un seul prix réel est saisi, le badge disparaît mais la valeur reste largement fictive (100 DOP × stock pour le reste).
- **Impact** : KPI financier visible affichant ~50 × 353 × 100 ≈ une valeur sans rapport avec la réalité, sans avertissement dès qu'un prix réel existe. Risque de décision (réassort, comptabilité) sur un chiffre faux.
- **Reco** : exclure les lignes placeholder du `stockValue` (ou afficher en parallèle « hors placeholder »), et lier le caveat à `placeholderPriced > 0` plutôt qu'à l'égalité stricte avec `activeProducts`.
- **Confiance** : moyenne (le stade « tous placeholder » est temporaire mais le seuil d'alerte tout-ou-rien est le vrai défaut)

### [WS13-04] Tendances et conversion calculées sur des fenêtres temporelles incohérentes — P2
- **Fichier** : `src/components/admin/dashboard/RevenueWidget.tsx:40-42` + `src/app/admin/_dashboard/data.ts:42-68`
- **Catégorie** : logique-métier
- **Constat** : deux imprécisions cumulées. (a) **Tendance** : `current` = jours 7→13 (aujourd'hui inclus = jour **partiel**), comparé à `previous` = jours 0→6 (semaines complètes). Le « +X % vs semana anterior » compare donc 6 jours pleins + 1 jour partiel à 7 jours pleins → biais systématiquement baissier en début/milieu de journée. (b) **Conversion** : `conversion = confirmedNow / reservedNow` (ligne 42) divise le *confirmé du jour J* par le *réservé du jour J*, alors qu'une réservation créée aujourd'hui est rarement confirmée le même jour (TTL 24 h) — la confirmation arrive sur une réservation d'un **autre** jour de la fenêtre. Le « tasa de conversión » mélange numérateur et dénominateur de cohortes différentes.
- **Impact** : KPI affichés (trend %, conversion %) systématiquement imprécis. Non bloquant (indicatif), mais induit en erreur si lu littéralement.
- **Reco** : pour la tendance, comparer des fenêtres de même nature (J-7→J-1 vs J-14→J-8, en excluant le jour courant partiel) ou normaliser au prorata. Pour la conversion, la calculer sur une **cohorte** (réservations créées sur la période, % passées à confirmed/collected) plutôt que sum/sum journalier.
- **Confiance** : moyenne

### [WS13-05] `useIsAdmin` ignore `USER_UPDATED`/`TOKEN_REFRESHED` → un retrait d'admin n'est pas reflété sans reload — P3
- **Fichier** : `src/hooks/useIsAdmin.ts:67-81` (consommé par `_AdminShell.tsx:27,74-81`)
- **Catégorie** : sécurité (faible) | bug
- **Constat** : `onAuthStateChange` ne re-vérifie l'admin status que sur `SIGNED_OUT` et `SIGNED_IN` avec changement d'ID. Si un super_admin **révoque** un admin pendant sa session (suppression de la ligne `admin_users`), le hook continue d'afficher `isAdmin=true` jusqu'à un rechargement complet (le check ne rejoue pas). À noter : c'est un gating **UI** ; les routes `/api/admin/*` re-valident via `requireAdmin()` à chaque appel (vérifié), donc pas d'action privilégiée réelle possible — l'utilisateur révoqué voit juste la coquille admin vide d'API.
- **Impact** : faible. Décalage cosmétique de gating côté client après révocation. Aucune élévation de privilège (l'API reste fermée).
- **Reco** : acceptable en l'état (l'intention « ne pas re-loading au focus de tab » est documentée et justifiée). Si on veut être strict, re-checker périodiquement ou sur `visibilitychange` avec debounce. Ne pas casser le fix anti-flash existant.
- **Confiance** : haute

### [WS13-06] `revalidateOnFocus: false` + `dedupingInterval: 60_000` sur `/api/theme` dans `_AdminShell` → un changement d'apparence met jusqu'à 60 s à se refléter dans le shell admin — P3
- **Fichier** : `src/app/admin/_AdminShell.tsx:35-38`
- **Catégorie** : bug (mineur) | dette
- **Constat** : le SWR du thème admin désactive la revalidation au focus et dédoublonne sur 60 s. La doc affirme que `/apariencia` save → `globalMutate('/api/theme')` met à jour « en live ». C'est vrai **dans l'onglet où on save** (mutate force), mais un autre onglet admin ouvert, ou le retour sur l'onglet admin après un changement, ne re-fetchera pas avant 60 s (pas de revalidate au focus). Le `useEffect` ligne 43-46 lit `<html data-theme>` **uniquement au mount**, pas en navigation SPA.
- **Impact** : faible. Décalage visuel transitoire du thème dans le chrome admin (≤ 60 s) dans les cas multi-onglets. Le site public, lui, a `ThemeFavicon` qui réécrit `data-theme` à chaque nav (hors périmètre).
- **Reco** : acceptable. Si on veut un live strict, réactiver `revalidateOnFocus` pour ce SWR (coût négligeable, `/api/theme` est `no-store` léger).
- **Confiance** : moyenne

### [WS13-07] Sparkline `fontFamily="JetBrains Mono"` ne matche pas la famille hashée de next/font → fallback mono système — P3
- **Fichier** : `src/components/admin/dashboard/RevenueWidget.tsx:241`
- **Catégorie** : dette (cosmétique)
- **Constat** : `next/font` (`layout.tsx:26-31`) génère un nom de famille **hashé** exposé via `--font-jetbrains` (utilisé dans `globals.css:57` comme `--font-mono`). Le `<g fontFamily="JetBrains Mono">` du SVG référence le **nom littéral** « JetBrains Mono » qui n'est pas chargé sous ce nom → les labels de jours (L M M J V S D) tombent en mono système. Les autres usages mono passent par la classe Tailwind `font-mono` (correct).
- **Impact** : purement visuel, micro-incohérence typographique sur 7 lettres d'un graphe.
- **Reco** : utiliser `fontFamily="var(--font-mono)"` (ou `var(--font-jetbrains)`) dans le `<text>` SVG, ou retirer l'attribut (héritera de la police du conteneur).
- **Confiance** : haute

### [WS13-08] Redirect auth-gate construit l'URL avec `pathname` brut (locale absente + non encodé) — P3
- **Fichier** : `src/app/admin/_AdminShell.tsx:77,79`
- **Catégorie** : bug (mineur) | a11y/ux
- **Constat** : `window.location.href = \`/login?redirectedFrom=${pathname}\`` injecte `pathname` sans `encodeURIComponent`. Les routes admin (`/admin/...`) n'ont pas de query strings ni de caractères spéciaux en pratique, donc inoffensif aujourd'hui ; mais `/login` est localisé (`[locale]`) et la cible non préfixée `/login` repassera par le middleware next-intl (redirection vers `/{locale}/login`) — le `redirectedFrom=/admin/...` survit, mais l'absence d'encodage reste une fragilité si un segment futur contient `&`/`#`/espaces.
- **Impact** : très faible aujourd'hui (chemins admin propres). Pas d'open-redirect ici (valeur passée en query, pas suivie en redirection côté ce fichier — la cible est fixe `/login`).
- **Reco** : `encodeURIComponent(pathname)` par robustesse. (Note : l'open-redirect réel à auditer est côté `/login` qui *consomme* `redirectedFrom` — hors périmètre WS13.)
- **Confiance** : haute

### [WS13-09] `RecentMessagesWidget` : double découpage et logique de bordure incohérente — P3
- **Fichier** : `src/components/admin/dashboard/RecentMessagesWidget.tsx:54,59`
- **Catégorie** : dette
- **Constat** : `rows.slice(0, 5)` (ligne 54) puis la condition de bordure utilise `i < rows.length - 1` (ligne 59) — `rows.length` (jusqu'à 5, source garantit déjà 5) au lieu de la longueur du tableau slicé. Si `rows` faisait > 5, la dernière cellule visible (index 4) garderait sa bordure droite car `4 < length-1`. En pratique `fetchRecentMessages` limite déjà à 5 (`data.ts:194`), donc inoffensif. Smell de robustesse.
- **Impact** : nul aujourd'hui (toujours ≤ 5). Bordure droite parasite sur la dernière colonne si la source changeait.
- **Reco** : factoriser `const visible = rows.slice(0,5)` et itérer/comparer sur `visible`.
- **Confiance** : haute

### [WS13-10] `relativeTime` (mensajes) et `todayLabel` (page) recalculés côté serveur en UTC sans timezone RD → libellés « Hace X min » potentiellement décalés — P3
- **Fichier** : `src/components/admin/dashboard/RecentMessagesWidget.tsx:12-24` ; `src/app/admin/page.tsx:42-48`
- **Catégorie** : i18n | data
- **Constat** : `relativeTime` est exécuté **côté serveur** (composant non-client, rendu dans la page server) avec `Date.now()` du serveur (UTC sur Vercel) ; `Intl.DateTimeFormat('es-DO', …)` formate la date mais le calcul de « hace X » repose sur l'horloge serveur. `todayLabel` formate le jour avec `new Date()` serveur sans `timeZone` → en soirée RD (UTC-4), le serveur peut déjà être au lendemain → « jour » du header décalé. Pas de re-render client (composants server) donc pas d'hydration mismatch, mais l'heure affichée est l'heure serveur, pas RD.
- **Impact** : faible. Libellés temporels et « día de hoy » potentiellement décalés de quelques heures / d'un jour en bord de minuit RD.
- **Reco** : passer `timeZone: 'America/Santo_Domingo'` aux `Intl.DateTimeFormat` et ancrer les calculs relatifs sur cette TZ, ou rendre ces libellés côté client.
- **Confiance** : moyenne

### [WS13-11] `_AdminShell` : redirection via `window.location.href` dans un `useEffect` non gardée contre les renders multiples — P3
- **Fichier** : `src/app/admin/_AdminShell.tsx:74-81`
- **Catégorie** : dette
- **Constat** : quand `!user` après `loading=false`, l'effet pose `window.location.href`. Comme `window.location.href` est asynchrone, et que `pathname` est dans les deps, un changement de route avant que la navigation hard ne prenne pourrait ré-déclencher l'assignation. Inoffensif (assigner deux fois la même URL est idempotent), mais le pattern `window.location.href` (full reload) plutôt qu'un `router.replace` casse la SPA et perd l'état — choix probablement délibéré pour forcer un re-bootstrap propre de l'auth.
- **Impact** : nul fonctionnellement. Full reload sur accès non autorisé (acceptable, rare).
- **Reco** : aucune action requise ; éventuellement `router.replace` pour rester en SPA. Documenté comme intentionnel ailleurs.
- **Confiance** : moyenne

## Points positifs (court)
- **Isolation service-role exemplaire** : `_dashboard/data.ts` importe `supabaseAdmin` (lui-même `import 'server-only'`), n'est consommé **que** par `page.tsx` (Server Component, vérifié par grep) ; aucune donnée brute service-role ne franchit la frontière client — seuls des agrégats typés sont passés en props.
- **Auth-gate correcte et bien pensée** : spinner uniquement `loading && !user` (anti-flash au retour de tab), double check (`app_metadata.role` JWT rapide → fallback RPC `is_user_admin`), et les routes `/api/admin/*` re-valident toutes via `requireAdmin()` (CSRF origin + getUser + admin_users). Le gating UI n'est pas la seule barrière.
- **Piège thème respecté** : `_AdminShell` pose `data-theme={siteTheme}` **et** `text-ink-900` sur le `<div>` racine (ligne 109), conformément au piège d'héritage de couleur documenté ; lit `<html data-theme>` au mount (source fraîche) + `/api/theme` pour le live.
- **Teintes Tailwind v4 toutes définies** : tous les utilitaires de couleur des widgets (`ink-200/500/700/800/900`, `clay-200/700/800`, `olive-600`, `brick-600`, `ochre-600`, `sand-50→300`) sont déclarés dans `globals.css` (vérifié) — aucun élément invisible par teinte manquante.
- **`Promise.all` partout** : `getDashboardData` parallélise 11 fetchers, et `fetchCatalogue`/`fetchEngagement`/`fetchContent` parallélisent leurs sous-requêtes ; usage systématique de `head: true, count: 'exact'` pour les comptages (pas de transfert de lignes inutile).
- **Exactitude des comptages clés** : score de complétude (moyenne des taux par champ), distribution stock (oos/low/inStock mutuellement exclusifs), `activeCarts` (Set de `cart_id` distincts), `confirmedRevenue` (confirmed+collected) — tous corrects.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `/login` consomme `redirectedFrom`/`next` : vérifier l'open-redirect réel (WS auth) — WS13 ne fait que produire la valeur.
- `db/schema.sql` ne liste pas `products.is_new/old_price/is_featured` (snapshot périmé connu) alors que `data.ts` et `database.types.ts` les utilisent — divergence de doc à régénérer.
- `formatPrice` par défaut (`page.tsx`/widgets via `fmt0`) ignore le `locale` admin courant : les montants DOP sont toujours formatés en `es-DO` même si l'admin est en FR/EN (cohérent avec l'espagnol-en-dur du dashboard, mais à noter).
- `RecentMessagesWidget` affiche `m.preview` = corps brut du message (`contact_messages.message`) en clair dans le dashboard — vérifier l'échappement/longueur côté source (XSS improbable car texte, mais à confirmer WS messages).

## Zones non couvertes / à re-vérifier humainement
- **Rendu visuel mode sombre admin** : non vérifié en navigateur ; les bandes décoratives sombres et le contraste des badges `StatusBadge` (ex. `expired` = `bg-sand-300 text-ink-800`) en mode dark admin restent à valider visuellement (limite connue « mode sombre neuf »).
- **Exactitude des chiffres en prod** : les calculs ont été audités sur le code ; je n'ai pas exécuté de `SELECT` de contrôle pour comparer (ex. `stockValue` réel, `activeCarts`) — à recouper si un doute métier survient.
- **Comportement `force-dynamic` au build** : confirmé via tsc/lecture, pas via un `next build` complet (non lancé pour rester read-only et rapide).
