# WS17 — Dépendances / Supply Chain

Audit PRE-V1 en **lecture seule** · FARMAU · 2026-05-28
Stack : Next.js 15.5.18 + React 19 + Supabase · cible RD/DOP
Méthode : `npm audit --json`, `npm outdated`, lecture `package.json` + `package-lock.json` (lockfileVersion 3), grep imports. **Aucune commande mutante** (pas de `npm install/update/ci`). Réseau npm registry **disponible** → `npm audit` a tourné.

---

## Verdict

**GO conditionnel pour la V1.** Aucune CVE exploitable dans une dépendance **runtime/production**. Les 7 vulnérabilités remontées par `npm audit` sont soit (a) **dev-only** (happy-dom critique, minimatch/picomatch/brace-expansion high/moderate — chaîne de test/lint, jamais bundlée ni servie), soit (b) une **moderate postcss bundlée par Next** (XSS au stringify CSS, non déclenchable par notre code de build). Rien ne bloque le déploiement.

Sur le fond : SDKs runtime à jour (next 15.5.18, react 19.1 stable, supabase-js 2.106, next-intl 4.12, zod 4, resend 6). Lockfile présent, committé, cohérent. Les seuls points de polish : 1 lib d'icônes (`react-icons`) utilisée pour **un seul** glyphe (candidat retrait), `dotenv` en dep de prod alors qu'il n'est utilisé que par les scripts CLI + tests, et l'absence de champ `engines.node` / `.nvmrc`.

| Sévérité | Nombre |
|---|---|
| P0 (bloquant V1) | **0** |
| P1 (important) | **1** (happy-dom critique — dev-only, à patcher avant de banaliser le CI) |
| P2 (mineur / polish) | **6** |

---

## Sortie `npm audit` (réseau OK)

```
7 vulnerabilities (4 moderate, 2 high, 1 critical)
dependencies: prod 104 · dev 561 · optional 161 · peer 8 · total 727
```

| Paquet | Sév. | Direct ? | Portée | Range vuln. | Fix | Chaîne / source |
|---|---|---|---|---|---|---|
| **happy-dom** | critical | oui | **dev** | `<=20.8.8` | 20.9.0 (major) | devDep test (`vitest` env). 3 advisories : VM context escape→RCE (GHSA-37j7-fg3j-429f), fetch cookie leak (GHSA-w4gp-fjgq-3q4g), unsanitized export names→code exec (GHSA-6q6h-j7hj-3r64) |
| **minimatch** | high | non | **dev** | `<=3.1.3` | patch dispo | v3.1.2, transitif via `@typescript-eslint/typescript-estree`, `glob`. 3 ReDoS |
| **picomatch** | high | non | **dev** | `<=2.3.1` | patch dispo | v2.3.1, transitif via vite/vitest/lint-staged/@parcel/watcher/tinyglobby |
| **brace-expansion** | moderate | non | **dev** | `<1.1.13` | patch dispo | v1.1.12, ReDoS/hang (GHSA-f886-m6hf-6m8v) |
| **postcss** | moderate | non | **prod (build)** | `<8.5.10` | (via next major) | **v8.4.31 bundlée sous `node_modules/next/`**. XSS via `</style>` non échappé au stringify (GHSA-qx2v-qp2m-jg93, CVSS 6.1). Le top-level postcss est **8.5.15 (sain)** |
| **next** | moderate | oui | prod | — | (downgrade 9.3.3 = faux fix) | **purement dérivé** : `via: ["postcss"]`. C'est le postcss 8.4.31 bundlé. `fixAvailable` propose un downgrade absurde → à ignorer |
| **next-intl** | moderate | oui | prod | — | — | **purement dérivé de `next`** (`via: ["next"]`). Pas de vuln propre |

**Lecture des 3 dernières lignes** : `next` et `next-intl` n'ont **aucune faille propre** ; npm les liste uniquement parce qu'elles tirent le postcss vulnérable. La seule vraie surface "prod" est donc le **postcss 8.4.31 interne à Next**, et elle n'est exploitable que si on fait passer de l'input attaquant dans un pipeline postcss qui re-stringifie du CSS — ce qui n'arrive pas dans une app Next standard (le CSS est nos sources + Tailwind au build, pas de l'input utilisateur). **Non bloquant.**

## Sortie `npm outdated`

