# WS17 — Admin Messages/Tickets + Settings + Setup

**Périmètre** : `src/app/admin/messages/page.tsx` + `_components/{MessageDetailModal,MessageHelpers}.tsx` + `_hooks/useMessagesData.ts` + `_lib/types.ts` ; `src/app/admin/settings/page.tsx` ; `src/app/admin/setup/page.tsx`. (Routes API lues en appui : `/api/admin/messages`, `/api/admin/settings`, `/api/admin/products` ; migration `20260604130000_tickets_system.sql` ; `apiError`, `supabaseAdmin`, `requireAdmin`, `schemas.ts`, `env.ts`.)
**Fichiers lus** : 7 de périmètre + ~9 d'appui · **Lignes parcourues (approx.)** : ~1 200
**Synthèse** : P0=0 · P1=2 · P2=4 · P3=4

## Findings

### [WS17-01] Messages : plafond dur de 10 tickets, aucune pagination — recherche/filtre ne voient que les 10 derniers — P1
- **Fichier** : `src/app/admin/messages/_hooks/useMessagesData.ts:14-32` (loadMessages) + `src/app/api/admin/messages/route.ts:18-26` (defaults `page=1`, `limit=10`) + `src/app/admin/messages/page.tsx:26-34` (filtrage client)
- **Catégorie** : bug / logique-métier
- **Constat** : `loadMessages` ne pose dans l'URL que `status` ; il n'envoie **jamais** `page` ni `limit`. La route applique alors ses valeurs par défaut (`limit=10`). La page n'a **aucun contrôle de pagination** (l'objet `pagination` renvoyé par l'API n'est consommé nulle part, cf. WS17-02). Le filtre catégorie et la recherche (`page.tsx:26-34`) s'appliquent **côté client uniquement, sur ce sous-ensemble de 10**. Dès la 11ᵉ ligne, un ticket devient invisible : il n'apparaît ni dans la liste, ni dans la recherche, ni via un filtre catégorie. Seuls les compteurs KPI (issus de la RPC `get_messages_stats`, qui scanne toute la table) restent justes — ce qui rend l'incohérence encore plus trompeuse (le KPI « 25 ouverts » alors que la liste n'en montre que 10).
- **Impact** : sur un site lancé, l'admin perd l'accès à l'historique des tickets/support au-delà des 10 plus récents. Pour un système qui se présente comme un outil de support, c'est une perte fonctionnelle réelle.
- **Reco** : soit ajouter un état `page` + contrôles de pagination consommant `data.pagination`, soit (plus simple vu le volume attendu) charger un `limit` élevé (ex. `params.set('limit', '200')`) et garder le filtrage/recherche client. Idéalement déporter recherche + filtre catégorie côté serveur pour rester cohérent avec les KPI.
- **Confiance** : haute

