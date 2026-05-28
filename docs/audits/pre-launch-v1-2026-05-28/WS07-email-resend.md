# WS07 — Email Resend & Flux Newsletter / Contact

Audit PRE-V1 · lecture seule · 2026-05-28 · HEAD `1949a2b`
Périmètre : `src/app/api/newsletter/route.ts`, `src/app/api/newsletter/confirm/route.ts`, `src/app/api/contact/route.ts`, `src/lib/resend.ts`, `src/lib/csrf.ts`, `src/lib/rateLimit.ts`, migrations `20260520085055` / `20260527211720` / `20260528100000` / `20260519143501` / `20260520092235`.

---

## Verdict

**GO conditionnel V1.** La mécanique double opt-in est saine sur les fondamentaux qui comptent le plus pour la réputation du domaine : **token cryptographique fort** (`randomBytes(32)`), **TTL 24h vérifié au confirm** (`.gt()`), **token mono-usage** (mis à `null` + filtre `is('confirmed_at', null)` dans le même UPDATE atomique), **lien construit serveur-side** (`getSiteUrl()`, pas le header `Origin`), et **réponse anti-énumération** sur les deux POST publics (toujours `{ ok: true }` / `success: true`). Aucun P0.

Deux points méritent une décision explicite avant la V1 :
- **WS07-01 (P1)** : un attaquant peut faire **partir un email de confirmation vers l'adresse d'un tiers** (spam d'abonnement / joe-job léger). Le double opt-in empêche l'abonnement effectif mais **n'empêche pas l'envoi** — c'est un vecteur de coût Resend et de nuisance.
- **WS07-02 (P1)** : le rate-limit est **par IP dérivée d'un header client spoofable** (`X-Forwarded-For` premier segment) et **fail-open**. En l'état un script qui fait varier `X-Forwarded-For` peut flooder l'envoi d'emails (coût/réputation). Sur Vercel l'en-tête est normalement réécrit par l'edge — **à confirmer hors-repo**.

Le reste = P2/P3 (header `Reply-To` absent, pas de lien de désinscription dans l'email, fallback single-opt-in non journalisé, `From` non vérifiable depuis le repo).

---

## Flux double opt-in (schéma)

```
POST /api/newsletter { email, lang }
  │
  ├─ checkOrigin(req) ── header Origin présent & non-allowlisté → 403
  │                      header Origin ABSENT → passe (null)        ← WS07-03
  ├─ supabaseAdmin null → 503
  ├─ normalise email (trim + lowercase), valide EMAIL_RE + len ≤ 320
  ├─ si body.email vide & user connecté → email = session.user.email   (re-sub /account)
  ├─ si body.email présent → checkRateLimit("newsletter:<ip>", 3, 60)  ← WS07-02 (fail-open, IP header)
  │
  ├─ useDoubleOptIn = (resend != null) && (body.email présent)
  ├─ token = useDoubleOptIn ? randomBytes(32).hex (64 hex / 256 bits) : null   ← FORT
  │
  ├─ INSERT newsletter_subscribers {
  │      email, lang, ip, user_agent,
  │      confirmed_at = useDoubleOptIn ? null : now(),     ← fallback = abonné direct  WS07-05
  │      confirmation_token = token,
  │      token_expires_at = useDoubleOptIn ? now()+24h : null
  │  }
  │  ├─ conflit UNIQUE (23505) → silencieusement ignoré, AUCUN email     ← WS07-06
  │  └─ autre erreur → 500
  │
  ├─ si useDoubleOptIn && token && pas-de-conflit :
  │      resend.emails.send({ from: FROM_EMAIL, to: email, subject(lang), html(lien) })
  │      lien = getSiteUrl() + /api/newsletter/confirm?token=...   ← serveur-side, pas Origin  (BON)
  │      erreur d'envoi → catch + log seulement (route renvoie quand même ok:true)
  │
  └─ 200 { ok: true }   ← réponse identique nouvel email / email existant / échec envoi  (anti-énum, BON)


GET /api/newsletter/confirm?token=...
  │
  ├─ token absent → 400
  ├─ supabaseAdmin null → 503
  ├─ checkRateLimit("newsletter-confirm:<ip>", 10, 60)   ← fail-open, IP header
  │
  ├─ UPDATE newsletter_subscribers
  │     SET confirmed_at = now(), confirmation_token = null     ← invalide le token (mono-usage)
  │     WHERE confirmation_token = token
  │       AND confirmed_at IS NULL                              ← idempotent / re-jeu bloqué
  │       AND token_expires_at > now()                          ← TTL 24h appliqué
  │     RETURNING id, email
  │
  ├─ data null (token inconnu / déjà confirmé / expiré) → 302 /fr?newsletter=already
  └─ data présent                                       → 302 /fr?newsletter=confirmed
```

---

## Findings

### WS07-01 · P1 · confirmé — Envoi d'email de confirmation vers un tiers (spam d'abonnement / coût Resend)
**Preuve** : `src/app/api/newsletter/route.ts:96-120` — `resend.emails.send({ to: email, ... })` où `email` provient directement du body POST, sans aucune preuve de possession de l'adresse. Le rate-limit (`:54-63`) est par IP, pas par email cible.
**Impact** : n'importe qui peut déclencher l'envoi de mails de confirmation FARMAU vers des adresses arbitraires (victime@example.com). Le double opt-in empêche l'abonnement *effectif* (la victime ne cliquera pas), mais **l'email part quand même** → (1) nuisance / spam reçu par des tiers au nom de FARMAU, (2) consommation du quota Resend, (3) si beaucoup de cibles inexistantes/spam-traps → **bounces & plaintes qui dégradent la réputation d'expéditeur du domaine** (SPF/DKIM ne protègent pas de ça). Classique « subscription bombing ».
**Reco** : (a) rate-limiter aussi **par adresse cible** (`newsletter:email:<sha256(email)>`, p.ex. 1 envoi / 10 min / email) en plus de l'IP ; (b) optionnellement un challenge léger (Turnstile/hCaptcha) sur le form footer avant l'envoi ; (c) surveiller le taux de bounce Resend. Le rate-limit par email seul réduit déjà fortement le vecteur de bombing d'une même cible.
**Effort** : M (un appel `checkRateLimit` supplémentaire keyé sur l'email avant `resend.emails.send`).

### WS07-02 · P1 · suspecté (dépend de l'infra Vercel) — Rate-limit contournable par spoof `X-Forwarded-For` + fail-open
**Preuve** : `src/lib/rateLimit.ts:48-52` — `getClientIp` lit `request.headers.get('x-forwarded-for').split(',')[0]` (premier segment, **fourni par le client**) puis `x-real-ip`, fallback `'unknown'`. `src/lib/rateLimit.ts:32-34` — sur erreur RPC ou `supabaseAdmin` null, **fail-open** (`allowed: true`).
**Impact** : si la plateforme ne réécrit pas/n'écrase pas `X-Forwarded-For`, un script peut envoyer une IP différente à chaque requête → buckets distincts → rate-limit inopérant → flood d'envois d'emails (cf. WS07-01) et de messages contact. Le fail-open ajoute un second angle : provoquer une indisponibilité de la RPC (ou simplement un incident DB) lève tout le rate-limit. Sur Vercel, `x-forwarded-for` est normalement positionné par l'edge avec l'IP réelle en tête, ce qui neutralise le spoof — **mais ce n'est garanti que si le code ne fait pas confiance au premier segment d'un XFF multi-valué**. À confirmer hors-repo (config Vercel / présence d'un WAF).
**Reco** : sur Vercel, préférer `x-vercel-forwarded-for` / `x-real-ip` (positionnés par la plateforme) à `x-forwarded-for` brut, ou prendre le **dernier** segment de confiance plutôt que le premier. Documenter explicitement le fail-open comme choix assumé, et y adjoindre le rate-limit par email de WS07-01 (qui, lui, ne dépend pas de l'IP).
**Effort** : S (changer la source d'IP) ; le durcissement complet est couvert par WS07-01.

### WS07-03 · P2 · confirmé — `checkOrigin` inopérant sans header `Origin` (CSRF/script)
**Preuve** : `src/lib/csrf.ts:21-22` — `const origin = request.headers.get('origin'); if (!origin) return null` → toute requête **sans** header `Origin` (curl, scripts, certaines requêtes server-to-server) passe la « protection ». Appliqué tel quel à `/api/newsletter` (`route.ts:21`) et `/api/contact` (`route.ts:12`).
**Impact** : le `checkOrigin` bloque uniquement les requêtes cross-site **émises par un navigateur** (qui force `Origin`). Il n'offre **aucune** protection contre un attaquant scriptant les endpoints (cas réel de l'abus WS07-01/-02, qui n'utilise pas de navigateur). C'est un anti-CSRF navigateur, pas un anti-automatisation — à ne pas confondre dans la threat-model.
**Reco** : conserver `checkOrigin` (utile contre le CSRF navigateur) mais **ne pas compter dessus** pour l'anti-abus ; s'appuyer sur le rate-limit (WS07-01/-02) et éventuellement un captcha. Optionnellement, durcir : exiger un `Origin`/`Referer` valide sur les POST mutateurs (rejeter l'absence) — au prix d'une compat client à vérifier.
**Effort** : S (documentation) / M (si on rend l'Origin obligatoire).

### WS07-04 · P2 · confirmé — Pas de `Reply-To`, et `From` potentiellement non aligné DKIM (à confirmer DNS)
**Preuve** : `src/lib/resend.ts:7` — `FROM_EMAIL = 'FARMAU <noreply@farmau.do>'` (défaut). `route.ts:96-120` — `resend.emails.send` ne pose **ni `reply_to` ni `headers`**.
**Impact** : (1) un destinataire qui répond écrit à `noreply@farmau.do` (cul-de-sac, pas idéal pour le support). (2) Surtout : la délivrabilité dépend entièrement de l'alignement SPF/DKIM/DMARC du domaine `farmau.do` côté Resend — **non vérifiable depuis le repo**. Si `farmau.do` n'est pas un domaine vérifié dans Resend, les mails de confirmation seront rejetés/spam → le double opt-in casse silencieusement (l'envoi échoue, capté par le `catch` ligne 121, l'utilisateur reste non confirmé sans feedback).
**Reco** : (a) ajouter `reply_to` (ex. `contact@farmau.do`) ; (b) **confirmer hors-repo** que `farmau.do` est vérifié dans Resend avec SPF + DKIM (et idéalement DMARC `p=quarantine`) ; (c) envisager un sous-domaine d'envoi dédié (`mail.farmau.do`) pour isoler la réputation transactionnelle.
**Effort** : S (code) + ops DNS (hors-repo).

### WS07-05 · P2 · confirmé — Fallback single opt-in silencieux quand `RESEND_API_KEY` absent
**Preuve** : `src/lib/resend.ts:5` — `resend = apiKey ? new Resend(apiKey) : null`. `route.ts:69` — `useDoubleOptIn = !!resend && !!body.email` ; `:80` — si `!useDoubleOptIn`, `confirmed_at = now()` posé **directement à l'insert**.
**Impact** : sans clé Resend en prod, **n'importe quelle adresse soumise est marquée confirmée sans vérification** → on peut abonner l'email d'un tiers de façon effective (et silencieuse), et la liste se remplit d'adresses non vérifiées (spam-traps, fautes de frappe) qui plomberont la délivrabilité du premier vrai envoi de campagne. Aucun log/alerte ne signale qu'on tourne en mode dégradé.
**Reco** : (a) **exiger `RESEND_API_KEY` en production** (échouer le boot ou renvoyer 503 sur le POST public si `resend == null` et `NODE_ENV === 'production'`), ne garder le single-opt-in que pour le dev/test ; (b) au minimum, `logger.warn` à chaque insert en mode dégradé.
**Effort** : S.

### WS07-06 · P2 · confirmé — Conflit UNIQUE silencieux : un abonné non confirmé ne peut jamais recevoir un 2ᵉ email
**Preuve** : `route.ts:87` — `if (error && error.code !== '23505')` ignore le conflit d'unicité sur `email`. `route.ts:92` — l'envoi d'email est gardé par `error?.code !== '23505'`, donc **aucun email n'est ré-émis** quand la ligne existe déjà.
**Impact** : si un premier POST crée la ligne (`confirmed_at = null`, token posé) mais que l'email n'arrive pas (spam, échec Resend silencieux WS07-04) **ou** que le token expire (24h), un nouveau POST avec la même adresse renvoie `{ ok: true }` **sans rien faire** : ni nouveau token, ni nouvel email. L'utilisateur est bloqué dans un état « non confirmé » irrécupérable via le front (le seul moyen serait un DELETE — réservé à l'auth — ou une intervention DB). Friction de conversion + tickets support.
**Reco** : sur conflit `23505`, faire un `upsert`/`update` ciblé : **si `confirmed_at IS NULL`**, régénérer `confirmation_token` + `token_expires_at` (now()+24h) et **renvoyer le mail** (en respectant le rate-limit par email de WS07-01). Si déjà `confirmed_at`, no-op silencieux (anti-énum préservé). Ne jamais réinitialiser `confirmed_at` d'un abonné confirmé.
**Effort** : M.

### WS07-07 · P2 · confirmé — Aucun lien de désinscription dans l'email / désinscription réservée aux comptes connectés
**Preuve** : `route.ts:104-119` — le HTML de l'email ne contient **aucun lien d'unsubscribe** ni d'en-tête `List-Unsubscribe`. La seule désinscription est `DELETE /api/newsletter` (`route.ts:158-184`) qui exige une **session authentifiée** et n'agit que sur `session.user.email`.
**Impact** : un abonné **sans compte** (cas majoritaire d'un footer newsletter) **ne peut pas se désinscrire** — pas de lien, pas d'endpoint public. (1) Conformité : la loi RD 172-13 (protection des données) et les bonnes pratiques email exigent un opt-out simple ; (2) Délivrabilité : Gmail/Yahoo (depuis 2024) exigent `List-Unsubscribe` (header + one-click RFC 8058) pour les expéditeurs en volume — son absence pénalise la réputation ; (3) les destinataires marqueront « spam » faute d'alternative → dégrade encore la réputation du domaine.
**Reco** : (a) ajouter à chaque email un **lien de désinscription par token** (token dédié ou réutilisation d'un identifiant signé) pointant vers un endpoint **public** `GET /api/newsletter/unsubscribe?token=...` ; (b) ajouter l'en-tête `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. Note : la `confidentialite/page.tsx:185` promet déjà « jusqu'au désabonnement » — l'engagement existe, le mécanisme public manque.
**Effort** : M (endpoint + token + header).

### WS07-08 · P3 · confirmé (re-vérif WS03 F-RPC-4, angle email) — `create_contact_message` appelable en direct contourne rate-limit + CSRF
**Preuve** : `supabase/migrations/20260520092235_open_create_contact_message.sql:10-37` — RPC `SECURITY DEFINER` ; aucun `REVOKE`/`GRANT` restrictif n'apparaît dans la migration (contraste avec `check_rate_limit` qui, lui, est `REVOKE … FROM anon, authenticated`). Le rate-limit + `checkOrigin` ne vivent que dans la **route** `/api/contact` (`route.ts:12-29`), pas dans la RPC.
**Impact (angle email/abus)** : un client utilisant la clé anon publique (PostgREST `rpc/create_contact_message`) **shunte la route** → ni rate-limit, ni `checkOrigin`. Comme `create_contact_message` n'envoie pas d'email (insert DB seulement), l'impact « coût Resend » est nul, mais : (1) **flood d'insertion** dans `contact_messages` (DoS table / pollution boîte admin) sans throttle ; (2) la migration a *fermé* l'ancienne énumération de comptes (bon point — `user_id` reste NULL si l'email est inconnu, réponse toujours `success`) ; aucune fuite d'existence de compte par ce canal. **À confirmer DB live** : les `GRANT` effectifs sur `create_contact_message(text,text,text)` pour `anon`/`authenticated`.
**Reco** : `REVOKE EXECUTE … FROM anon, authenticated` et `GRANT … TO service_role` uniquement (aligner sur `check_rate_limit`), de sorte que la route service-role reste le seul chemin (avec son rate-limit). Suivi cohérent avec WS03 F-RPC-4.
**Effort** : S (une migration `REVOKE/GRANT`).

### WS07-09 · P3 · confirmé — `confirmed_at` non lu côté GET : un abonné non confirmé compte comme « abonné »
**Preuve** : `route.ts:144-148` — le GET sélectionne `id` sur `email` sans filtre `confirmed_at`, et renvoie `subscribed: !!data`.
**Impact** : dans `/account/preferences`, le toggle affiche « abonné » même pour une ligne en attente de confirmation. Incohérence d'état mineure (l'utilisateur croit être abonné alors que la double opt-in n'est pas finalisée). Pas de risque sécu.
**Reco** : renvoyer `subscribed = !!data.confirmed_at` (sélectionner `confirmed_at`). Décider du sens produit : un abonné connecté via `/account` devrait peut-être être confirmé directement (il est authentifié = preuve de possession de l'email).
**Effort** : S.

### WS07-10 · P3 · confirmé — Pas d'injection d'en-têtes possible, mais HTML email non échappé (note défensive)
**Preuve** : `route.ts:104-119` — l'email user **n'est jamais inséré dans le corps HTML** (seuls `confirmUrl` et des chaînes statiques le sont) ; `to: email` est passé en champ structuré à l'API Resend (pas de concaténation de header). Donc **pas** d'injection d'en-tête SMTP ni de réflexion d'email dans le corps aujourd'hui.
**Impact** : nul en l'état — finding listé comme garde-fou pour les évolutions. Si on ajoute un jour un prénom/email dans le corps (ex. « Bonjour {email} ») sans échappement, on ouvrirait une injection HTML dans l'email. `confirmUrl` est sûr car le token est `[0-9a-f]{64}` (hex) → pas de caractère HTML-actif.
**Reco** : conserver la règle « jamais de donnée user non échappée dans le HTML de l'email » ; si besoin, échapper via une fonction dédiée.
**Effort** : nul (préventif).

---

## Tableau récapitulatif

| ID | Sév. | Sujet | Fichier:ligne | Statut |
|---|---|---|---|---|
| WS07-01 | P1 | Envoi d'email vers un tiers (subscription bombing / coût Resend) | `api/newsletter/route.ts:96-120` | confirmé |
| WS07-02 | P1 | Rate-limit spoofable (XFF) + fail-open | `lib/rateLimit.ts:32-52` | suspecté (dépend Vercel) |
| WS07-03 | P2 | `checkOrigin` inopérant sans header Origin (scripts) | `lib/csrf.ts:21-22` | confirmé |
| WS07-04 | P2 | Pas de `Reply-To` ; `From`/DKIM non vérifiable repo | `lib/resend.ts:7` ; `route.ts:96` | confirmé (DNS à confirmer) |
| WS07-05 | P2 | Fallback single opt-in silencieux sans clé Resend | `lib/resend.ts:5` ; `route.ts:69-80` | confirmé |
| WS07-06 | P2 | Conflit UNIQUE silencieux → abonné non confirmé bloqué | `route.ts:87,92` | confirmé |
| WS07-07 | P2 | Pas de lien/lien `List-Unsubscribe` ; opt-out réservé aux comptes | `route.ts:104-119,158-184` | confirmé |
| WS07-08 | P3 | `create_contact_message` direct shunte rate-limit/CSRF (WS03 F-RPC-4) | migration `20260520092235` | confirmé (GRANT à confirmer DB) |
| WS07-09 | P3 | GET ignore `confirmed_at` → état « abonné » trompeur | `route.ts:144-148` | confirmé |
| WS07-10 | P3 | HTML email non échappé (préventif, pas d'injection aujourd'hui) | `route.ts:104-119` | confirmé (no-impact) |

**Points sains confirmés** (pas de finding) :
- Token = `randomBytes(32).toString('hex')` → **256 bits d'entropie crypto**, 64 hex (`route.ts:71-73`). Pas de `Math.random`.
- `token_expires_at` posé à +24h (`route.ts:82-83`) et **vérifié** au confirm via `.gt('token_expires_at', now())` (`confirm/route.ts:33`).
- **UPDATE atomique** au confirm : `confirmed_at = now()` + `confirmation_token = null` + filtres `confirmation_token = token AND confirmed_at IS NULL AND token_expires_at > now()` dans une seule requête → **token mono-usage, re-jeu et race bloqués** par la condition `confirmed_at IS NULL` (`confirm/route.ts:25-35`).
- Lien de confirmation construit via `getSiteUrl()` (`csrf.ts:16-18`, env-only) — **pas dérivé du header client** → pas d'injection de lien.
- **Anti-énumération** : POST newsletter et POST contact renvoient une réponse **indifférenciée** (existe/n'existe pas / succès) — `route.ts:126` (`{ ok: true }`) et `contact/route.ts:101-105` + RPC `create_contact_message` qui retourne toujours `success: true`.
- RLS `newsletter_subscribers` : `ENABLE ROW LEVEL SECURITY` **sans aucune policy** → 0 ligne accessible à anon/authenticated, écriture/lecture service-role only (`migration 20260520085055:22-26`). ✔
- `/api/newsletter/confirm` rate-limité 10/min/IP (`confirm/route.ts:16-23`).

---

## À confirmer hors-repo (DNS / Resend)

1. **Domaine `farmau.do` vérifié dans Resend** avec **SPF + DKIM** alignés (sinon les emails de confirmation seront rejetés/spam → double opt-in cassé silencieusement, cf. WS07-04). Vérifier dans le dashboard Resend → Domains.
2. **DMARC** sur `farmau.do` (idéalement `p=quarantine` ou `p=reject` + reporting). Absence = délivrabilité Gmail/Yahoo dégradée.
3. **`RESEND_FROM_EMAIL`** réellement positionné en prod (Vercel env) ET pointant sur un sous-domaine/adresse du domaine vérifié. À défaut, le défaut `noreply@farmau.do` doit être couvert par la vérif #1.
4. **`RESEND_API_KEY`** présent en prod (sinon mode single-opt-in dégradé silencieux, WS07-05).
5. **`NEXT_PUBLIC_SITE_URL`** positionné en prod (sinon `getSiteUrl()` tombe sur `VERCEL_URL` puis `https://farmau.do` — vérifier que le fallback final est correct pour le lien de confirmation, cf. `csrf.ts:16-18`).
6. **Comportement Vercel sur `x-forwarded-for`** : confirmer que l'edge écrase/normalise l'en-tête (et que le premier segment = IP cliente réelle), faute de quoi WS07-02 devient pleinement exploitable. Présence d'un WAF / Vercel Attack Challenge Mode ?
7. **Quota / alertes Resend** : seuil de volume et alerting bounce/complaint configurés (mitigation opérationnelle de WS07-01).

## À confirmer DB live (MCP Supabase non utilisé — lecture seule)

1. **`GRANT EXECUTE` effectifs** sur `public.create_contact_message(text,text,text)` : la migration `20260520092235` ne contient pas de `REVOKE FROM anon, authenticated`. Vérifier si la RPC est appelable par la clé anon (PostgREST) → confirme/infirme WS07-08.
   ```sql
   SELECT proname, proacl FROM pg_proc WHERE proname = 'create_contact_message';
   ```
2. **Index/contraintes sur `newsletter_subscribers`** : confirmer `email` UNIQUE + index partiel `confirmation_token` (migrations `20260520085055` + `20260527211720`) bien appliqués.
   ```sql
   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'newsletter_subscribers';
   ```
3. **Aucune policy RLS** sur `newsletter_subscribers` (table doit être verrouillée service-role only).
   ```sql
   SELECT polname FROM pg_policies WHERE tablename = 'newsletter_subscribers';  -- attendu : 0 ligne
   ```
4. **`token_expires_at`** : colonne `timestamptz` présente (migration `20260528100000`) et NULL pour les anciennes lignes pré-TTL (ces lignes ne pourront jamais être confirmées via le flux actuel à cause de `.gt('token_expires_at', ...)` — à nettoyer si présentes).
   ```sql
   SELECT count(*) FROM newsletter_subscribers WHERE confirmed_at IS NULL AND token_expires_at IS NULL;
   ```
