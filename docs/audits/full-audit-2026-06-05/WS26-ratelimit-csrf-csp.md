# WS26 — Sécurité : rate-limit / CSRF / en-têtes / secrets

**Périmètre** : `src/lib/rateLimit.ts`, `src/lib/csrf.ts`, `src/lib/env.ts`, `next.config.ts` (bloc headers/CSP/Permissions-Policy) + consommateurs (`/api/contact`, `/api/newsletter`, `/api/newsletter/confirm`) + recoupements (`supabaseAdmin.ts`, `requireAdmin.ts`, `layout.tsx`, `themeModeScript.ts`, migration `20260519143501_rate_limit_buckets_and_check_fn.sql`).
**Fichiers lus** : 13 · **Lignes parcourues (approx.)** : ~750
**Synthèse** : P0=0 · P1=0 · P2=2 · P3=4

> **Verdict global** : périmètre **sain**. Les trois findings historiques (audit « Lanjo ») cités au brief §5 sont **tous corrigés dans l'état actuel** : (a) IP rate-limit n'utilise plus le 1er hop spoofable de `x-forwarded-for` ; (b) hors scope WS26, mais (c) la CSP **ne contient plus `unsafe-eval`** ni `script-src 'unsafe-inline'` (remplacé par un hash SHA-256 du seul script inline). Aucun secret n'est exposé ni committé. Les deux P2 sont des durcissements défensifs, pas des failles exploitables.

## Findings