```
Package                    Current    Wanted   Latest
@eslint/eslintrc             3.3.1     3.3.5    3.3.5    (dev)
@tailwindcss/postcss        4.1.11     4.3.0    4.3.0    (dev)
@testing-library/jest-dom    6.6.3     6.9.1    6.9.1    (dev)
@testing-library/react      16.3.0    16.3.2   16.3.2   (dev)
@types/node                20.19.4  20.19.41   25.9.1   (dev, major dispo mais on cible Node 20)
@types/react                19.1.8   19.2.15  19.2.15   (dev)
@types/react-dom            19.1.6    19.2.3   19.2.3    (dev)
@vitejs/plugin-react         4.6.0     4.7.0    6.0.2     (dev, major)
dotenv                      16.6.1    16.6.1   17.4.2     (prod, major)
eslint                      9.30.1    9.39.4   10.4.0     (dev, major)
eslint-config-next         15.5.18   15.5.18   16.2.6     (dev, major suit Next 16)
glob                        11.1.0    11.1.0   13.0.6     (dev, major)
happy-dom                   18.0.1    18.0.1   20.9.0     (dev, major — = fix CVE)
isomorphic-dompurify        3.14.0    3.15.0   3.15.0     (prod, patch)
lucide-react               0.522.0   0.522.0   1.17.0     (prod, major)
next                       15.5.18   15.5.18   16.2.6     (prod, major)
next-intl                   4.12.0    4.13.0   4.13.0     (prod, minor)
react / react-dom           19.1.0    19.2.6   19.2.6     (prod, minor)
react-icons                  5.5.0     5.6.0    5.6.0      (prod, minor)
swr                          2.3.4     2.4.1    2.4.1      (prod, minor)
tailwindcss                 4.1.11     4.3.0    4.3.0      (dev, minor)
typescript                   5.8.3     5.9.3    6.0.3      (dev, major)
vitest                       3.2.4     3.2.4    4.1.7      (dev, major)
```

Aucun retard **runtime** critique. React 19.1.0 est **stable** (pas RC/preview) — un minor 19.2.x est dispo. `next 15.5.18 → 16` et `lucide-react 0.522 → 1.x` sont des majors à planifier **post-V1**. Le retard `wanted` (mises à jour semver-compat) est faible partout sauf les types/test tooling — tous dev.

---

## Findings

### WS17-01 · P1 (dev-only) · happy-dom 18.0.1 critique (VM escape → RCE) · **confirmé**
- **Preuve** : `happy-dom@18.0.1`, devDep, `range <=20.8.8`. 3 advisories dont VM Context Escape→RCE (GHSA-37j7-fg3j-429f, critical). Utilisé comme environnement de test Vitest (`vitest.config.ts: environment: 'happy-dom'`).
- **Impact** : **nul en production** (jamais bundlé, jamais servi). Surface = exécution de code de test/CI qui parserait un HTML hostile. Risque réel uniquement si du contenu non fiable transite par les tests (pas le cas ici, fixtures internes).
- **Reco** : monter `happy-dom@^20.9.0` (major, fixe les 3 CVE) — ou basculer l'env Vitest sur `jsdom` (déjà tiré en transitif via isomorphic-dompurify). Vérifier que les 8 tests passent (le major 18→20 peut changer le comportement DOM). À faire **avant** d'élargir le CI à des PR externes ; non bloquant pour la V1.
- **Effort** : S (bump + relance `vitest`).

### WS17-02 · P2 · postcss 8.4.31 bundlé sous Next (XSS stringify) · **confirmé**
- **Preuve** : `node_modules/next/node_modules/postcss@8.4.31` (`<8.5.10`, GHSA-qx2v-qp2m-jg93, CVSS 6.1). Le postcss top-level est 8.5.15 (sain). Remonté par audit comme `next`/`next-intl` "moderate".
- **Impact** : faible. Exploitable seulement si de l'input attaquant traverse un pipeline postcss re-stringifiant du CSS — pas notre cas (CSS = sources + Tailwind, au build). `fixAvailable` propose un downgrade Next 9.3.3 → **faux positif, à ne PAS appliquer**.
- **Reco** : se résoudra naturellement au prochain bump Next patch/minor qui embarque postcss ≥ 8.5.10. Surveiller, ne rien forcer (un `overrides` postcss sur la copie interne de Next est risqué).
- **Effort** : XS (attendre bump Next).

### WS17-03 · P2 (dev-only) · minimatch / picomatch / brace-expansion ReDoS · **confirmé**
- **Preuve** : `minimatch@3.1.2` (high, 3 ReDoS), `picomatch@2.3.1` (high), `brace-expansion@1.1.12` (moderate). Tous **dev**, transitifs via eslint/typescript-estree, glob, vite/vitest, lint-staged.
- **Impact** : nul en prod. ReDoS sur des patterns glob — surface = tooling local/CI.
- **Reco** : `fixAvailable: true` (patches semver-compat). Ils remonteront lors d'un bump des outils dev (eslint, vitest, lint-staged dans `npm outdated`). Optionnel : `npm audit fix` (mutant — laisser l'utilisateur le lancer).
- **Effort** : XS.

