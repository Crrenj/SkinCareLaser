# WS08 — Pages Auth

**Périmètre** : `src/app/[locale]/(auth)/{login,signup,forgot-password,reset-password}/page.tsx`, `src/components/auth/{AuthLayout,OAuthButtons,PasswordInput,PasswordStrength}.tsx`, `src/components/ProfileEditForm.tsx`, `src/components/AuthProvider.tsx`. Lus en contexte (hors périmètre) : `src/lib/safeRedirect.ts`, `src/hooks/useAuth.ts`, `src/app/auth/callback/page.tsx`, `src/app/[locale]/account/profile/page.tsx`, trigger `handle_new_user`, advisors Supabase.
**Fichiers lus** : 14 · **Lignes parcourues (approx.)** : ~1 300
**Synthèse** : P0=0 · P1=1 · P2=4 · P3=4

## Findings

### [WS08-01] Open-redirect au profil : `from` passé brut à `router.push` — P1
- **Fichier** : `src/components/ProfileEditForm.tsx:101-103` (cible posée par `src/app/[locale]/account/profile/page.tsx:50,84`)
- **Catégorie** : sécurité
- **Constat** : `account/profile/page.tsx` lit `searchParams.from` sans aucun assainissement (ligne 50) et le passe en prop `redirectTo` (ligne 84). `ProfileEditForm` fait ensuite `router.push(redirectTo)` (ligne 103) **sans** `safeRedirectPath`. Le helper `safeRedirect.ts` (qui bloque `//evil.com`, `/\evil.com`, `javascript:`, `%2f`, traversal) existe et est utilisé partout ailleurs (login, auth/callback) — mais pas ici. Le `router` est celui de `@/i18n/navigation` (next-intl) ; une cible `//evil.com` ou `/\evil.com` est traitée comme externe par le navigateur après normalisation.
- **Impact** : un attaquant forge `…/account/profile?from=//evil.com`, l'envoie à un utilisateur connecté ; après sauvegarde du profil (action légitime fréquente), redirection silencieuse vers un site de phishing. Vecteur d'hameçonnage post-action authentifiée. C'est le finding **WS09-02** confirmé côté code WS08.
- **Reco** : dans `ProfileEditForm`, remplacer `setTimeout(() => router.push(redirectTo), 1200)` par `router.push(safeRedirectPath(redirectTo) ?? '/account/profile')` ; idéalement aussi assainir `from` côté serveur dans `profile/page.tsx`. Réutiliser `safeRedirectPath` déjà importable.
- **Confiance** : haute

### [WS08-02] Open-redirect au signup (auto-login) : check inline plus faible que `safeRedirectPath` — P2
- **Fichier** : `src/app/[locale]/(auth)/signup/page.tsx:134-139`
- **Catégorie** : sécurité
- **Constat** : après auto-login, la destination est calculée par un check **ad hoc** `nextParam.startsWith('/') && !nextParam.startsWith('//')` au lieu de `safeRedirectPath`. Ce check laisse passer le vecteur **backslash** `/\evil.com` (que `safeRedirect.ts` bloque explicitement ligne 26 + test dédié) : les navigateurs normalisent `\`→`/`, donc `/\evil.com` devient `//evil.com` = protocol-relative → hôte externe. Il ne décode pas non plus `%5c`/`%2f`. C'est le finding **WS23-01** confirmé.
- **Impact** : open-redirect post-signup via `…/signup?next=/\evil.com`. Surface plus étroite que WS08-01 (signup d'un nouveau compte vs profil d'un compte existant) mais réel ; incohérent avec login/callback qui sont durcis.
- **Reco** : remplacer le bloc 135-138 par `const dest = safeRedirectPath(new URLSearchParams(window.location.search).get('next')) ?? '/'`. Le module est déjà disponible (`@/lib/safeRedirect`).
- **Confiance** : haute

### [WS08-03] Mots de passe faibles/compromis acceptés (gate = longueur ≥ 8 seule) — P2
- **Fichier** : `src/app/[locale]/(auth)/signup/page.tsx:59,23` + `src/components/auth/PasswordStrength.tsx:8-15` + config Supabase Auth
- **Catégorie** : sécurité
- **Constat** : la seule contrainte avant submit est `password.length < MIN_PASSWORD_LENGTH (=8)`. `PasswordStrength` est **purement indicatif** (son propre commentaire l.6-15 le dit) — aucune complexité requise. Côté serveur, l'advisor Supabase `auth_leaked_password_protection` est **désactivé** (vérifié via `get_advisors`), donc la vérification HaveIBeenPwned n'est pas active. Conséquence : `12345678`, `password`, `aaaaaaaa` sont acceptés à l'inscription **et** à la réinitialisation (`reset-password/page.tsx:74` applique le même gate).
- **Impact** : comptes triviallement brute-forçables / bourrage d'identifiants. Pour une pharmacie stockant nom + téléphone + email + date de naissance (PII RD), c'est une faiblesse réelle.
- **Reco** : activer « Leaked password protection » dans Supabase Auth (gain immédiat, zéro code) ; optionnellement exiger `scorePassword(pw) >= 2` avant submit (déjà calculé). Aligner le minimum client (8) sur le minimum serveur configuré.
- **Confiance** : haute (advisor confirmé ; gate de longueur confirmé dans le code)

