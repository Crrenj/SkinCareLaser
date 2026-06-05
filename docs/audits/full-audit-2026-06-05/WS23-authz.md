# WS23 — Authz & contrôle d'accès

**Périmètre** : `src/middleware.ts`, `src/lib/requireAdmin.ts`, `src/lib/safeRedirect.ts`, `src/app/auth/callback/page.tsx`, redirect login/signup (`src/app/[locale]/(auth)/{login,signup}/page.tsx`). Lecture annexe : `src/lib/csrf.ts`, `src/lib/constants.ts`, `src/hooks/useIsAdmin.ts`, `src/app/admin/_AdminShell.tsx`, `src/app/[locale]/account/layout.tsx`, `src/components/auth/OAuthButtons.tsx`, `src/app/api/admin/users/[id]/route.ts`, `src/app/api/admin/set-locale/route.ts`, RPC `is_user_admin` (baseline).
**Fichiers lus** : 13 · **Lignes parcourues (approx.)** : ~1 050
**Synthèse** : P0=0 · P1=1 · P2=1 · P3=3

## Findings

### [WS23-01] Open-redirect résiduel sur le signup auto-login — P1
- **Fichier** : `src/app/[locale]/(auth)/signup/page.tsx:134-139`
- **Catégorie** : sécurité
- **Constat** : sur la branche auto-login (`data.session` présent), la destination est validée par un check inline maison :
  ```js
  const nextParam = new URLSearchParams(window.location.search).get('next')
  const dest = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/'
  router.push(dest)
  ```
  Ce check **n'utilise pas** `safeRedirectPath` (contrairement à login + callback). Il bloque `//evil.com` mais **laisse passer** les vecteurs que `safeRedirect` couvre explicitement :
  - **backslash** `\` : `/\evil.com` passe (`startsWith('/')` vrai, `startsWith('//')` faux), or les navigateurs normalisent `\`→`/` → la nav devient protocol-relative `//evil.com` = redirection **externe**. Vérifié : le check inline retourne `true` pour `/\evil.com` alors que `safeRedirectPath` le rejette (3 garde-fous : `startsWith('/\\')`, `startsWith('//')`, `includes('\\')`).
  - pas de rejet du percent-encoding (`/%2f%2fevil.com`), pas de re-check après décodage, pas de blocage `..`.
  C'est précisément le « finding historique open-redirect » : le commit de durcissement `f908ec1` (« audit Lanjo », 2026-06-05) a câblé `safeRedirectPath` dans **login + auth/callback uniquement** (cf. `git show --stat f908ec1` : touche `login/page.tsx` + `callback/page.tsx`, **pas** `signup/page.tsx`). Le signup a été retouché pour la dernière fois en `ec6a6d0` (2026-06-01), *avant* le durcissement → il a été oublié.