### [WS17-02] `/api/admin/messages` : `pagination.total` toujours 0 (count jamais demandé) — P2
- **Fichier** : `src/app/api/admin/messages/route.ts:22-26, 32, 46-47`
- **Catégorie** : bug
- **Constat** : le `.select('*')` n'inclut **pas** `{ count: 'exact' }` (contrairement à `/api/admin/products:35`). `count` est donc toujours `null` → `total: count || 0` = **0** et `totalPages` = 0. Confirme le rappel WS21. Dans le périmètre WS17, cette valeur n'est **pas consommée** par la page messages (elle s'appuie sur `stats`), donc l'impact direct ici est nul — mais l'objet `pagination` entier est mort et trompeur pour tout futur consommateur.
- **Impact** : aucune régression visible aujourd'hui ; piège latent (un dev qui branchera la pagination via `total` aura 0 partout). Couplé à WS17-01 si on choisit la voie « vraie pagination ».
- **Reco** : ajouter `{ count: 'exact' }` au `.select()` (le filtre `status` est appliqué sur la même requête, donc le count sera correctement filtré). Ou supprimer l'objet `pagination` si on ne pagine jamais.
- **Confiance** : haute

### [WS17-03] `/admin/setup` : détection de configuration cassée → faux diagnostic « tout manquant » — P2
- **Fichier** : `src/app/admin/setup/page.tsx:23-46`
- **Catégorie** : bug
- **Constat** : la heuristique teste `res.status === 500 && data.message?.includes('SUPABASE_SERVICE_KEY')`. Or quand la clé service-role est absente, `/api/admin/products` répond `{ error: 'Configuration serveur manquante' }` (`products/route.ts:13`) — champ **`error`**, pas `message`, et la chaîne ne contient **jamais** `SUPABASE_SERVICE_KEY`. Toutes les autres erreurs 500 passent par `apiError` qui renvoie aussi `{ error: <message générique> }` (jamais `message`, jamais le nom de la variable — c'est volontaire, `apiError.ts:8-13`). Conséquence : la branche « service key manquante » est **morte** ; un 500 réel tombe dans le `else` final qui marque les **trois** variables (URL, ANON, SERVICE) en rouge avec un message générique — diagnostic faux et alarmiste (l'URL et l'anon key sont en réalité présentes côté serveur). De plus la page ne peut **rien** confirmer côté serveur : elle infère l'état d'`env` depuis un seul appel produits.
- **Impact** : outil de diagnostic trompeur. En cas de vrai souci de config, il pointe vers les mauvaises variables. Faible portée (page admin orpheline, cf. WS17-04) mais activement contre-productif quand on en a besoin.
- **Reco** : exposer un vrai endpoint de diag (`GET /api/admin/health`) renvoyant des booléens `{ supabaseUrl, anonKey, serviceKey }` calculés côté serveur depuis `env.ts`, et faire lire ça à la page ; ou aligner la heuristique sur le contrat réel (`data.error?.includes('Configuration serveur manquante')`). À défaut, supprimer la page (cf. WS17-04).
- **Confiance** : haute

### [WS17-04] `/admin/setup` orpheline + lien mort vers `/GUIDE_ADMIN_PRODUCTS.md` (404) — P2
- **Fichier** : `src/app/admin/setup/page.tsx:189` (lien) ; absence de lien entrant (vérifié `grep -rn "/admin/setup" src/` → aucun résultat hors la page elle-même ; absente de `Sidebar.tsx`)
- **Catégorie** : dette / bug
- **Constat** : (a) la page n'est référencée **nulle part** (ni sidebar, ni dashboard, ni `QuickActionsWidget`) → accessible seulement en tapant l'URL. (b) Le lien « guide » pointe vers `href="/GUIDE_ADMIN_PRODUCTS.md"` : aucun fichier de ce nom dans `public/` ni à la racine servie → **404** garanti. (c) Le CTA succès renvoie vers `/admin/product` (OK) mais la landing/réf de l'admin est `/admin` (dashboard) depuis `ea67dc9` — petite dérive.
- **Impact** : code mort à maintenir, lien cassé visible si on atteint la page, diagnostic faussé (WS17-03). Pas de fuite de secret (la page n'affiche que des booléens présent/absent, jamais les valeurs).
- **Reco** : soit supprimer `/admin/setup` (recommandé : sa fonction « la service key est-elle là ? » est obsolète puisque le projet tourne), soit la réparer (WS17-03) **et** la câbler dans la sidebar + héberger réellement le guide ou retirer le lien.
- **Confiance** : haute (orpheline + lien mort) / moyenne (sur l'opportunité de suppression vs réparation)

### [WS17-05] Settings PATCH : aucune validation de format (email / téléphone / WhatsApp) — P2
- **Fichier** : `src/app/api/admin/settings/route.ts:58-101` (aucun `parseBody`/Zod) ; surface côté UI `settings/page.tsx:144-172`
- **Catégorie** : data / logique-métier
- **Constat** : contrairement aux autres routes admin (le projet revendique « toutes validées Zod via `schemas.ts` »), la route settings n'a **aucun schéma**. Le PATCH coerce chaque champ allow-listé en `String(raw)` (ou `null` si vide) et l'écrit verbatim. L'`<input type="email">`/`type="tel"` côté client ne contraint rien à la soumission (la validation HTML native ne bloque que sur un submit standard ; ici les champs ne sont pas `required` sauf `shop_name`, et un format invalide passe). Un `whatsapp_number` mal saisi (espaces, lettres, format non-E.164) est stocké tel quel et réinjecté dans les liens `wa.me/<number>` publics → lien cassé silencieux. Même chose pour `contact_email`.
- **Impact** : un simple typo admin casse des liens WhatsApp / mailto sur les pages publiques (`/contact`, `/pharmacie`, footer) sans aucun retour d'erreur. Risque faible (admin-only) mais réel pour un site en prod.
- **Reco** : ajouter un schéma Zod `settingsPatch` (email `.email()`, normalisation du WhatsApp vers chiffres/`+`, longueurs max) et le passer via `parseBody`, à l'image des autres routes admin.
- **Confiance** : haute

### [WS17-06] Système « tickets » sans réponse ni notes internes : `admin_notes` / `replied_by_user` déclarés mais inertes — P3
- **Fichier** : `src/app/admin/messages/_lib/types.ts:14,19` ; `MessageDetailModal.tsx` (aucun champ de saisie) ; `useMessagesData.ts` (jamais envoyé) ; schéma `schemas.ts:124` accepte pourtant `admin_notes`
- **Catégorie** : dette / logique-métier
- **Constat** : `ContactMessage.admin_notes` et `replied_by_user` sont dans le type, et `messagePatch` accepte `admin_notes` (max 4000) + horodate `replied_at`/`replied_by` côté route. Mais l'UI **n'expose ni champ « notes internes » ni mécanisme de réponse** : le modal n'affiche que le message, un select priorité, et des boutons de transition de statut. Passer à `resolved` pose `replied_at = now()` (`useMessagesData.ts:57-62`) alors qu'aucune réponse n'a été rédigée → le libellé `metaRepliedAt` (« traité le ») est posé sans contenu. Le « centre de support » se réduit donc à un changement de statut. `grep -rn "admin_notes|replied_by_user" src/app/admin/messages/` → uniquement la déclaration de type.
- **Impact** : fonctionnalité annoncée (tickets/support, audit-trail « répondu par ») non réalisée ; champs de type morts ; `replied_at` sémantiquement faux (= « marqué résolu », pas « répondu »). Aucun bug bloquant.
- **Reco** : soit ajouter un `<textarea>` admin_notes (déjà supporté par la route) + sémantique de réponse claire, soit retirer `admin_notes`/`replied_by_user` du type et renommer la clé i18n `metaRepliedAt` en « résolu le » pour refléter la réalité.
- **Confiance** : haute

### [WS17-07] Dirty-check Settings par `JSON.stringify` complet (faux positifs possibles) + payload sur tout `EDITABLE_FIELDS` — P3
- **Fichier** : `src/app/admin/settings/page.tsx:64` (isDirty) et `71-73` (payload)
- **Catégorie** : perf / smell
- **Constat** : `isDirty = JSON.stringify(data) !== JSON.stringify(form)`. `data` est l'objet complet de `shop_settings` (inclut `updated_at`, `updated_by`, colonnes `shipping_*` inertes, etc.), `form` est une copie modifiée des seuls champs éditables. Tant que l'ordre des clés est stable (même source `data`), ça marche, mais la comparaison porte sur **toute** la ligne alors que seuls 9 champs sont éditables — fragile si un champ non éditable change côté serveur entre deux fetch. Le payload (`Object.fromEntries(EDITABLE_FIELDS.map…)`) envoie **toujours les 9 champs**, même ceux non modifiés (la route les ré-écrit). Bénin (single-row, faible fréquence) mais c'est un PATCH non minimal.
- **Impact** : risque marginal de bouton « modifications non enregistrées » affiché à tort ; écritures redondantes. Aucun bug utilisateur observé.
- **Reco** : comparer/n'envoyer que le diff sur `EDITABLE_FIELDS` (`EDITABLE_FIELDS.some(f => data[f] !== form[f])` ; payload restreint aux champs réellement changés). Optionnel.
- **Confiance** : moyenne

### [WS17-08] `/admin/setup` : couleurs Tailwind littérales non thémées (green/blue/gray/red/yellow) — P3
- **Fichier** : `src/app/admin/setup/page.tsx:65-67, 77, 121, 136, 146, 156-179, 189-200`
- **Catégorie** : dette / a11y
- **Constat** : la page utilise massivement `text-green-500`, `text-red-500`, `bg-blue-50`, `bg-gray-900`, `text-white`, `bg-yellow-50`… Ces teintes ne sont **pas** déclarées comme tokens d'apparence dans `globals.css` (vérifié : `grep -oE "--color-(green|blue|gray|red|yellow)-[0-9]+" globals.css` → vide) ; ce sont les couleurs par défaut Tailwind, **insensibles au thème** et au mode clair/sombre admin. La page ne se re-thématise donc pas et peut présenter du contraste discutable en mode sombre (texte `text-white` sur `bg-green-600`, etc.). Seule surface admin restante hors système de tokens (`sand`/`ink`/`clay`…).
- **Impact** : incohérence visuelle avec le reste de l'admin (6 palettes × clair/sombre) ; faible car page de diag rarement vue. Pas un blocage.
- **Reco** : migrer vers les tokens d'apparence (`bg-olive-600`/`brick-600`/`ink-900`/`sand-*`) comme le reste de l'admin — ou supprimer la page (WS17-04) ce qui clôt le point.
- **Confiance** : haute

### [WS17-09] Dépendances mortes `useEffect` (lint OK mais re-fetch superflu via `t`) — P3
- **Fichier** : `src/app/admin/setup/page.tsx:20-61` (checkConfiguration dépend de `t`)
- **Catégorie** : perf / smell
- **Constat** : `checkConfiguration` est un `useCallback([t])`, et `t` (next-intl) change d'identité quand la locale admin change → relance un fetch `/api/admin/products?limit=1` au switch de langue. Bénin (1 requête, page rarement ouverte), mais la dépendance `t` n'est utile que pour des messages d'erreur et provoque un effet réseau non désiré.
- **Impact** : négligeable. Noté pour exhaustivité.
- **Reco** : sortir les libellés d'erreur du callback (les calculer au rendu) et retirer `t` des deps, ou ignorer.
- **Confiance** : moyenne

## Points positifs (court)
- **Sécurité solide** sur les routes d'appui : `requireAdmin()` (validation JWT serveur + `admin_users` source de vérité + **origin/CSRF check** ligne 33) sur GET/PATCH/DELETE messages et settings ; allow-list explicite des champs en PATCH settings ; `apiError` ne fuit jamais `error.message` brut au client.
- **Pas de XSS** dans le rendu des tickets : `message.message` et `subject` sont rendus en texte (`whitespace-pre-wrap`), jamais via `dangerouslySetInnerHTML`.
- **i18n exemplaire** sur ce périmètre : `Admin.{messages,settings,setup}` en **parité parfaite FR/ES/EN** (45/45/45, 38/38/38, 25/25/25) et **toutes les clés référencées existent** (aucune clé manquante détectée dans les composants).
- **A11y du modal correcte** : `useModalA11y` (focus trap + Escape + scroll lock), `role="dialog"` + `aria-modal` + `aria-labelledby`, `aria-label` sur le bouton fermer, libellés `sr-only` sur la recherche, icônes décoratives `aria-hidden`.
- **Migration tickets** propre et idempotente (`20260604130000`) : CHECK constraints, migration des anciennes valeurs de statut, RPC `SECURITY DEFINER` avec `search_path` figé et GRANT durci (service_role only).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `MessageDetailModal` et `ConfirmDialog` n'utilisent pas la primitive partagée `Scrim`/`PopClose` (CLAUDE.md recommande de les réutiliser pour tout nouveau drawer/modal) — divergence mineure.
- La RPC `get_messages_stats` est rappelée à **chaque** `loadMessages` (changement de filtre statut) alors que les stats sont globales et indépendantes du filtre → appel redondant (à mémoriser/dissocier) — cause hors `_hooks` mais à confirmer.
- `/api/admin/products` est utilisée par `/admin/setup` comme sonde de config — couplage fragile entre une page de diag et une route métier (devrait être un `/health` dédié).

## Zones non couvertes / à re-vérifier humainement
- **Nettoyage requis (non-code)** : le filesystem temp de l'agent était plein pendant l'audit ; j'ai dû pointer `TMPDIR` vers `/.audit-tmp-ws17` (dossier **vide**, aucun fichier écrit dedans). `rm`/`rmdir` étant en deny-list, **je n'ai pas pu le supprimer** — à retirer manuellement (`rmdir .audit-tmp-ws17`). Aucun fichier de code n'a été modifié.
- Comportement réel de la pagination messages **non testé en navigateur** : confirmer empiriquement qu'au-delà de 10 tickets les suivants sont bien invisibles (déduit du code, confiance haute).
- Le volume réel de `contact_messages` n'a pas été interrogé (MCP) ; l'impact de WS17-01 dépend du nombre de tickets en prod (faible aujourd'hui, croissant après lancement).
- Contraste exact des couleurs littérales de `/admin/setup` en mode sombre non mesuré (WS17-08) — visuel à valider si la page est conservée.