### [WS08-04] reset-password : erreur de lien expiré en hash-flow non détectée — P2
- **Fichier** : `src/app/[locale]/(auth)/reset-password/page.tsx:30-67`
- **Catégorie** : bug
- **Constat** : l'effet lit l'erreur uniquement dans la **query** (`searchParams.get('error')`, l.32) et ne scanne le **hash** que pour `access_token` (l.40-41). Or, en flux implicite/hash, Supabase renvoie un lien de récupération expiré sous forme de **fragment** (`#error=access_denied&error_code=otp_expired&error_description=…`), pas en query. Ce cas tombe alors en étape 4 (`getSession()`, l.64) : s'il subsiste une session valide (utilisateur déjà connecté dans l'onglet), l'écran affiche le **formulaire** au lieu de « lien expiré » ; sinon il affiche « expired » par défaut mais sans le messaging dédié. (Le flux PKCE `?code=` gère bien l'expiration via le `.catch` de `exchangeCodeForSession`, l.59.)
- **Impact** : messaging d'expiration incohérent / trompeur en hash-flow ; dégradation gracieuse existante donc pas bloquant, mais UX confuse sur un parcours sensible. Sévérité dépend du `flowType` Supabase configuré.
- **Reco** : parser aussi `window.location.hash` pour `error`/`error_code` au début de l'effet et basculer en `stage='expired'` ; aligner sur ce que fait déjà la détection de hash pour `access_token`.
- **Confiance** : moyenne (dépend du flow type Supabase actif ; logique de fallback atténue)

### [WS08-05] Signup : double écriture du profil (metadata + UPDATE redondant) — P2
- **Fichier** : `src/app/[locale]/(auth)/signup/page.tsx:113-126`
- **Catégorie** : archi / perf
- **Constat** : `signUp()` envoie déjà `first_name/last_name/phone/birth_date` dans `options.data` (l.80-85) → `raw_user_meta_data` → le trigger `handle_new_user` (`SECURITY DEFINER`, migration `20260523113000`) **insère intégralement** ces colonnes dans `profiles`. Immédiatement après, la page refait un `.update()` client (l.114-122) sur les **mêmes** colonnes. C'est un aller-retour réseau redondant qui peut aussi **courir contre** le trigger (l'UPDATE peut frapper avant que la ligne du trigger n'existe — atténué par le délai de 400 ms plus bas, mais non garanti). L'erreur éventuelle est seulement loguée (l.124-125), jamais affichée.
- **Impact** : round-trip inutile + fenêtre de course bénigne ; complexité superflue sur un flux critique. Pas de corruption (le trigger gagne sur le contenu), mais code mort fonctionnel.
- **Reco** : supprimer le `.update()` (l.113-126) — le trigger suffit ; ou, si on veut garder un filet, ne le faire que de façon idempotente après confirmation que la ligne existe. Réduit la surface du handler.
- **Confiance** : haute (trigger lu, colonnes identiques)

