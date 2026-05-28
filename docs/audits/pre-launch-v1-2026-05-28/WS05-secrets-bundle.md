# WS05 — Secrets & Bundle (audit PRE-V1, lecture seule)

Date : 2026-05-28 · Auditeur : sécurité senior (gestion des secrets) · Portée : hygiène des secrets, fuite dans le bundle client, historique git, CI/Vercel.
Méthode : lecture / grep / `git log` uniquement. **Aucune valeur de secret réelle n'est divulguée** (masquées). Pas de MCP Supabase.

---

## Verdict

**VERT — GO pour V1 sur le périmètre secrets.** Aucun finding P0 ni P1.

L'hygiène des secrets est solide. Les trois clients Supabase sont correctement séparés (browser anon / server cookies / service-role serveur). La clé service-role et `RESEND_API_KEY` sont strictement server-only, jamais préfixées `NEXT_PUBLIC_`, jamais importées dans un composant `'use client'`, et **absentes du bundle client compilé** (vérifié sur `.next/static`). Aucun secret en dur dans `src/`, `scripts/`, `supabase/`, `db/`, ni dans les diffs git récents. `.env.local` et `.mcp.json` sont gitignorés et n'ont **jamais** contenu de valeur de secret dans l'historique. CI référence tous les secrets via `${{ secrets.* }}`.

3 findings P2 (hygiène / défense en profondeur), aucun ne bloque la V1.

---

## Findings

| ID | Sév | Sujet | Statut |
|---|---|---|---|
| WS05-01 | P2 | Pas de barrière `import 'server-only'` sur `supabaseAdmin`/`resend` | confirmé |
| WS05-02 | P2 | Nom d'env `SUPABASE_SERVICE_KEY` présent en littéral dans le bundle client + check de message stale | confirmé |
| WS05-03 | P2 | `project_ref` Supabase dans l'historique git via `.mcp.json` (identifiant non-secret) | confirmé (info) |

### WS05-01 · P2 · Aucune barrière `server-only` sur les modules à secret · confirmé
- **Preuve** : `grep -rn "server-only" src/` → 0 résultat. `src/lib/supabaseAdmin.ts` (lit `SUPABASE_SERVICE_ROLE_KEY`) et `src/lib/resend.ts` (lit `RESEND_API_KEY`) n'importent pas le package `server-only`.
- **Impact** : aujourd'hui aucun composant client n'importe ces modules (vérifié, voir Points sains). Mais rien n'empêche **techniquement** un futur `import { supabaseAdmin } from '@/lib/supabaseAdmin'` dans un fichier `'use client'`. Sans `server-only`, Next.js ne lèverait pas d'erreur de build ; le module serait évalué côté serveur (les `process.env` server-only seraient `undefined` côté client donc `supabaseAdmin === null`), mais on perd le garde-fou explicite et la valeur de la clé pourrait fuiter dans un bundle si le code la manipulait en string.
- **Reco** : ajouter `import 'server-only'` en tête de `src/lib/supabaseAdmin.ts`, `src/lib/resend.ts`, `src/lib/requireAdmin.ts` et `src/lib/rateLimit.ts`. Build échoue immédiatement si un client les importe. Le commentaire JSDoc « NE JAMAIS importer ce fichier depuis du code client » existe déjà mais n'est pas exécutoire.
- **Effort** : 5 min (1 ligne × 4 fichiers + `npm i server-only` si absent — déjà fourni par Next).

### WS05-02 · P2 · Littéral `"SUPABASE_SERVICE_KEY"` dans le bundle client + check obsolète · confirmé
- **Preuve** :
  - `src/app/admin/setup/page.tsx:26` (`'use client'`) : `data.message?.includes('SUPABASE_SERVICE_KEY')` ; ligne 99 : `<span>SUPABASE_SERVICE_KEY</span>` (label affiché).
  - Idem `src/app/admin/product/_hooks/useProductsData.ts:40` et `src/app/admin/marques/_hooks/useBrandsData.ts:33` : `.message?.includes('SUPABASE_SERVICE')`.
  - Bundle compilé : `.next/static/chunks/app/admin/setup/page-*.js` contient `…includes("SUPABASE_SERVICE_KEY")…` et le label. **C'est le NOM de la variable, jamais une valeur** (`grep eyJ` sur ce chunk → 0).
