# WS07 — Contact + aide + legal

**Périmètre** : `src/app/[locale]/contact/page.tsx`, `src/app/[locale]/aide/page.tsx`, `src/app/[locale]/legal/{mentions-legales,cgv,confidentialite,cookies}/page.tsx`, `src/components/legal/{LegalShell,LegalSidebar,LegalSection}.tsx`, `src/components/ContactForm.tsx`, `src/components/HelpForm.tsx`, `src/components/CookieBanner.tsx`
**Fichiers lus** : 12 (+ recoupements : `getShopSettings.ts`, `api/contact/route.ts`, `csrf.ts`, `rateLimit.ts`, `schemas.ts`, `supabaseServer.ts`, `[locale]/layout.tsx`, `Footer.tsx`, `AboutPartner.tsx`, messages fr/es/en, DB `shop_settings`)
**Lignes parcourues (approx.)** : ~2 400
**Synthèse** : P0=0 · P1=2 · P2=5 · P3=5

## Findings

### [WS07-01] Email de contact divergent : pages légales (`skin@skinlacercenter.net`) vs Contact/Aide (`contact@farmau.do`) — P1
- **Fichier** : `src/app/[locale]/legal/mentions-legales/page.tsx:61,62,72,162` · `legal/confidentialite/page.tsx:53,265,…` (et `es`) · `legal/cgv/page.tsx:76,153,199,275,355,400` · `legal/cookies/page.tsx:184` (toutes les occurrences `skin@skinlacercenter.net`)
- **Catégorie** : data | logique-métier
- **Constat** : Les 4 pages légales dirigent toute correspondance (éditeur, RGPD/droits 172-13, suppression de compte, référent données, support cookies) vers `skin@skinlacercenter.net`, en dur. Or la `shop_settings` en base (lue par `/contact` et `/aide`) expose `contact_email = contact@farmau.do`. Les deux surfaces publiques affichent donc deux adresses différentes pour « écrire à FARMAU », et les pages où la justesse compte le plus (exercice des droits sur les données, mentions légales) pointent vers un domaine tiers (la clinique partenaire `skinlasercenter`, cf. `AboutPartner.tsx:7`), pas vers `farmau.do`.
- **Impact** : Incohérence visible pour l'utilisateur ; pour les pages légales, l'adresse de l'éditeur / du responsable de traitement diffère de l'adresse officielle du site → faiblesse de conformité (Ley 172-13 exige un canal fiable d'exercice des droits). Si l'intention est que la clinique gère les demandes, ce n'est documenté nulle part et contredit la page Contact.
- **Reco** : Trancher une seule adresse de contact. Si `contact@farmau.do` est l'officielle, remplacer `skin@skinlacercenter.net` partout (ou mieux : faire lire `settings.contact_email` aux pages légales comme le font déjà Contact/Aide, au lieu de hardcoder). Sinon documenter explicitement le rôle de la clinique.
- **Confiance** : haute (divergence factuelle vérifiée en base)

### [WS07-02] Domaine email probablement mal orthographié : `skinlacercenter.net` vs `skinlasercenter` — P1
- **Fichier** : `src/app/[locale]/legal/mentions-legales/page.tsx:61` (et toutes les autres occurrences listées en WS07-01)
- **Catégorie** : data | bug
- **Constat** : L'email utilisé partout est `skin@skin**lacer**center.net`. La clinique partenaire s'appelle « Skin **Laser** Center » avec le handle Facebook `skinlasercenter` (`AboutPartner.tsx:7`). « lacer » au lieu de « laser » a tout du typo, répliqué mécaniquement dans les 4 pages légales + `account/security` + FAQ (messages). Je ne peux pas vérifier la possession du domaine depuis l'audit.
- **Impact** : Si `skinlacercenter.net` n'est pas un domaine valide/possédé, **toutes** les adresses de contact légal/RGPD sont mortes (mails non délivrés) → impossible pour un utilisateur d'exercer ses droits, et mentions légales non joignables. Bloquant fonctionnel s'il s'agit bien d'un typo.
- **Reco** : Vérifier l'orthographe réelle du domaine (probablement `skinlasercenter.net` ou une boîte `@farmau.do`) et corriger partout. Centraliser dans `shop_settings`/une constante pour éviter la répétition.
- **Confiance** : moyenne (forte présomption de typo ; nécessite confirmation humaine du domaine réel)

### [WS07-03] CookieBanner : bouton « Refuser non-essentiels » trompeur (aucun cookie non-essentiel, aucun blocage) — P2
- **Fichier** : `src/components/CookieBanner.tsx:51-57,79-85` ; libellés `Legal.cookieBanner.rejectLabel` (fr/es/en)
- **Catégorie** : logique-métier | a11y/UX | data
- **Constat** : Le bandeau propose deux actions : « J'ai compris » (`accepted`) et « Refuser non-essentiels » (`rejected`). Or, de l'aveu même du composant (commentaire l.10-18) et de la page `/legal/cookies` (« tous strictement nécessaires, n'exigent pas de consentement »), il n'existe aucun cookie non-essentiel et `persist('rejected')` ne bloque/désactive **rien** — c'est purement informatif. Le libellé promet un opt-out granulaire inexistant. La croix (X, l.52) mappe aussi sur `rejected`.
- **Impact** : Promesse non tenue à l'utilisateur (le « refus » n'a aucun effet technique). Sur une page légale qui se veut transparente, c'est un message contradictoire ; mineur juridiquement mais incohérent.
- **Reco** : Soit un seul bouton « J'ai compris » (cohérent avec un bandeau purement informatif), soit, si un opt-out granulaire est voulu plus tard, l'implémenter réellement. Aligner le libellé `rejectLabel` (ex. « Fermer ») sur la réalité.
- **Confiance** : haute

### [WS07-04] `ContactForm` n'annonce pas succès/erreur aux lecteurs d'écran (pas d'`aria-live`) — P2
- **Fichier** : `src/components/ContactForm.tsx:70-88`
- **Catégorie** : a11y
- **Constat** : Les blocs succès et erreur de `ContactForm` apparaissent/disparaissent sans région live. `HelpForm` (`HelpForm.tsx:54`) enveloppe au contraire ses blocs succès/erreur dans `<div aria-live="polite">`. Asymétrie : sur la page Contact, un utilisateur de lecteur d'écran n'est pas notifié de l'envoi réussi ni de l'échec. Aucun des deux formulaires ne pose `aria-invalid`/`aria-describedby` (les hints `emailHint`/etc. ne sont pas reliés aux champs).
- **Impact** : Régression a11y sur le formulaire de contact principal ; non-respect WCAG 4.1.3 (Status Messages). Faible volume mais réel.
- **Reco** : Envelopper les blocs feedback de `ContactForm` dans `aria-live="polite"` (calquer `HelpForm`). Optionnel : relier les `<p>` de hint via `aria-describedby` sur les inputs.
- **Confiance** : haute

### [WS07-05] `revalidate = 86400` mort sur 5 pages : rendu forcé dynamique par lecture cookie (`Footer`/`getShopSettings`) — P2
- **Fichier** : `src/app/[locale]/aide/page.tsx:11` · `legal/mentions-legales/page.tsx:10` · `legal/cgv/page.tsx:11` · `legal/confidentialite/page.tsx:11` · `legal/cookies/page.tsx:10`
- **Catégorie** : perf | dette
- **Constat** : Ces pages déclarent `export const revalidate = 86400` (ISR 24h). Mais `aide` et `contact` appellent `getShopSettings()`, et **toutes** rendent `<Footer/>` (async Server Component) qui appelle aussi `getShopSettings()` → `createSupabaseServerClient()` → `cookies()` (`supabaseServer.ts:10`). La lecture de cookies opte la route en rendu **dynamique** : l'ISR/`revalidate` est de fait ignoré, chaque requête re-rend la page. La config est donc trompeuse et la mise en cache espérée n'a pas lieu.
- **Impact** : Perte de cache sur des pages quasi-statiques (légal, aide), latence + charge inutiles à chaque hit ; config qui ment sur le comportement réel.
- **Reco** : Soit retirer `revalidate` (assumer le dynamique), soit rendre `getShopSettings` cache-friendly côté Footer (lecture via client anon **sans cookies** + `unstable_cache`, comme `getThemeConfig`) pour permettre le SSG/ISR — décision transverse (cause racine dans `Footer`, hors périmètre strict).
- **Confiance** : haute

### [WS07-06] Horaires d'ouverture incohérents entre pages — P2
- **Fichier** : `src/app/[locale]/legal/mentions-legales/page.tsx:64`
- **Catégorie** : data
- **Constat** : Les mentions légales annoncent « Lundi à vendredi, **9h–19h** (UTC−4) » en dur. La page Contact (clés `Contact.hoursWeekday/Saturday/Sunday`) et la base (`shop_settings.pickup_hours = "Lun-Vie 6h30-17h · Sáb 8h-16h"`) indiquent **6h30–17h** + samedi 8h–16h. Trois sources, deux valeurs différentes pour l'horaire semaine.
- **Impact** : Information de contact contradictoire selon la page consultée ; un client peut se déplacer sur un créneau erroné.
- **Reco** : Aligner les mentions légales sur `shop_settings`/la page Contact (idéalement lire `settings.pickup_hours`). Vérifier la vraie amplitude horaire avec WS05.
- **Confiance** : haute

### [WS07-07] Les formulaires affichent des codes d'erreur serveur bruts / non localisés — P3
- **Fichier** : `src/components/ContactForm.tsx:42-43` · `src/components/HelpForm.tsx:33-34`
- **Catégorie** : i18n | UX
- **Constat** : Sur réponse non-`success`, les deux forms font `setError(data.error || t('errors.generic'))`. Or l'API contact peut renvoyer : `origin_rejected` / `unsupported_media_type` (codes machine, via `csrf.ts:40,67`), le message 429 « Trop de requêtes. Réessayez dans quelques instants. » (français en dur, `api/contact/route.ts:22`) ou des messages Zod en français (`schemas.ts:131-134`). Ces chaînes sont affichées telles quelles, y compris aux utilisateurs ES/EN.
- **Impact** : Cas limites où l'utilisateur voit un code technique anglais ou un message français hors de sa locale. Faible fréquence (CSRF/rate-limit), mais réel.
- **Reco** : Mapper le `status` HTTP (429/400/403/415) vers des clés i18n locales côté form plutôt que d'afficher `data.error` brut. Ou normaliser les messages d'erreur API en codes que le client traduit.
- **Confiance** : haute

### [WS07-08] Date de mise à jour légale toujours formatée en français quelle que soit la locale — P3
- **Fichier** : `src/components/legal/LegalShell.tsx:33-37`
- **Catégorie** : i18n
- **Constat** : `new Intl.DateTimeFormat('fr-FR', …)` est codé en dur. Sur les versions ES (CGV/confidentialité ont un contenu espagnol réel) et EN, la « Dernière mise à jour » s'affiche en format français (« 21 mai 2026 ») au lieu de la locale courante.
- **Impact** : Petit défaut i18n visible sur les pages légales traduites (CGV/confidentialité ES notamment).
- **Reco** : Utiliser la locale courante : `Intl.DateTimeFormat(toLocaleTag(locale), …)` (passer `locale` en prop au shell, ou via `getLocale()`).
- **Confiance** : haute

### [WS07-09] Mentions légales & cookies : contenu uniquement en français (intro/titres/corps) malgré l'URL localisée — P3
- **Fichier** : `src/app/[locale]/legal/mentions-legales/page.tsx:40-166` · `legal/cookies/page.tsx:40-188`
- **Catégorie** : i18n
- **Constat** : Contrairement à CGV/confidentialité (dictionnaire `CONTENT[locale]` fr+es), ces deux pages rendent un `eyebrow`/`title`/`intro` + tout le corps en français en dur, servis tels quels sur `/es/...` et `/en/...`. Seules les balises `<title>`/`description` (metadata) sont localisées.
- **Impact** : Un visiteur ES/EN sur ces deux pages légales lit du français. C'est documenté comme choix assumé dans CLAUDE.md (« mentions-legales/cookies restent FR-only »), donc **décision intentionnelle** → signalé uniquement pour traçabilité, pas comme bug. (Les `<html lang>` resteront `es`/`en` alors que le contenu est `fr` → léger souci SEO/a11y.)
- **Reco** : Pour la cohérence, à terme aligner sur le pattern `CONTENT[locale]` de CGV. Sinon, accepter et documenter le `lang` mismatch.
- **Confiance** : haute (comportement) / le statut « intentionnel » s'appuie sur la doc

### [WS07-10] `dangerouslySetInnerHTML` sur le titre de `/aide` — P3
- **Fichier** : `src/app/[locale]/aide/page.tsx:69`
- **Catégorie** : sécurité (défensif)
- **Constat** : `dangerouslySetInnerHTML={{ __html: t.raw('title') }}` injecte le HTML de la clé de traduction (`"Comment pouvons-nous <em>vous aider</em> ?"`). La source est un fichier de messages contrôlé par les devs, pas une entrée utilisateur → pas de XSS exploitable aujourd'hui.
- **Impact** : Aucun à ce jour ; surface à risque si un jour une traduction provient d'une source non fiable (DB/CMS). Pattern à connaître.
- **Reco** : RAS fonctionnellement. Si possible, préférer `t.rich('title', { em: (c) => <em>{c}</em> })` pour éviter `dangerouslySetInnerHTML`.
- **Confiance** : haute

## Points positifs (court)
- CSRF + rate-limit propres : `guardMutation` (Origin same-host + `Content-Type: application/json`) et `getClientIp` non-spoofable (`x-vercel-forwarded-for` puis dernier hop) — le finding historique « rate-limit IP spoofable » est **corrigé** dans l'état actuel ; les `<form>` cross-site ne peuvent pas atteindre `/api/contact`.
- CSP `frame-src 'self' … https://maps.google.com` (`next.config.ts:70`) couvre bien l'iframe Maps de `/contact` (host `maps.google.com`) — pas de blocage.
- i18n des composants/forms solide : parité parfaite fr/es/en sur les namespaces du périmètre (97 clés, 0 manquante/0 extra) ; toutes les clés référencées par `ContactForm`/`HelpForm`/`aide` existent.
- `HelpForm` bien fait : `aria-live="polite"`, `maxLength` (subject 200 / message 4000) cohérents avec le Zod serveur, validation `category` enum alignée (`schemas.ts:114`), envoi du `category` correctement consommé par `create_ticket`.
- `LegalShell` affiche un disclaimer « document à valider par un juriste » + `<time dateTime>` correct ; sidebar avec `aria-current="page"` ; CGV/confidentialité réellement traduites fr+es.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/app/[locale]/account/security/page.tsx` réutilise aussi l'email `skin@skinlacercenter.net` (même problème WS07-01/02) — recouper avec WS sur `/account`.
- `src/components/Footer.tsx` lit les cookies via `getShopSettings()` → force le dynamique sur toutes les pages publiques (impacte WS07-05 mais cause racine ailleurs) — à traiter globalement (envisager `unstable_cache` comme `getThemeConfig`).
- Messages FAQ (`src/messages/*.json`) contiennent aussi `skin@skinlacercenter.net` en dur → même typo/divergence (WS sur FAQ).
- `/api/contact` 429 renvoie un message français en dur (`route.ts:22`) → à localiser ou coder côté API (WS API).

## Zones non couvertes / à re-vérifier humainement
- **Possession/orthographe du domaine email** (`skinlacercenter.net` vs `skinlasercenter.net` vs `@farmau.do`) — impossible à trancher depuis le repo ; conditionne la sévérité de WS07-02 (P1 si domaine mort).
- **Quelle est l'adresse de contact officielle** (clinique vs farmau.do) et la **vraie amplitude horaire** — décision métier requise (WS07-01, WS07-06), à recouper avec WS05.
- **Exactitude juridique RD** des contenus CGV/confidentialité/mentions/cookies (Ley 172-13 / 358-05 / 126-02 / 65-00) : le disclaimer le reconnaît déjà ; nécessite validation par un juriste dominicain (les bases légales du tableau de confidentialité s'inspirent du RGPD, à confirmer pour la 172-13). La traduction ES est une « traduction de travail » non validée juridiquement.
- **Conformité réelle du bandeau cookies** vs Ley 172-13 : si seuls des cookies strictement nécessaires sont posés, un bandeau informatif suffit ; à reconfirmer si Google Maps (iframe) dépose des cookies tiers avant interaction (la page cookies l'admet mais ne les liste pas comme nécessitant consentement).