### [WS08-06] Énumération de comptes au signup (vs forgot-password qui la masque) — P3
- **Fichier** : `src/app/[locale]/(auth)/signup/page.tsx:89-96`
- **Catégorie** : sécurité
- **Constat** : avec la confirmation email désactivée (intentionnel ; vérifié : 0 utilisateur non confirmé), `signUp()` sur un email déjà pris renvoie une erreur que la page traduit en message explicite `emailAlreadyUsed` (l.96). Cela **confirme l'existence** d'un compte. À l'inverse, `forgot-password/page.tsx:25-27` masque correctement l'énumération (success systématique). Asymétrie de posture.
- **Impact** : un attaquant peut tester l'existence d'emails via le signup. Faible (l'info fuit déjà par d'autres canaux Supabase ; et c'est une UX courante), mais incohérent avec l'effort anti-énumération de forgot-password.
- **Reco** : choix produit assumable. Si on veut durcir : message générique « si cet email n'est pas déjà utilisé, le compte est créé » + envoi côté Auth. À documenter comme décision si on garde l'état actuel.
- **Confiance** : moyenne (comportement GoTrue avec autoconfirm ; non testé en live ici)

### [WS08-07] Branche d'erreur `disposable/fake` probablement injoignable — P3
- **Fichier** : `src/app/[locale]/(auth)/signup/page.tsx:102-106`
- **Catégorie** : dette
- **Constat** : le mapping `setError('disposableEmail')` dépend de `signUpError.message.includes('disposable' | 'fake')`. Supabase/GoTrue n'émet pas ces sous-chaînes par défaut (pas de blocage email jetable natif sans extension). La clé i18n `Signup.errors.disposableEmail` existe en FR/ES/EN mais ne sera vraisemblablement jamais affichée.
- **Impact** : code + traductions probablement morts ; nul fonctionnellement.
- **Reco** : retirer la branche (et la clé i18n) sauf si une extension de blocage d'emails jetables est prévue côté Auth. Confiance basse sur le « mort » → vérifier la config GoTrue avant suppression.
- **Confiance** : basse

### [WS08-08] `aria-invalid` du Login marque email ET password sur toute erreur — P3
- **Fichier** : `src/app/[locale]/(auth)/login/page.tsx:154,174`
- **Catégorie** : a11y
- **Constat** : les deux champs reçoivent `aria-invalid={!!error}`. Pour `invalidCredentials`/`generic` c'est acceptable (on ne sait pas lequel est faux), mais ça marque aussi les champs comme invalides pour des erreurs **non liées au formulaire** comme `session_error`/`callback_error`/`oauth_failed`/`middleware_error` (issues du param `?error=` de redirection), où les inputs sont vides et corrects. Un lecteur d'écran annoncera « invalide » à tort.
- **Impact** : a11y mineure ; annonce trompeuse dans les cas d'erreur OAuth/middleware.
- **Reco** : restreindre `aria-invalid` aux erreurs de credentials : `aria-invalid={error === 'invalidCredentials' || error === 'generic'}`.
- **Confiance** : haute

### [WS08-09] `PasswordInput` : `disabled` non propagé au bouton œil ; toggle `tabIndex=-1` — P3
- **Fichier** : `src/components/auth/PasswordInput.tsx:36,48-56`
- **Catégorie** : a11y / dette
- **Constat** : `disabled` (passé par login en mode `redirecting`) est spreadé sur l'`<input>` via `{...rest}` (l.36) mais **pas** sur le bouton de bascule (l.48) : pendant la redirection, l'input est grisé mais l'œil reste cliquable. Par ailleurs `tabIndex={-1}` (l.51) retire le toggle du parcours clavier — choix défendable mais un utilisateur clavier ne peut pas révéler le mot de passe.
- **Impact** : incohérence d'état mineure ; limitation clavier du toggle.
- **Reco** : ajouter `disabled={(rest as {disabled?: boolean}).disabled}` au bouton ; envisager de rendre le toggle focusable (retirer `tabIndex={-1}`) si l'a11y clavier du « show password » est souhaitée.
- **Confiance** : haute

## Points positifs (court)
- `safeRedirect.ts` est rigoureux (absolu/protocole/protocol-relative/backslash/`%2f`/`%5c`/traversal décodé) **et** couvert par un test unitaire dédié ; bien câblé sur login + auth/callback.
- `forgot-password` masque correctement l'énumération de comptes (success systématique, l.25-27).
- Bonne hygiène a11y globale : `role="alert"`/`role="status"` sur `AuthNotice`, `aria-describedby` reliant les erreurs, `aria-live="polite"` sur la force du mot de passe, labels `htmlFor` partout.
- Parité i18n parfaite des clés d'erreur Signup/Login (FR/ES/EN), succès auto-login + fallback « vérifiez email » tous deux présents.
- Validation client cohérente (nom/téléphone/longueur/confirmation) + défense en profondeur serveur (RPC `create_reservation` re-vérifie le téléphone non vide).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `auth_leaked_password_protection` désactivé côté Supabase Auth (config projet) — gain sécu immédiat sans code (WS24/infra).
- 2 vues `SECURITY DEFINER` (`tags_with_types`, `v_bestsellers`) + 2 buckets publics listables remontés par l'advisor (WS24).
- `useAuth.ts` (hook monté via `AuthProvider`) re-fetch `/api/cart/merge` au login : logique correcte mais sensible — à recouper avec WS sur le panier.

## Zones non couvertes / à re-vérifier humainement
- Le `flowType` Supabase réel (PKCE vs implicit/hash) détermine la sévérité exacte de WS08-04 et le format des erreurs de récupération — à confirmer dans la config GoTrue.
- Le comportement live de `signUp()` sur email dupliqué avec autoconfirm ON (WS08-06) n'a pas été exécuté ; déduit du comportement GoTrue.
- Réactivité réelle de la branche `disposable/fake` (WS08-07) — dépend d'éventuelles extensions Auth non visibles dans le repo.
