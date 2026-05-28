# WS14 — Observabilité (logging / résilience / monitoring)

Audit PRE-V1 · lecture seule · FARMAU · 2026-05-28
Auditeur : senior observabilité / logging / résilience

---

## Verdict

**B — sain pour le code, aveugle en prod.**

La discipline de logging est réelle : **0 `console.*` résiduel** hors `logger.ts`, **137 call-sites** passés par `src/lib/logger.ts`, et — point crucial — **aucune fuite PII confirmée dans les logs** (les `logger.error` passent l'objet `error` Supabase/PG, jamais l'email/nom/téléphone/contenu de message en clair). Les error boundaries et la 404 sont en place et localisées (sauf l'admin, ES hardcodé). Les messages d'erreur renvoyés au client sont **génériques** sur les routes publiques sensibles (cart, reserve, newsletter, contact POST).

Mais deux trous sérieux pour une V1 :

1. **Aucune observabilité prod** (P1) — pas de Sentry / APM / monitoring d'erreurs, pas de health-check, pas d'`instrumentation.ts`. L'exploitant ne verra les erreurs que dans les logs Vercel runtime (rétention courte, pas d'alerte, pas d'agrégation). Une panne silencieuse (RPC cassée, Resend down, Supabase 500) passe inaperçue.
2. **`logger.info` muet en prod par design** + le logger n'ajoute **aucun contexte structuré** (pas de timestamp, niveau, route, requestId) — les logs Vercel sont du texte brut peu exploitable.

**Aucun P0.** La crainte « fuite PII massive dans les logs » est **infirmée**.

---

## 1. Analyse `logger.ts` + fuite PII

### Implémentation (`src/lib/logger.ts`, 21 lignes)

```ts
const isProd = process.env.NODE_ENV === 'production'
function formatArgs(args) {
  if (!isProd) return args
  return args.map((a) => a instanceof Error ? { message: a.message, stack: a.stack } : a)
}
export const logger = {
  error(...args) { console.error(...formatArgs(args)) },
  warn(...args)  { console.warn(...formatArgs(args)) },
  info(...args)  { if (!isProd) console.log(...args) },
}
```

Constat :
- **Niveaux** : error / warn / info uniquement. Pas de `debug`.
- **Sortie** : `console.error` / `console.warn` → `stderr`/`stdout`, captés tels quels par Vercel.
- **Format** : aucune structure (pas de JSON, timestamp, niveau, route, requestId). En prod, seul un `Error` natif est réduit à `{ message, stack }` ; tout autre argument (objet `PostgrestError`, string, payload) est loggé **tel quel**.
- **`info` muet en prod** : volontaire (évite le bruit) mais aussi : aucune trace de succès/évènement métier en prod.

### Fuite PII — VERDICT : non confirmée (risque résiduel faible)

J'ai recensé les **137 call-sites** `logger.error/warn`. Aucun ne passe un champ PII en clair.

- **Pattern dominant** : `logger.error('<contexte>', error)` où `error` est un `PostgrestError` / `AuthError` / `Error`. Ces objets contiennent `message`/`code`/`details`/`hint` (structure de schéma, pas de données utilisateur), jamais la ligne insérée.
- **Routes manipulant de la PII — vérifiées, aucune fuite** :
  - `api/contact/route.ts:72,108,148,155` → logge l'objet `error`, **jamais** `email`/`subject`/`message` (le body utilisateur n'est pas re-loggé).
  - `api/newsletter/route.ts:88,122,151,179` → logge l'objet `error` / l'erreur Resend, **jamais** l'email saisi. (`:122 'resend error:', emailErr` — `emailErr` est l'erreur SDK, pas l'adresse ; faux positif sur le nom de variable.)
  - `api/cart/reserve/route.ts:29,55,138` → logge `sessionError`/`cartError`/`rpcError`, pas le `user.id` ni le contenu panier.
  - `(auth)/signup/page.tsx:127,135` → logge `profileError` (PG error) / `err`. Le payload tenté (`first_name`, `phone`…) **n'est pas** dans l'objet PG error → pas loggé.
  - `account/profile/page.tsx:47`, `account/reservations/page.tsx:77` → objet `error` seul.