- **Impact** : **aucune fuite de secret** — le nom d'une variable d'environnement n'est pas sensible. Deux nuisances mineures : (1) bruit dans le bundle ; (2) le check est **stale** : l'API `/api/admin/products` ne renvoie plus ce nom — elle renvoie `{ error: 'Configuration serveur manquante' }` (`route.ts:12,75`) et `requireAdmin` renvoie `{ error: 'Erreur serveur' }`. Donc la détection « clé service-role manquante » du diagnostic `/admin/setup` ne se déclenche plus jamais → faux positif silencieux côté admin.
- **Reco** : corriger le diagnostic pour matcher le message réel (`'Configuration serveur manquante'`) ou exposer un endpoint de santé dédié. Ne pas afficher de noms d'env dans le markup. Pas un bloqueur V1.
- **Effort** : 15 min.

### WS05-03 · P2 (info) · `project_ref` Supabase dans l'historique git · confirmé
- **Preuve** : `.mcp.json` a été committé (`24913e1`) puis retiré + gitignoré (`748b506`). La version committée ne contenait **que** l'URL HTTP du MCP avec `project_ref=adxpoxcynrpnbbxnncsk` — **aucune clé API** (`git show 24913e1:.mcp.json` masqué = clean ; le diff de suppression aussi). Le `project_ref` apparaît aussi dans `.mcp.json` courant et dans `CLAUDE.md`.
- **Impact** : nul à très faible. Le `project_ref` est l'identifiant public du projet — il est dans l'URL de **chaque** requête PostgREST/Auth (`https://adxpoxcynrpnbbxnncsk.supabase.co`) et n'est pas un secret. La sécurité repose sur les clés (jamais committées) + RLS, pas sur l'obscurité du ref.
- **Reco** : aucune action requise. Mention pour traçabilité. (Le message de commit `748b506` « contains API keys » était précautionneux : ce qui a été committé n'en contenait aucune.)
- **Effort** : 0.

---

## Inventaire des variables d'environnement (sensibilité)

| Variable | Préfixe | Sensibilité | Lecture (server/client) | Exposée client ? | OK ? |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_` | **Publique** (par design) | les deux | Oui (attendu) | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_` | **Publique** (anon, RLS-gardée) | les deux | Oui (attendu) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `NEXT_PUBLIC_` | Publique (URL) | les deux | Oui (attendu) | ✅ |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `NEXT_PUBLIC_` | Publique (n° contact) | les deux | Oui (attendu) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | aucun | **SECRET — bypass RLS** | server only | **Non** (vérifié bundle) | ✅ |
| `SUPABASE_SERVICE_KEY` | aucun | **SECRET** (alias legacy) | server only | **Non** | ✅ |
| `RESEND_API_KEY` | aucun | **SECRET** (envoi email) | server only (`resend.ts`) | **Non** (vérifié bundle) | ✅ |
| `RESEND_FROM_EMAIL` | aucun | Non-secret (config) | server only | Non | ✅ |
| `NODE_ENV` | aucun | Non-secret (runtime) | les deux | — | ✅ |
| `VERCEL_URL` | aucun | Non-secret (injecté Vercel) | server only | Non | ✅ |

**Constats clés :**
- Aucun secret n'est préfixé `NEXT_PUBLIC_`. Seules l'URL + l'anon key sont publiques (correct — l'anon key est conçue pour le client et protégée par RLS).
- `SUPABASE_SERVICE_ROLE_KEY` lu uniquement dans `src/lib/supabaseAdmin.ts:15` (avec alias `SUPABASE_SERVICE_KEY`). `RESEND_API_KEY` uniquement dans `src/lib/resend.ts:3`.
- Les deux modules ont un **fallback gracieux** : `supabaseAdmin = null` si clé absente (routes répondent proprement), `resend = null` si pas de `RESEND_API_KEY` → newsletter en single opt-in. Pas de crash, pas de leak.
- `.env.local` (working tree) contient exactement : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (noms uniquement — valeurs non lues/non divulguées). `.env.local.example` = placeholders uniquement.