### [WS26-01] Rate-limit *fail-open* : un incident/DoS DB désactive silencieusement toute limitation — P2
- **Fichier** : `src/lib/rateLimit.ts:21-24`, `:32-35`
- **Catégorie** : sécurité
- **Constat** : `checkRateLimit` retourne `{ allowed: true }` (laisse passer) dans **deux** cas : `supabaseAdmin === null` (clé service-role absente) et **toute** erreur de la RPC `check_rate_limit` (DB indisponible, timeout, pool saturé, RLS, etc.). Le choix est documenté et délibéré (« mieux que de se DoS soi-même »).
- **Impact** : si un attaquant parvient à dégrader la disponibilité Postgres (ou simplement en cas de pic de charge qui sature le pool), **toutes** les protections rate-limit tombent d'un coup : `/api/contact` (5/min), `/api/newsletter` (3/min), `/api/newsletter/confirm` (10/min) deviennent illimités → spam de tickets `create_ticket`, abus d'envoi d'emails Resend (coût + réputation expéditeur), brute-force du `confirmation_token` newsletter. C'est un *fail-open* classique : la défense disparaît précisément quand le système est sous stress. Le risque est **modéré** (le service-role est presque toujours présent en prod ; surface = endpoints publics non critiques), d'où P2 et non P1.
- **Reco** : conserver le fail-open pour le cas « `supabaseAdmin` null » (config), mais pour le cas « RPC error », envisager soit (a) un *fail-closed* sur les endpoints les plus sensibles (envoi d'email), soit (b) un fallback in-memory (LRU par IP, fenêtre courte) qui survit à une panne DB, soit au minimum (c) un compteur/alerte sur la fréquence de ce log `fail-open` pour détecter une exploitation. À trancher selon l'appétit de risque ; documenter explicitement la décision.
- **Confiance** : haute

### [WS26-02] `getClientIp` : le fallback hors-Vercel fait confiance au **dernier** hop de `x-forwarded-for`, qui n'est pas fiable hors d'un reverse-proxy de confiance — P2
- **Fichier** : `src/lib/rateLimit.ts:63-69`
- **Catégorie** : sécurité
- **Constat** : la priorité 1 (`x-vercel-forwarded-for`, posé/écrasé par l'edge Vercel) est **correcte et non-spoofable sur Vercel** — le finding historique est levé. Mais le fallback priorité 2 prend `hops[hops.length - 1]` (dernier hop) de `x-forwarded-for`. Ce raisonnement (« le dernier hop = proxy de confiance le plus proche ») n'est vrai **que** s'il existe effectivement un proxy de confiance qui *appose* le vrai IP en queue. En déploiement **hors Vercel sans reverse-proxy maîtrisé** (ex. exécution directe, conteneur exposé, plateforme qui ne réécrit pas l'en-tête), `x-forwarded-for` est **entièrement fourni par le client** : l'attaquant envoie `X-Forwarded-For: 1.1.1.1, <ip-cible>` et contrôle le dernier hop → bucket de rate-limit neuf à volonté. La priorité 3 (`x-real-ip`) a le même défaut hors proxy de confiance.
- **Impact** : nul **sur Vercel** (la cible de déploiement documentée — `x-vercel-forwarded-for` gagne toujours). Le risque n'existe que sur un déploiement alternatif sans proxy de confiance. Comme le projet est explicitement déployé sur Vercel (cf. CLAUDE.md « Vercel : auto-deploy »), l'exposition réelle est faible → P2 (dette de portabilité / robustesse), pas P1.
- **Reco** : documenter en commentaire que `getClientIp` **suppose un proxy de confiance qui réécrit `x-forwarded-for`** (vrai sur Vercel) et que le fallback est *non sûr* sur un hébergement nu. Idéalement, rendre le nombre de hops de confiance configurable (`TRUSTED_PROXY_HOPS`) plutôt que de prendre aveuglément le dernier. Le test `src/__tests__/rateLimit.test.ts:16-20` encode l'hypothèse « dernier hop = confiance » comme un comportement *attendu* — c'est un piège si quelqu'un déploie hors Vercel.
- **Confiance** : haute

### [WS26-03] `getPublicEnv` est un export **mort** (jamais consommé) — P3
- **Fichier** : `src/lib/env.ts:73-86`
- **Catégorie** : dette / code mort
- **Constat** : `grep -rn "getPublicEnv" src/` ne renvoie **aucun** consommateur hors de `env.ts` lui-même. La validation publique throwante (URL Supabase + anon key) n'est donc jamais déclenchée : `supabaseClient.ts` fait son propre garde léger (cf. commentaire ligne 11-12 de `env.ts`), et `supabaseAdmin.ts` lit `process.env.NEXT_PUBLIC_SUPABASE_URL` en direct (`supabaseAdmin.ts:15`) sans passer par `getPublicEnv`.
- **Impact** : faible. Code non couvert, fausse impression de « fail-fast public au boot » qui n'a jamais lieu. La doc du module (« validées au 1er appel ») laisse croire à une garde active.
- **Reco** : soit câbler `getPublicEnv()` là où les vars publiques sont consommées côté serveur (`supabaseAdmin.ts` pourrait l'utiliser pour l'URL au lieu du `process.env.…!`), soit supprimer l'export et la doc associée. **Confiance basse** sur « à supprimer » sans connaître les intentions ; **haute** sur le fait qu'il est actuellement inutilisé.
- **Confiance** : moyenne

### [WS26-04] CSP `img-src` autorise tout `https:` — P3
- **Fichier** : `next.config.ts:68`
- **Catégorie** : sécurité
- **Constat** : `img-src 'self' data: blob: https:` permet de charger une image depuis **n'importe quel** domaine HTTPS. C'est volontaire (les produits peuvent être servis depuis Supabase Storage / CDN tiers, et `next.config.ts:89-94` autorise `hostname: '**'` côté `<Image>`).
- **Impact** : faible. Une image distante arbitraire ne permet pas d'exécution de script, mais peut servir au *tracking* (beacon via `<img>`), au CSRF de requêtes GET d'images, ou à exfiltrer un peu d'info via l'URL si un contenu injecté contrôlait un `src`. Vu que `connect-src` et `script-src` restent verrouillés, l'impact reste cosmétique côté sécurité.
- **Reco** : si la source réelle des images est connue (Supabase Storage = `https://*.supabase.co`), restreindre `img-src` et `remotePatterns` à ce domaine + ceux effectivement utilisés. Sinon, accepter et noter le choix.
- **Confiance** : haute

### [WS26-05] HSTS sans `preload` (et `includeSubDomains` sur un projet sans sous-domaines maîtrisés) — P3
- **Fichier** : `next.config.ts:57-60`
- **Catégorie** : sécurité
- **Constat** : `Strict-Transport-Security: max-age=31536000; includeSubDomains` — pas de directive `preload`. Le `max-age` d'un an et `includeSubDomains` sont bons. L'absence de `preload` signifie que le tout premier hit en HTTP (avant réception de l'en-tête) reste vulnérable à un downgrade/MITM (fenêtre TOFU).
- **Impact** : très faible (Vercel force déjà HTTPS et redirige HTTP→HTTPS au niveau plateforme ; la fenêtre TOFU est étroite).
- **Reco** : si le domaine `farmau.do` est destiné à être soumis à la liste HSTS preload, ajouter `; preload` **après** avoir confirmé que tous les sous-domaines servent en HTTPS (sinon `includeSubDomains` + `preload` peut casser un sous-domaine). Optionnel.
- **Confiance** : haute

### [WS26-06] `Referrer-Policy: same-origin` — vérifier l'intention vs `strict-origin-when-cross-origin` — P3
- **Fichier** : `next.config.ts:51-52`
- **Catégorie** : sécurité / archi
- **Constat** : `Referrer-Policy: same-origin` n'envoie **aucun** `Referer` sur les requêtes cross-origin (liens sortants, ressources tierces). C'est plus strict que le défaut navigateur moderne (`strict-origin-when-cross-origin`). Bon pour la vie privée ; mais coupe l'attribution de trafic sortant (ex. clics vers la clinique partenaire, Google Reviews, réseaux sociaux ne verront pas FARMAU comme `referrer`).
- **Impact** : nul côté sécurité (c'est *plus* sûr). Effet de bord analytics/SEO mineur (attribution de trafic sortant perdue).
- **Reco** : si l'attribution sortante (partenaires, Google) importe, passer à `strict-origin-when-cross-origin` (envoie juste l'origine, pas le path, en cross-origin — bon compromis). Sinon garder. Décision produit, pas un bug.
- **Confiance** : haute

## Points positifs (court)

- **CSP durcie sans casser le SSG** : `script-src` n'utilise **ni** `unsafe-eval` **ni** `unsafe-inline` — le seul script inline (anti-flash thème, `layout.tsx:70`) est autorisé par un **hash SHA-256 calculé au build depuis la même constante `THEME_MODE_SCRIPT`** (`next.config.ts:11-13`), donc zéro drift possible entre le hash et le script. Vérifié : c'est le seul `<script>` inline de l'app (les autres `dangerouslySetInnerHTML` sont du contenu ou du JSON-LD `application/ld+json`, non exécutable). Le finding historique « CSP unsafe-eval » est **levé**.
- **CSRF cohérent et appliqué partout** : `guardMutation` (origin check + `Content-Type: application/json` obligatoire) couvre **toutes** les routes mutantes publiques/auth (`cart`, `cart/merge`, `cart/reserve`, `wishlist`, `account/preferences`, `contact`, `newsletter`) ; les routes admin passent par `requireAdmin` → `assertOriginFromHeaders` (origin check même sur GET). Le check same-origin via `Origin.host === Host` est **robuste et indépendant des vars d'env** (ne casse pas la prod si `SITE_URL` est mal configurée). L'exigence `application/json` ferme le vecteur form-CSRF « simple request ».
- **IP rate-limit non-spoofable sur Vercel** : `getClientIp` priorise `x-vercel-forwarded-for` (écrit par l'edge) et **n'utilise jamais** le 1er hop de `x-forwarded-for` (CWE-348). Couvert par un test unitaire (`rateLimit.test.ts`, 3/3 passants). Finding historique levé sur la cible de déploiement.
- **Hygiène des secrets** : `supabaseAdmin.ts` est `import 'server-only'` ; la clé service-role n'est jamais en `NEXT_PUBLIC_*` ; aucun `.env` (hors `.example`) n'est tracké par git (`.gitignore: .env*`) ; les logs d'erreur (`logger.error`) ne *stringifient* pas les clés. `removeConsole` en prod (sauf error/warn) + `poweredByHeader: false` limitent les fuites résiduelles.
- **Table `rate_limit_buckets`** : RLS active **sans policy** + `REVOKE … FROM PUBLIC, anon, authenticated` sur `check_rate_limit` + `GRANT … TO service_role` (migrations `20260519143501` / `20260528160000`) → inaccessible hors service-role. Cleanup probabiliste anti-bloat dans la RPC. `SECURITY DEFINER SET search_path = public` correct.

## Signalements hors périmètre (1 ligne chacun, max 5)

- `getClientIp` est typé `(request: Request)` mais reçoit toujours un `NextRequest` ; `NextRequest.ip` (rempli par Vercel) n'est pas exploité — alternative plus fiable que les en-têtes, à évaluer par l'agent routes/infra.
- `/api/contact` GET (`route.ts:85-110`) ne fait **aucun** rate-limit ni `guardMutation` (GET auth-only par Bearer) — RLS-dépendant ; à confirmer par l'agent RLS/IDOR (WS24).
- Le finding historique « open-redirect au login (`redirectedFrom`/`next`) » (brief §5b) est **hors scope WS26** — à valider par l'agent auth/login.
- `next.config.ts:89-94` autorise `<Image>` depuis `hostname: '**'` (tout domaine) — large ; cohérent avec `img-src https:` mais à resserrer si la source d'images est unique (Supabase Storage).
- La RPC `create_ticket` accepte des emails anonymes non vérifiés via `/api/contact` POST — risque de spam de tickets si le rate-limit *fail-open* (WS26-01) tombe ; recoupe l'agent support/tickets.

## Zones non couvertes / à re-vérifier humainement

- **Comportement Vercel runtime de `x-vercel-forwarded-for`** : confirmé par documentation/conception comme écrasé par l'edge (donc fiable), mais **non testé en environnement Vercel live** dans cet audit. À valider avec une requête forgée en préprod si le rate-limit est jugé critique.
- **Effet réel du fail-open sous panne DB** (WS26-01) : non reproduit (MCP read-only) — l'impact décrit est par lecture de code.
- **CSP en runtime** : le header est défini en config ; non vérifié sur une réponse HTTP servie (l'agent infra/build pourrait le confirmer via `curl -I`). Risque que des intégrations futures (analytics, widgets) heurtent `connect-src`/`frame-src` actuels.