- **Grep ciblé** `logger.* (email|phone|body|name|user.|first_name|message,)` → **0 vrai positif** (seul `:122 emailErr` matche par nom, faux positif).

Le seul vecteur théorique : un `PostgrestError.message` PG peut, sur violation de contrainte, contenir une valeur (`duplicate key value violates ... (email)=(x@y.com)`). C'est **possible mais non systématique** et reste dans les logs serveur (non exposé au client). → noté **WS14-04 (P2, suspecté)**.

**Conclusion PII** : cohérent avec l'assertion de WS06 (« aucun log ne fuit de PII »). **Confirmé.**

---

## 2. `console.*` résiduels

`grep -rn 'console\.(log|error|warn|debug|info)' src/` hors `logger.ts` → **0 résultat**. La migration des 128 `console.*` est complète et tenue. **Rien à signaler.** Note : la métrique « 126 console.error » du `code-quality.md` (table) est **obsolète** — le finding #7 « OUVERT » y est en réalité fermé (logger.ts livré). À corriger dans cet audit (cosmétique).

---

## 3. Error boundaries & 404

| Fichier | Présent | Localisé | Reset | Fuite client |
|---|---|---|---|---|
| `src/app/[locale]/error.tsx` | ✅ | ✅ `useTranslations('Error')` | ✅ `reset()` | Aucune (message générique, `error` non affiché) |
| `src/app/admin/error.tsx` | ✅ | ❌ **ES hardcodé** (« Algo salió mal… ») | ✅ `reset()` | Aucune |
| `src/app/[locale]/not-found.tsx` | ✅ | ✅ `getTranslations('NotFound')` | n/a | Aucune |
| `src/app/not-found.tsx` (racine) | ✅ | ❌ FR/ES mélangés (« Page not found » + « Volver al inicio ») | n/a | Aucune |
| `src/app/global-error.tsx` | ❌ **ABSENT** | — | — | — |

