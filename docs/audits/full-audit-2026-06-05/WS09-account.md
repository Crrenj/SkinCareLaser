# WS09 — Hub compte (`/account/*`)

**Périmètre** : `src/app/[locale]/account/layout.tsx`, `account/profile/page.tsx`, `account/reservations/page.tsx`, `account/security/page.tsx`, `account/preferences/page.tsx`, `src/components/account/{AccountSidebar,PreferencesForm,SecurityActions}.tsx`
**Fichiers lus** : 8 (périmètre) + 8 de contexte (`supabaseServer`, `middleware`, `csrf`, `safeRedirect`, `reservation`, `ProfileEditForm`, `api/newsletter`, `api/account/preferences`)
**Lignes parcourues (approx.)** : ~900
**Synthèse** : P0=0 · P1=1 · P2=3 · P3=4

## Findings

### [WS09-01] Le gate d'auth de tout `/account/*` repose sur `getSession()` (cookie non validé), pas `getUser()` — incohérent avec la décision sécu du projet — P1
- **Fichier** : `src/app/[locale]/account/layout.tsx:18-24`
- **Catégorie** : sécurité
- **Constat** : Le layout `/account` est l'**unique** point de contrôle d'accès aux pages compte — le middleware ne couvre PAS `/account/*` (seul `/admin` passe par `adminAuthMiddleware` ; `account/*` tombe dans la branche `intlMiddleware`, cf. `middleware.ts:38-44`, aucune vérif d'auth). Or ce gate utilise `supabase.auth.getSession()`, qui **se contente de lire/décoder le cookie sans valider le JWT côté serveur Supabase**. C'est exactement le pattern que le projet a **délibérément abandonné ailleurs** pour des raisons de sécurité : le middleware admin (`middleware.ts:82-90`) et `requireAdmin` (`requireAdmin.ts:37`) sont passés à `getUser()` avec un commentaire explicite (« getUser() valide le JWT cryptographiquement, contrairement à getSession() qui se contente de lire le cookie ») au titre de l'« audit security #11 ». Le layout `/account` n'a jamais été aligné. Détail aggravant : les pages enfant ré-appellent `getUser()` pour récupérer l'user (`profile/page.tsx:36-38`, etc.) — donc la session est **revalidée deux fois pour rien** dans le cas nominal, mais la **décision d'accès** (le `redirect` ligne 22) reste prise sur la base non validée.
- **Impact** : Faiblesse de défense en profondeur sur l'espace privé (profil, téléphone, historique de réservations, dernière connexion, droit à l'oubli). Un cookie de session forgé/altéré/expiré mais structurellement décodable peut faire **passer le gate** (le `redirect` n'est pas déclenché) ; les pages enfant feraient ensuite `getUser()` → `user` peut être `null` → le `user!.id` (non-null assertion, `profile/page.tsx:44`, `reservations/page.tsx:72`, `security/page.tsx:36`, `preferences/page.tsx:38`) lève alors une exception serveur (500) plutôt qu'un redirect propre. Risque réel limité (forger un cookie Supabase valide-en-apparence est non trivial), mais c'est une régression nette du standard que le projet s'est lui-même fixé, sur la surface la plus sensible après l'admin.
- **Reco** : Remplacer par `const { data: { user } } = await supabase.auth.getUser()` et `if (!user) redirect(...)`. Réutiliser `user.id` pour l'appel `is_user_admin` (déjà fait via `session.user.id` → `user.id`). Les pages enfant peuvent alors garder leur `getUser()` (cache de requête Supabase SSR → pas de double appel réseau réel) ou recevoir l'user en prop. Aligne `/account` sur `/admin`/`requireAdmin`.
- **Confiance** : haute (sur l'incohérence et le pattern) / moyenne (sur l'exploitabilité réelle d'un forge de cookie)

### [WS09-02] Open-redirect possible via `?from=` au profil — non passé par `safeRedirectPath` alors que login/callback le font — P2
- **Fichier** : `src/app/[locale]/account/profile/page.tsx:50,84` → `src/components/ProfileEditForm.tsx:101-103`
- **Catégorie** : sécurité
- **Constat** : `profile/page.tsx` lit `from` brut depuis `searchParams` (ligne 50) et le passe tel quel en `redirectTo={from}` (ligne 84). `ProfileEditForm` exécute `router.push(redirectTo)` après sauvegarde (ligne 103) **sans aucune sanitisation**. Le codebase dispose pourtant d'un helper dédié `safeRedirectPath` (`src/lib/safeRedirect.ts`) — utilisé par `login/page.tsx:53,105` et `auth/callback/page.tsx:87` avec un commentaire visant explicitement le vecteur `?redirectedFrom=//evil.com`. Les appelants internes légitimes ne passent que `from=/reservation` (`reservation/page.tsx:55`, `ReservationClient.tsx:126`), mais `from` reste **entièrement contrôlable par l'attaquant** via une URL forgée `/{locale}/account/profile?from=//evil.com` (ou `https://evil.com`, `javascript:` n'est pas concerné car `router.push` est un push de route).
- **Impact** : Redirection post-action vers un domaine externe (phishing). Atténuation partielle : `router` ici est le `useRouter` de next-intl (`@/i18n/navigation`), qui préfixe la locale aux chemins — un `//evil.com` *peut* être transformé en chemin interne préfixé selon la version de next-intl. Mais (a) c'est un comportement incident d'une lib tierce, fragile à reposer pour une frontière de sécurité, et (b) l'auteur du login a jugé ce vecteur suffisamment réel pour le défendre explicitement → l'incohérence est le vrai défaut. Interaction requise élevée (victime connectée + clic URL forgée + soumission du formulaire profil) → P2.
- **Reco** : Dans `profile/page.tsx`, sanitiser : `redirectTo={safeRedirectPath(from)}` (importer `@/lib/safeRedirect`). Ou faire le guard dans `ProfileEditForm` avant `router.push`. Aligne le comportement sur login/callback.
- **Confiance** : haute (guard manquant, incohérence avérée) / moyenne (exploitabilité dépend du préfixage next-intl)

### [WS09-03] Re-toggle newsletter envoie un POST `{}` qui suit le chemin « public » sans CSRF complet et ne re-confirme jamais — état UI désync possible — P2
- **Fichier** : `src/components/account/PreferencesForm.tsx:40-65` (cause partagée avec `src/app/api/newsletter/route.ts:39-90`)
- **Catégorie** : bug | logique-métier
- **Constat** : Le toggle de réabonnement (`handleToggleNewsletter`, branche `else`) POST `/api/newsletter` avec `body: JSON.stringify({})`. Côté API, l'absence de `body.email` déclenche le lookup de l'email via la session (`route.ts:39-47`), met `confirmed_at` immédiatement (car `useDoubleOptIn = !!resend && !!body.email` est `false` sans `body.email`). **Problème 1** : si un abonnement existe déjà en base avec `confirmed_at = NULL` (inscription publique non confirmée pour ce même email), le re-toggle authentifié percute le conflit `UNIQUE` (`error.code === '23505'`, `route.ts:87`) et renvoie `{ ok: true }` **sans confirmer la ligne** — l'UI passe à `subscribed = true` (`PreferencesForm.tsx:58`) alors que l'abonnement reste *pending*. **Problème 2** : le commentaire interne du composant (lignes 50-55) signale lui-même la fragilité de ce contournement (« POST publique attend `{ email, lang }` »). Le `GET /api/newsletter` retourne `subscribed` sur **présence d'une ligne** (`route.ts:144-155`, `select('id')`), pas sur `confirmed_at` → la notion d'« abonné » est incohérente entre POST (pose `confirmed_at`), GET (présence), et la réalité métier (confirmé).
- **Impact** : L'utilisateur peut croire être (ré)abonné alors que la ligne reste non confirmée ; aucune erreur affichée. Cas limite (nécessite une ligne pending préexistante pour le même email), mais c'est une désynchronisation silencieuse de l'état d'abonnement.
- **Reco** : Côté API, sur `23505` lors d'un réabonnement authentifié, faire un `UPDATE … SET confirmed_at = now(), confirmation_token = NULL WHERE email = …` (upsert de confirmation) au lieu d'un no-op. Aligner la sémantique de `GET` sur `confirmed_at IS NOT NULL`. (Cause majoritairement dans la route API — hors périmètre strict WS09 ; voir hors-périmètre.)
- **Confiance** : moyenne

### [WS09-04] `PreferencesForm` ne resynchronise pas l'état au focus / après navigation — fetch unique au mount — P3
- **Fichier** : `src/components/account/PreferencesForm.tsx:25-38`
- **Catégorie** : bug
- **Constat** : L'état `subscribed` est chargé une seule fois via un `useEffect([])` (fetch impératif, pas SWR). Si l'utilisateur (dé)abonne depuis un autre onglet, ou change l'abonnement ailleurs (footer newsletter), cette page ne reflète pas le changement sans rechargement complet. Le reste du projet utilise SWR pour ce genre d'état partagé (`useCart`, `useWishlist`).
- **Impact** : Affichage potentiellement périmé du toggle newsletter. Faible (page peu visitée, état peu volatil).
- **Reco** : Soit migrer vers SWR (`/api/newsletter`) pour bénéficier du revalidate-on-focus, soit accepter en l'état (page de préférences, refresh manuel acceptable). À prioriser bas.
- **Confiance** : haute

### [WS09-05] Mailto « suppression de compte » : corps de message en français en dur, hors i18n — P3
- **Fichier** : `src/app/[locale]/account/security/page.tsx:112-116`
- **Catégorie** : i18n
- **Constat** : Le `subject` (`[FARMAU] Suppression du compte …`) et le `body` (« Bonjour, … droit à l'oubli (Ley 172-13 RD)… Cordialement, ») du lien `mailto:` sont écrits en français en dur, alors que toute l'UI environnante passe par `getTranslations('Account.security')`. Un utilisateur en `/es/account/security` ou `/en/account/security` voit l'UI traduite mais un brouillon d'email en français. La convention projet (« tout texte UI passe par les traductions ») est violée ici.
- **Impact** : Incohérence linguistique pour les utilisateurs ES/EN sur une action sensible (RGPD/Ley 172-13). Mineur (le contenu reste compréhensible et l'email part au bon destinataire).
- **Reco** : Externaliser `subject`/`body` dans `Account.security` (clés `dangerMailSubject`/`dangerMailBody` avec interpolation `{email}`) pour les 3 locales, comme le reste du namespace.
- **Confiance** : haute

### [WS09-06] `SecurityActions` : reset password sans rate-limit applicatif ni feedback générique — énumération/abus d'email possible — P3
- **Fichier** : `src/components/account/SecurityActions.tsx:24-33`
- **Catégorie** : sécurité
- **Constat** : `handleResetPassword` appelle directement `supabase.auth.resetPasswordForEmail(email, …)` côté client. L'email est celui de la session (`security/page.tsx:36`), donc pas d'énumération d'un tiers ici (bon point). Mais il n'y a aucun rate-limit applicatif côté projet — la protection repose entièrement sur les quotas Supabase (GoTrue) ; un clic répété envoie autant d'emails que GoTrue l'autorise. Pas de garde-fou contre le spam d'emails de reset sur sa propre adresse. (À distinguer du flux public `/forgot-password` qui pourrait, lui, énumérer — hors périmètre.)
- **Impact** : Faible (limité à l'email de l'utilisateur connecté ; GoTrue applique ses propres limites). Smell plus que faille.
- **Reco** : S'appuyer sur le rate-limit GoTrue (configurer dans le dashboard Supabase) ; éventuellement désactiver le bouton quelques secondes après envoi (déjà `disabled` une fois `sent`, ce qui couvre l'essentiel). Acceptable en l'état pour V1.
- **Confiance** : moyenne

### [WS09-07] Non-null assertions (`user!`) dans les pages enfant → 500 au lieu d'un redirect si le gate layout est contourné — P3
- **Fichier** : `profile/page.tsx:44,53,83` · `reservations/page.tsx:72` · `security/page.tsx:36-37,44` · `preferences/page.tsx:38`
- **Catégorie** : dette | bug
- **Constat** : Chaque page enfant fait `await supabase.auth.getUser()` puis utilise `user!.id` / `user!.email` en supposant la garantie du layout. Le commentaire de `profile/page.tsx:35` l'assume explicitement. Couplé à WS09-01 (gate sur `getSession()`), si jamais le gate laisse passer une requête dont `getUser()` renvoie `null`, on obtient une `TypeError` serveur (500) au lieu d'une redirection propre vers `/login`.
- **Impact** : Robustesse. Surface une erreur 500 dans un cas limite plutôt qu'un comportement gracieux. Lié à WS09-01 ; se résorbe largement si WS09-01 passe à `getUser()` dans le layout.
- **Reco** : Soit corriger WS09-01 (alors les assertions deviennent cohérentes), soit ajouter un fallback `if (!user) redirect(...)` en tête de chaque page (défense en profondeur), soit passer l'user en prop depuis le layout.
- **Confiance** : haute

## Points positifs (court)
- **Isolation des données par utilisateur correcte** : `reservations/page.tsx:72` filtre `.eq('user_id', user!.id)` (aucune fuite cross-user) ; `profile`/`preferences` filtrent `.eq('id', user!.id)`. Pas d'IDOR dans le périmètre.
- **`noindex` + `disallow` cohérents** : les 4 pages posent `robots: { index:false, follow:false }` et `/account/` est dans `robots.ts` (ligne 14). `force-dynamic` partout (pas de SSG d'une page privée).
- **Pont admin propre** (`AccountSidebar.tsx:74-84`) : `isAdmin` calculé server-side via `is_user_admin` (layout:28-30), `NextLink` brut vers `/admin` (non localisé) avec commentaire justifiant le choix — conforme au modèle « un user, deux casquettes ».
- **a11y sidebar correcte** : `aria-current={active ? 'page' : undefined}`, `<nav aria-label>`, focus-visible sur le select des préférences (`PreferencesForm.tsx:170`), `role="alert"` sur le bandeau « téléphone requis » (`profile/page.tsx:73`).
- **CSRF respecté sur le PATCH préférences** : `api/account/preferences` appelle `guardMutation` + valide la locale en allowlist (pas de confiance au client).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `api/newsletter/route.ts` : le `DELETE` (et le `GET`) n'appellent **pas** `guardMutation`/CSRF (seul `POST` le fait) — DELETE auth-only state-changing sans garde Origin (préflight CORS atténue, mais incohérent).
- `api/newsletter/route.ts:87-90` : conflit `23505` traité en succès silencieux sans confirmer/mettre à jour la ligne existante (cause profonde de WS09-03).
- `ProfileEditForm.tsx:101-103` : `router.push(redirectTo)` sans `safeRedirectPath` (récepteur du vecteur WS09-02 ; le fix peut aussi vivre ici).
- Brief mentionne « lien WhatsApp » dans l'historique réservations : le code lie en réalité vers `/reservation/confirmation/{id}` (`reservations/page.tsx:185`) — pas de lien WhatsApp côté user (il est côté admin). Écart doc/réalité, pas un bug.

## Zones non couvertes / à re-vérifier humainement
- **Exploitabilité réelle de l'open-redirect WS09-02** : dépend du comportement exact de `next-intl` v4.12 `useRouter().push('//evil.com')` (préfixe-t-il systématiquement la locale, neutralisant le vecteur ?). À tester en navigateur. Le guard reste recommandé indépendamment.
- **Forge de cookie de session (WS09-01)** : la gravité dépend de la robustesse du décodage `getSession()` de `@supabase/ssr` face à un cookie altéré. Non testé dynamiquement ici.
- **Quotas GoTrue reset password (WS09-06)** : vérifier la config rate-limit côté dashboard Supabase (hors repo).