### WS17-04 · P2 · `react-icons` ne sert qu'à UN seul icône → candidat retrait · **confirmé**
- **Preuve** : `grep` exhaustif → `react-icons` n'est importé que via `import { SiWhatsapp } from 'react-icons/si'` dans **5 fichiers** (`NavBar`, `Footer`, `pharmacie`, `AboutCta`, `AboutVisit`). Aucun autre glyphe.
- **Impact** : dépendance entière (le package `react-icons` agrège des dizaines de sets) pour un seul logo de marque. `react-icons/si` se tree-shake bien, donc l'impact **bundle réel est minime**, mais c'est une 3e lib d'icônes à maintenir/auditer.
- **Reco** : remplacer `SiWhatsapp` par un petit SVG inline (logo WhatsApp = SVG trivial) ou un composant maison, puis `npm uninstall react-icons`. Consolide à 2 libs d'icônes.
- **Effort** : S.

### WS17-05 · P2 · `@heroicons/react` partiellement remplaçable (mais pas trivial) · **suspecté**
- **Preuve** : `@heroicons/react/24/outline` importé dans **5 fichiers**. Usages statiques légers (`contact`, `admin/setup`, `TagSelector`, `useTagsData`), MAIS `admin/tags/_lib/icons.ts` mappe **~27 icônes heroicons par nom** (picker d'icônes pour les types de tags : Beaker, Bolt, Sparkles, Shield, Sun, Moon…). lucide-react (lib principale, 73 fichiers) a un autre jeu de noms.
- **Impact** : 3e lib d'icônes. Le picker de tags est un couplage fort (mapping nom→composant), retirer heroicons impliquerait de re-mapper sur lucide.
- **Reco** : **post-V1**. Si consolidation un jour : migrer le picker `tags/_lib/icons.ts` vers lucide puis drop heroicons. Pas prioritaire (tree-shaking limite l'impact bundle).
- **Effort** : M.

### WS17-06 · P2 · `dotenv` en dépendance de **production** alors qu'il est dev/scripts-only · **confirmé**
- **Preuve** : `dotenv@^16.6.1` dans `dependencies`. `grep` : **0 import dans `src/`**. Utilisé uniquement par les scripts CLI (`seed-import.cjs`, `create-admin-user.js`, `check-products.js`, `reset-password.js`, `make-existing-user-admin.js`) et `tests/_helpers/test-users.ts`. Next.js charge `.env*` nativement, dotenv n'est jamais requis au runtime de l'app.
- **Impact** : cosmétique — gonfle `dependencies` (n'affecte pas le bundle client, scripts node only). Pas de risque.
- **Reco** : déplacer `dotenv` vers `devDependencies` pour refléter l'usage réel. (Note : les scripts tournent en CI/local où devDeps sont installées.) `dotenv@17` major dispo, non requis.
- **Effort** : XS.

### WS17-07 · P2 · `sharp` présent en transitif (CLAUDE.md à nuancer) · **confirmé**
- **Preuve** : CLAUDE.md affirme « sharp … absent du package.json ». **Vrai pour package.json**, mais `sharp@0.34.5` **est présent dans le lockfile** comme `optionalDependency` de `next@15.5.18` (`next` déclare `"sharp": "^0.34.3"` en optional, pour l'optimisation d'images). `scripts/build-favicons.cjs` (`require('sharp')`) se résout donc via cette copie transitive. Pas de sharp global requis.
- **Impact** : aucun risque, mais fragile : si Next retirait sharp de ses optionalDependencies (ou en cas d'`--no-optional`), `favicons:build` casserait sans dépendance déclarée. `npm audit` ne signale **aucune** CVE sur sharp 0.34.5.
- **Reco** : pour robustesse, ajouter `sharp` en `devDependencies` explicite (il n'est utilisé qu'au build favicons, pas au runtime app). Sinon documenter la dépendance implicite à l'optional de Next.
- **Effort** : XS.

### WS17-08 · P2 · pas de `engines.node` ni `.nvmrc` · **confirmé**
- **Preuve** : `package.json` n'a **pas** de champ `engines`. Pas de `.nvmrc` ni `.npmrc`. Next 15.5 exige Node ≥ 18.18 / ≥ 20 ; React 19 idem.
- **Impact** : déploiement Vercel/local peut tomber sur une version Node non testée. Pas de garde-fou.
- **Reco** : ajouter `"engines": { "node": ">=20" }` (aligné `@types/node@20`) + un `.nvmrc` (`20`). Documenter la version Node utilisée en prod.
- **Effort** : XS.

---

## Redondances (icônes / sharp / dotenv)

| Sujet | Constat | Verdict |
|---|---|---|
| **3 libs d'icônes** | `lucide-react` = principale (**73 fichiers**). `@heroicons/react` = **5 fichiers** (dont picker tags ~27 icônes, couplage fort). `react-icons` = **5 fichiers, 1 seul glyphe** (`SiWhatsapp`). | `react-icons` → **retirable facilement** (WS17-04). `@heroicons` → consolidation **post-V1** (WS17-05). Garder lucide comme canon. |
| **sharp** | **Présent** en transitif optional de Next (0.34.5), pas dans package.json. `build-favicons.cjs` s'y appuie implicitement. | Fonctionne, mais **dépendance implicite fragile** → déclarer en devDep (WS17-07). |
| **dotenv** | En `dependencies`, **0 usage runtime** (scripts CLI + tests uniquement). | **Déplacer en devDependencies** (WS17-06). |
| **dompurify / jsdom (transitif isomorphic-dompurify)** | `isomorphic-dompurify@3.14.0` → `dompurify@3.4.7` + `jsdom@29.1.1`. Importé **uniquement** dans `src/app/[locale]/blog/[slug]/page.tsx` (Server Component, **pas de `'use client'`**). | **OK — server-only confirmé.** jsdom ne fuit pas côté client. Aucune CVE sur dompurify 3.4.7 / jsdom 29.1.1 dans l'audit. Patch 3.15.0 dispo (non sécurité). |

---

## Licences

Toutes les dépendances directes (prod + dev) sont **permissives** :

| Licence | Paquets |
|---|---|
| MIT | next, next-intl, react, react-dom, @supabase/ssr, @supabase/supabase-js, zod, resend, sonner, swr, react-icons, @heroicons/react, isomorphic-dompurify, eslint, vitest, husky, tailwindcss, typescript, happy-dom, lint-staged, @testing-library/*, @types/*, @vitejs/plugin-react, eslint-config-next, @eslint/eslintrc, @tailwindcss/postcss |
| ISC | lucide-react |
| BSD-2-Clause | dotenv |
| Apache-2.0 | typescript, @playwright/test |
| BlueOak-1.0.0 | glob |

**Aucune licence copyleft (GPL/AGPL/LGPL)** parmi les dépendances directes. MIT/ISC/BSD/Apache-2.0/BlueOak sont toutes compatibles avec une exploitation commerciale propriétaire. **RAS côté licences.**

---

## Lockfile & hygiène

- `package-lock.json` : **présent, committé** (`git ls-files` ✓), **lockfileVersion 3**, 727 deps résolues (prod 104 / dev 561 / optional 161). Cohérent avec les versions installées (`npm outdated` n'a montré aucun mismatch `current` vs lockfile).
- **Pas de `engines.node`** → WS17-08.
- **Pas de `.npmrc` / `.nvmrc`**.
- **devDeps fuyant en prod** : seul `dotenv` est mal classé (prod alors que dev/scripts) → WS17-06. Inverse : aucune devDep réellement requise au runtime app.
- React 19.1.0 = **stable** (pas RC/canary). Next 15.5.18 = stable. Aucun paquet en preview/RC dans le runtime.

---

## Tableau récap

| ID | Sév. | Sujet | Portée | Confiance | Effort |
|---|---|---|---|---|---|
| WS17-01 | P1 | happy-dom 18 critique (RCE/cookie leak) — env test Vitest | dev | confirmé | S |
| WS17-02 | P2 | postcss 8.4.31 bundlé Next (XSS stringify, non déclenchable) | prod (build) | confirmé | XS |
| WS17-03 | P2 | minimatch/picomatch/brace-expansion ReDoS | dev | confirmé | XS |
| WS17-04 | P2 | react-icons = 1 seul glyphe → retirable | prod | confirmé | S |
| WS17-05 | P2 | @heroicons partiellement consolidable (picker tags) | prod | suspecté | M |
| WS17-06 | P2 | dotenv en dependencies alors que dev/scripts-only | prod→dev | confirmé | XS |
| WS17-07 | P2 | sharp transitif (optional de Next) non déclaré | dev/build | confirmé | XS |
| WS17-08 | P2 | pas de engines.node / .nvmrc | meta | confirmé | XS |

**0 P0. 1 P1 (dev-only). 6 P2.** Aucune CVE exploitable dans une dépendance servie en production. La V1 peut partir ; traiter WS17-01 (happy-dom) et WS17-04/06/08 (polish hygiène) sur le sprint post-launch.