- **Impact** : un attaquant forge `https://farmau.do/fr/signup?next=/\evil.com`. Comme le signup est désormais auto-login (session immédiate, décision intentionnelle), un visiteur qui crée un compte depuis ce lien est redirigé vers `evil.com` **après authentification réussie** → phishing crédible (page de phishing « connexion expirée » servie juste après un vrai signup FARMAU). Surface plus étroite que login (ne s'arme qu'au moment d'un signup réussi avec session), mais exploitable sur le marché cible.
- **Reco** : remplacer le bloc par `const dest = safeRedirectPath(nextParam) ?? '/'` (importer `safeRedirectPath` déjà présent dans le repo). Idéalement préfixer la locale comme le fait `auth/callback` (sinon `next=/catalogue` envoie sur `/catalogue` non-localisé → re-redirect intl, comportement mineur). Ajouter un cas de test `signup` analogue à ceux de `safeRedirect.test.ts`.
- **Confiance** : haute

### [WS23-02] Gate `/account/*` sur `getSession()` (cookie non validé) au lieu de `getUser()` — P2
- **Fichier** : `src/app/[locale]/account/layout.tsx:17-23` (et `:28-30` pour le check admin)
- **Catégorie** : sécurité
- **Constat** : le layout `/account` (toutes les pages compte : profil, réservations, sécurité, préférences) protège l'accès via `supabase.auth.getSession()`, qui se contente de **lire/décoder le cookie local sans appel de validation au serveur Supabase**. Tout le reste du système d'authz a délibérément migré vers `getUser()` (validation JWT côté serveur) : middleware (`middleware.ts:87`, commentaire explicite « audit security #11 »), `requireAdmin` (`requireAdmin.ts:39`), `requireSuperAdmin` (`requireAdmin.ts:127`). `account/layout.tsx` est l'**exception** restante côté gating de page. Le `is_user_admin` RPC qui suit (ligne 28) est lui aussi alimenté par `session.user.id` issu du cookie non vérifié.
- **Impact** : risque limité en pratique (les données sensibles de `/account` sont aussi protégées par RLS côté DB, et le contenu réellement servi passe par des requêtes Supabase qui revalident). Mais c'est une **incohérence de la défense en profondeur** : un cookie forgé/expiré mais structurellement valide peut faire passer le gate de layout (le rendu SSR du shell `/account` se fait pour un user non vraiment authentifié) là où middleware/admin le rejetteraient. La prop `isAdmin` calculée ici sert juste à afficher un lien « Panneau admin » (cosmétique), donc pas d'élévation, mais le pattern divergent est un piège pour les évolutions futures.
- **Reco** : remplacer `getSession()` par `getUser()` dans `account/layout.tsx` (récupérer `user` puis utiliser `user.id` pour le RPC), aligné sur middleware/requireAdmin. Coût ~50-200 ms, acceptable comme partout ailleurs.
- **Confiance** : moyenne

### [WS23-03] Deux sources de vérité pour le check admin (RPC vs lookup table direct) — P3
- **Fichier** : `src/lib/requireAdmin.ts:69-73` (lookup direct `admin_users` via service-role) vs `src/middleware.ts:106-108` + `auth/callback/page.tsx:68` + `useIsAdmin.ts:56` + `account/layout.tsx:28` (RPC `is_user_admin`)
- **Catégorie** : archi
- **Constat** : `requireAdmin` interroge directement `admin_users` en service-role, tandis que tout le reste appelle la RPC `is_user_admin`. Le commentaire `requireAdmin.ts:55-58` assume ce choix (« on a déjà supabaseAdmin sous la main »). Les deux lisent la même table donc le résultat est aujourd'hui identique. CLAUDE.md affirme pourtant « `is_user_admin` est la source de vérité unifiée : middleware, requireAdmin helper, … lisent tous la RPC » — c'est **faux pour `requireAdmin`** (écart doc vs code).
- **Impact** : pas de faille actuelle, mais si la logique « est admin » évolue (ex. rôle désactivé, colonne `is_active`, expiration), il faudra penser à modifier **deux** chemins ; un oubli créerait une divergence d'autorisation entre les routes API (`requireAdmin`) et le middleware/UI (RPC). Dette de cohérence.
- **Reco** : soit faire passer `requireAdmin` par la RPC `is_user_admin` (un appel de plus mais une seule définition de « admin »), soit documenter explicitement dans CLAUDE.md que `requireAdmin` lit la table en direct (corriger l'affirmation « unifiée »). À minima factoriser un helper `isUserAdmin(userId)` réutilisé partout.
- **Confiance** : haute

### [WS23-04] `redirectedFrom` posé non encodé dans `_AdminShell` — P3
- **Fichier** : `src/app/admin/_AdminShell.tsx:77,79`
- **Catégorie** : bug
- **Constat** : `window.location.href = \`/login?redirectedFrom=${pathname}\`` (et la variante `&error=unauthorized` ligne 79) injecte `pathname` brut dans la querystring sans `encodeURIComponent`. Le middleware fait pareil (`middleware.ts:97`, via `searchParams.set` qui lui encode correctement) ; mais ici c'est une concaténation de chaîne directe. `account/layout.tsx:23` et `favoris/page.tsx:57`, eux, encodent (`encodeURIComponent`).
- **Impact** : faible. `pathname` vient de `usePathname()` (= le chemin courant réel, contrôlé par le navigateur de l'utilisateur lui-même), donc pas un vecteur d'injection cross-user. Au pire, un chemin admin contenant un `?`/`#`/`&` casserait le parsing du `next`/`redirectedFrom` au login (la cible de retour serait tronquée). Aucun chemin admin actuel ne contient ces caractères → impact théorique. Côté open-redirect c'est sans danger car login revalide via `safeRedirectPath`.
- **Reco** : `redirectedFrom=${encodeURIComponent(pathname)}` sur les deux lignes, par cohérence avec les autres appelants.
- **Confiance** : haute

### [WS23-05] Callback : `next`/`stored` OK mais le préfixe locale n'est re-validé qu'implicitement — P3
- **Fichier** : `src/app/auth/callback/page.tsx:87-103`
- **Catégorie** : sécurité
- **Constat** : la cible est correctement durcie par `safeRedirectPath(nextParam ?? stored) ?? '/'` (ligne 87). Le `localeParam` (ligne 82) est ensuite validé contre `routing.locales` avant d'être préfixé (ligne 97-99) → bon. Seul point : la concaténation `\`/${targetLocale}${candidate}\`` (ligne 100) reconstruit une chaîne à partir d'un `candidate` déjà validé interne — pas de re-validation du résultat, mais comme `targetLocale ∈ {fr,es,en}` et `candidate` commence forcément par `/` (garanti par `safeRedirectPath`) ou vaut `/`, le résultat reste interne. Pas de faille, je le note pour traçabilité (le pattern « valider l'entrée puis reconstruire » est correct ici, contrairement au signup où la validation initiale est faible — WS23-01).
- **Impact** : aucun défaut concret trouvé. Mention de complétude.
- **Reco** : RAS (laisser tel quel). Optionnel : passer `safeRedirectOr` pour homogénéiser le style.
- **Confiance** : haute

## Points positifs (court)
- **`safeRedirect.ts` est solide** : couvre schéma absolu, protocol-relative (`//`, `/\`), backslash, `%2f`/`%5c`, traversal `..` brut + décodé, percent-encoding malformé, avec fallback re-validé dans `safeRedirectOr`. 6 tests unitaires verts. Login + callback l'utilisent correctement.
- **`getUser()` (JWT validé serveur) bien appliqué** sur les deux chemins critiques : middleware admin (`middleware.ts:87`) et `requireAdmin`/`requireSuperAdmin` — fail-closed sur erreur (`catch` → redirect/`401`).
- **Garde-fous super-admin complets** (`requireAdmin.ts:122-162` + `users/[id]/route.ts:34-66`) : `requireSuperAdmin` côté serveur, anti-auto-modification (`cannot_modify_self`), anti-modification d'un autre super_admin (`cannot_modify_super_admin`) → anti-orphelinage/anti-coup effectif, pas seulement masquage UI. Body validé Zod.
- **Toutes les 28 routes `/api/admin/*` ont un guard** (`requireAdmin` ou `requireSuperAdmin`) — scan exhaustif, zéro route oubliée. CSRF par Origin centralisée dans le guard (y compris GET).
- **Middleware fail-closed sur le check admin** : `is_user_admin` renvoyant `null` (erreur RPC) est traité comme non-admin (`if (!isAdmin)` → redirect). Le matcher exclut `api`/`_next`/fichiers à extension sans créer de bypass admin (aucun fichier `admin.*` à extension n'existe).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `OAuthButtons.tsx:32` place `next` brut dans l'URL de callback sans le valider en amont — sans danger car `auth/callback` revalide via `safeRedirectPath`, mais le param transite non filtré (défense en profondeur seule au retour).
- `set-locale/route.ts` pose le cookie `farmau_admin_locale` en `httpOnly: false` — acceptable (préférence de locale non sensible, validée Zod, `sameSite=lax` + `secure` en prod), juste à confirmer comme intentionnel.
- `useIsAdmin.ts:36` + `account/layout.tsx` font confiance à `getSession()` côté client/SSR pour l'affichage — cohérent côté UI mais à recouper avec WS24 (le vrai contrôle doit rester RLS + guards serveur).
- RPC `is_user_admin` est `SECURITY DEFINER` + `STABLE` et garde le GRANT `anon` (intentionnel, ne pas révoquer) — sujet RLS, du ressort de WS24.

## Zones non couvertes / à re-vérifier humainement
- **Exploitabilité réelle du `/\evil.com` (WS23-01)** : confirmée par analyse statique du check + comportement de normalisation backslash des navigateurs ; non rejouée dans un vrai navigateur (audit lecture seule). À valider en QA navigateur (Chrome/Safari) que `router.push('/\\evil.com')` quitte bien l'origine.
- **TOCTOU** : aucun écart trouvé dans le périmètre — chaque guard revérifie `getUser()` + admin à chaque requête (pas de cache d'autorisation entre check et action). La révocation d'un admin (`users/[id]` DELETE) prend effet à la requête suivante (le JWT déjà émis reste « user authentifié » jusqu'à expiration, mais perd `is_admin` immédiatement car la RPC/lookup relit la table). Comportement attendu, à garder en tête pour la révocation d'urgence.
- **Cohérence du `next` non-localisé au login** : `login/page.tsx` ne re-préfixe pas la locale (contrairement à callback) ; un `redirectedFrom=/admin/...` (non-localisé, correct) marche, mais un `next=/catalogue` finirait sur un chemin non-localisé géré par l'intl middleware au prochain hop. Comportement, pas un bug de sécurité — à confirmer côté UX (hors périmètre sécu).