---

## Points sains (vérifiés)

1. **`supabaseAdmin` jamais en composant client.** Les ~33 importeurs de `supabaseAdmin` sont tous des routes API (`/api/admin/*`, `/api/cart`, `/api/contact`, `/api/newsletter*`), des helpers serveur (`requireAdmin.ts`, `rateLimit.ts`) ou des Server Components (`admin/page.tsx` — pas de `'use client'`, utilise `next-intl/server`). Boucle de détection `'use client'` sur tous les importeurs → 0 hit.
2. **Bundle client propre.** `grep` du chunk `.next/static` : `SUPABASE_SERVICE_ROLE_KEY`/`RESEND_API_KEY` (noms) **absents** ; seul le **littéral** `"SUPABASE_SERVICE_KEY"` du diagnostic setup est présent (nom, pas valeur — WS05-02). Aucune valeur shape `eyJ…` côté client.
3. **Zéro secret en dur.** Scan large (`eyJ…JWT`, `sb_secret_`, `sb_publishable_`, `re_…`, `AKIA…`, `-----BEGIN`, `password=…`) sur `src/ scripts/ supabase/ db/ *.ts *.mjs *.json docs/ README` → seuls des mots de passe de **fixtures de test** (`password123` dans `src/__tests__/auth.test.tsx`). Aucune clé live.
4. **Historique git propre.** `.env.local` / `.env` : **jamais** committés. `.mcp.json` committé une fois mais **sans clé** (URL HTTP seule). Scan des diffs des 40 derniers commits pour valeurs de secret introduites (`+…eyJ…`, `+…re_…`, `+…SERVICE_ROLE_KEY=ey…`) → 0.
5. **`.gitignore` correct.** `.env*` ignoré (sauf `.env.local.example` / `.env.example` opt-in), `.mcp.json` ignoré (« contient des clés API »), `bd1/bd2/contenu_bd` ignorés. `git check-ignore` confirme `.env.local` + `.mcp.json` ignorés ; `git ls-files` ne trace que `.env.local.example`.
6. **Scripts CLI isolés.** `scripts/*.cjs|.js` utilisent `process.env.SUPABASE_SERVICE_ROLE_KEY`/`SERVICE_KEY` (légitime pour create-admin/seed) et ne sont **importés par aucun module de `src/`** (seule réf : un commentaire dans `themes.ts`). Aucun secret en dur dans les scripts.
7. **CI sans secret en dur.** `.github/workflows/ci.yml` : job `build` utilise des **placeholders** (`placeholder.supabase.co`, `placeholder`) ; job `e2e` injecte `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` via `${{ secrets.* }}`. Aucune valeur littérale.
8. **`next.config.ts` ne réexporte aucun secret.** Pas de bloc `env:` exposant des variables ; uniquement headers de sécurité (CSP, X-Frame-Options, etc.) et config images. (La CSP `script-src 'unsafe-inline' 'unsafe-eval'` est un sujet qualité-CSP relevant d'un autre workstream, pas un enjeu secrets.)
9. **`.mcp.json` courant sans clé.** Transport HTTP/OAuth (`mcp.supabase.com`, `mcp.vercel.com`) — pas de clé API Vercel embarquée dans le fichier actuel. Néanmoins maintenu gitignoré (correct, défense en profondeur si une clé y était ajoutée).

---

## Reco priorisées (toutes post-V1, non bloquantes)

1. **(P2)** Ajouter `import 'server-only'` à `supabaseAdmin.ts`, `resend.ts`, `requireAdmin.ts`, `rateLimit.ts` — garde-fou exécutoire contre une future fuite client.
2. **(P2)** Corriger / retirer le diagnostic stale `/admin/setup` qui matche un message d'erreur API qui n'existe plus, et ne pas afficher de noms d'env dans le markup client.
3. **(Info)** Aucune action sur le `project_ref` en historique (identifiant non-secret).