Points :
- **Aucune** error boundary n'affiche la stack ou le message d'erreur au client → pas de fuite côté client. **Bon.**
- **`global-error.tsx` absent (WS14-05, P2)** : si le root layout (`src/app/layout.tsx`) lui-même throw (ex : `getThemeConfig` qui throw au lieu de retourner un fallback, erreur d'hydratation racine), Next.js sert sa **page d'erreur Next par défaut non stylée et non localisée**. Couverture des segments critiques sinon correcte (`[locale]` couvre tout le public, `admin` couvre l'admin).
- **`admin/error.tsx` ES hardcodé (WS14-06, P2)** : incohérent avec l'admin entièrement localisé FR/ES/EN (cookie `farmau_admin_locale`). Mineur (admin = staff hispanophone), mais c'est une régression de la discipline i18n du projet.
- **`not-found.tsx` racine mélange FR/ES (WS14-07, P3)** : titre EN, CTA ES. Cosmétique, attrape <1 % des 404 (hors segment locale).

---

## 4. Routes API — uniformité de la gestion d'erreur

**Bonne nouvelle sur les routes publiques sensibles** : messages génériques + codes machine.
- `cart/route.ts`, `cart/reserve/route.ts`, `cart/merge`, `newsletter` (POST/GET/DELETE), `contact` **POST**, `account/preferences`, `wishlist`, `search` → tous renvoient un message **générique** (`'insert_failed'`, `'Erreur serveur interne'`, mapping ERRCODE→`code`). Pas de fuite de schéma. `cart/reserve` est exemplaire (switch ERRCODE → `code` lisible client).

**Fuite de `error.message` PG brut au client** (`grep` → 17 occurrences) :

| Route | Ligne(s) | Exposition | Sévérité |
|---|---|---|---|
| `api/contact/route.ts` **GET** | 149 | **utilisateur authentifié** | **WS14-02 (P1)** |
| `api/admin/messages/route.ts` | 35, 97, 126 | admin-only | WS14-03 (P2) |
| `api/admin/posts/route.ts` | 27, 61, 102, 122 | admin-only | WS14-03 (P2) |
| `api/admin/reservations/route.ts` | 53, 128 | admin-only | WS14-03 (P2) |
| `api/admin/tags/route.ts` + `[id]` | 23, 57, 36, 63 | admin-only | WS14-03 (P2) |
| `api/admin/tag-types/route.ts` + `[id]` | 25, 59, 36, 67, 81 | admin-only | WS14-03 (P2) |

- **WS14-02 (P1, confirmé)** — `api/contact GET:149` renvoie `error.message` brut à un utilisateur authentifié (route exposée à tout compte). Corrobore le finding signalé par l'autre agent. Fuit la structure PG (nom de colonne, contrainte) à un acteur non-admin. → renvoyer `{ error: 'fetch_failed' }`.
- **WS14-03 (P2, confirmé)** — 16 routes `/api/admin/*` renvoient `error.message` brut. Périmètre admin (auth + `requireAdmin`), donc surface réduite, mais c'est une fuite de schéma à un compte compromis et une incohérence avec les routes publiques. → uniformiser sur un message générique + log serveur (le log conserve déjà le détail).

**Routes admin protégées** : toutes gardées `requireAdmin()` (cf. WS03), donc WS14-03 n'est exploitable qu'avec une session admin.

---

## 5. Surveillance prod — ABSENCE de monitoring (WS14-01, P1)

`package.json` : **aucune** dépendance Sentry / Datadog / Logtail / OpenTelemetry / Axiom / Bugsnag / Rollbar. Pas de `src/instrumentation.ts`. Pas de health-check (`api/health|status|ping` → absent). Pas de `withSentryConfig` dans `next.config`.

**Impact V1** : aveugle total en prod. Une erreur 500 (RPC cassée après migration, Resend down, quota Supabase, fuite de connexions) n'est visible que :
- dans les logs Vercel runtime (rétention **courte** sur le plan Hobby/Pro, pas d'alerte, pas de dédup, pas de stacktrace agrégée),
- ou via un client qui se plaint.
Aucun MTTR mesurable, aucune détection proactive. Pour une boutique qui prend des réservations (revenus), c'est un risque réel.

**Reco proportionnée (effort croissant)** :
1. **Minimum V1 (effort S, ~30 min)** : activer **Vercel Log Drains** ou au moins documenter que l'exploitant surveille les logs Vercel + activer les **Vercel alerts** natives sur taux d'erreur des fonctions. Ajouter une route **`/api/health`** (status 200 + check Supabase léger) pour un uptime-monitor externe gratuit (UptimeRobot / Better Uptime).
2. **Recommandé V1 (effort M, ~2 h)** : **Sentry** (`@sentry/nextjs`) — capture serveur + client + source maps, alerting, dédup. Le wizard pose `instrumentation.ts` + `global-error.tsx` (résout aussi WS14-05). Filtrer la PII via `beforeSend` (l'archi logger actuelle aide : peu de PII à scrubber). C'est l'option standard pour une V1 Next.js/Vercel.
3. **Si budget zéro** : se contenter de (1) + structurer le logger (WS14-08) pour que les logs Vercel soient grep-ables.

→ **Reco : option (2) Sentry** pour une V1 qui encaisse des réservations. À défaut, (1) est le plancher non négociable.

---

## 6. Logs serveur Vercel — ce que verra l'exploitant

- **Secrets** : jamais loggés. `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` n'apparaissent dans aucun `logger.*`. ✅ (recoupe WS05.)
- **Niveau de bruit** : modéré. `logger.info` muet en prod → pas de spam. Les `error/warn` ne se déclenchent que sur vraie erreur. Le `rateLimit` logge un `error` « fail-open » sur RPC échouée (`lib/rateLimit.ts:22,33`) — bruit acceptable, mais c'est un `error` pour un comportement dégradé volontaire (devrait être `warn`).
- **Exploitabilité** : **faible**. Logs en texte brut, sans niveau préfixé, sans route, sans timestamp applicatif, sans requestId. Corréler une erreur client à une trace serveur est manuel. → **WS14-08 (P2)** : enrichir le logger (préfixe niveau + timestamp ISO + sérialisation JSON optionnelle en prod) pour exploiter les logs Vercel sans APM.

---

## Tableau récapitulatif

| ID | Sév. | Preuve | Impact | Reco | Effort | Statut |
|---|---|---|---|---|---|---|
| WS14-01 | **P1** | `package.json` (0 dep monitoring), pas d'`instrumentation.ts`, pas de `/api/health` | Aveugle en prod : aucune détection/alerte d'erreur, pas d'uptime | Sentry (`@sentry/nextjs`) + `/api/health` ; a minima Vercel alerts + log drain | M | confirmé |
| WS14-02 | **P1** | `api/contact/route.ts:149` | `error.message` PG brut → utilisateur authentifié (fuite schéma) | Renvoyer `{ error: 'fetch_failed' }`, log serveur conserve le détail | S | confirmé |
| WS14-03 | P2 | 16× `error.message` dans `/api/admin/{messages,posts,reservations,tags,tag-types}` | Fuite schéma PG à session admin (compromise) ; incohérence routes | Uniformiser message générique + log serveur | M | confirmé |
| WS14-04 | P2 | logger passe `PostgrestError` (137 sites) ; ex `newsletter:88`, `contact:72` | Un `error.message` de violation de contrainte peut contenir une valeur (email) — dans les logs serveur uniquement | Wrapper de log qui ne sérialise que `code`/`message tronqué`, ou scrub côté APM | S | suspecté |
| WS14-05 | P2 | `src/app/global-error.tsx` absent | Erreur du root layout → page Next par défaut (non stylée, non localisée) | Ajouter `global-error.tsx` (auto si Sentry wizard) | S | confirmé |
| WS14-06 | P2 | `src/app/admin/error.tsx:11-25` ES hardcodé | Admin localisé FR/ES/EN sauf son error boundary | `useTranslations('Error')` + cookie locale | S | confirmé |
| WS14-07 | P3 | `src/app/not-found.tsx:15,21` | 404 racine FR/ES mélangés | Texte EN cohérent (fallback hors locale) | XS | confirmé |
| WS14-08 | P2 | `src/lib/logger.ts` (pas de niveau/timestamp/route/requestId) | Logs Vercel peu exploitables sans APM | Préfixer niveau + timestamp ISO + JSON optionnel ; `rateLimit` fail-open en `warn` | S | confirmé |

**Synthèse sévérité** : 0 P0 · 2 P1 · 5 P2 · 1 P3.

---

## Notes de recoupement

- **WS06 (PII)** : confirme l'assertion « aucun log ne fuit de PII ». Vérification fine faite ici → **confirmé**, avec la nuance WS14-04 (PG error message peut contenir une valeur sur violation de contrainte, logs serveur seulement).
- **WS03 (authz)** : les 16 routes admin de WS14-03 sont bien gardées `requireAdmin()` → exploitation conditionnée à une session admin.
- **WS05 (secrets)** : confirme qu'aucun secret n'est loggé.
- **`docs/audits/code-quality.md`** : la table métrique (« 126 console.error », finding #7 « OUVERT ») est **obsolète** — `logger.ts` est livré et la migration complète (0 résiduel). À mettre à jour.
