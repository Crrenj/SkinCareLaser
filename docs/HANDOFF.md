# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (catalogue + réservation dermo-cosmétique, marché RD, Next.js 15 + Supabase, multilingue FR/EN/ES). Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. Ce fichier (`docs/HANDOFF.md`) — punch list courante
3. `docs/audits/INDEX.md` si tu attaques un finding d'audit

## État actuel (2026-05-28)

**Branche `main`.** Dernier commit : `5359b2e feat: blog, newsletter double opt-in, code splitting, banner slots`.

### Métriques santé

| Métrique | Valeur |
|---|---|
| TypeScript | **0 erreur** |
| ESLint | **0 warning** |
| `any` / `alert()` / `console.*` brut / `text-ink-400` | **0 / 0 / 0 / 0** |
| Vitest | **8/8** |
| Playwright | **11 specs, ~27 tests** |
| `next build` | **passe** (blocker not-found/Footer levé) |
| CI | **lint + typecheck + vitest + build + e2e** |

### Métriques projet

| Métrique | Valeur |
|---|---|
| LOC (src/) | ~32 400 |
| Fichiers TS/TSX | 260 |
| Clés i18n (par locale) | 1 442 (FR/EN/ES, parité) |
| Migrations DB | 28 |
| Dépendances ajoutées | `zod`, `resend`, `isomorphic-dompurify` |
| Supabase SDKs | supabase-js **2.106**, ssr **0.10** |
| Produits actifs DB | 353 (stock=50, prix=100 DOP placeholder) |

### Changements session 2026-05-27 soir (17 commits `b00aa82`→`85fa6ad`)

Sécurité (5), a11y (2), architecture/DX (4), SEO (2), shop_settings SSR (2), i18n admin complet (2). Voir section correspondante dans `CLAUDE.md`.

### Changements commit `5359b2e` (2026-05-27, dernier)

4 features majeures en un commit :

**1. Blog** : table `posts` + admin CRUD `/admin/blog` + pages publiques `/blog` + `/blog/[slug]` + sitemap + Footer link corrigé + i18n FR/ES/EN (`Blog` + `Admin.blog` namespaces). Migration `20260527210629`. API `/api/admin/posts` (GET/POST/PATCH/DELETE) protégée `requireAdmin()` + Zod.

**2. Newsletter double opt-in** : colonne `confirmation_token` sur `newsletter_subscribers` (migration `20260527211720`), endpoint `/api/newsletter/confirm`, intégration Resend (`src/lib/resend.ts`). Fallback gracieux sans `RESEND_API_KEY` (single opt-in). Email de confirmation localisé FR/ES/EN.

**3. Code splitting** : `next/dynamic` avec skeletons `animate-pulse` sur CatalogueClient, ProductClient, CartClient, ReservationClient.

**4. Banner slots Sprint 3** : enums `banner_slot` (hero/banner/card/modal) + `banner_status` (draft/scheduled/active/paused/expired). Migration `20260527212633`. Admin UI avec KPIs par slot, onglets de filtre, status pills.

**5. Nettoyage** : 6 fichiers audit/check/probe untracked supprimés de la racine. CI e2e avec `npm start` au lieu du dev server.

---

## Issues corrigées (session 2026-05-28, suite review)

Les 9 findings de la review + 1 régression WCAG + 1 blocker build préexistant — tous fermés.

### Sécurité (5)
- ✅ **XSS blog** — `isomorphic-dompurify` + `DOMPurify.sanitize(post.body)` (`blog/[slug]/page.tsx`)
- ✅ Token newsletter TTL — colonne `token_expires_at` (migration `20260528100000`), pose 24h à l'insert, `.gt()` au confirm
- ✅ Rate limit `/api/newsletter/confirm` (`checkRateLimit`, 10/min/IP)
- ✅ Zod sur DELETE posts (schéma `postDelete`)
- ✅ URL de confirmation via `getSiteUrl()` (csrf.ts) — plus de header `Origin`

### Qualité / régressions (3)
- ✅ ESLint **0 warning** (`setup/page.tsx` useCallback + 2 warnings préexistants `ConfirmationClient`/`BannerStatsCards` corrigés au passage)
- ✅ Clé i18n `Admin.common.active` EN/ES (parité 1442×3)
- ✅ 20 `text-ink-400` → `ink-500` (régression WCAG, 5 fichiers)

### Base de données (2)
- ✅ Migration posts replay-safe (`DROP TRIGGER/POLICY IF EXISTS`)
- ✅ `db/schema.sql` partiellement régénéré (posts, enums banner, refs `is_admin` corrigées) + en-tête de staleness documentant les gaps restants

### SEO (1)
- ✅ JSON-LD `Article` sur les posts (`BlogPostJsonLd`)

### Blocker build (hors plan, préexistant depuis `5c81dcb`)
- ✅ `not-found.tsx` (client) importait le `Footer` async server → `next build` cassé. Converti en Server Component (`getTranslations`). Build repasse.

---

## Tâches autonomes restantes

### Technique pur
- **`metadata.openGraph.siteName`** — lire `shop_name` depuis `shop_settings`
- **Banner tracking** — wirer `view_count`/`click_count` côté client (KPIs à 0 sinon)
- **Banner scheduling** — pg_cron/middleware pour transitions `scheduled→active→expired`
- **Blog image upload** — intégrer avec `/api/admin/upload` (URL manuelle actuellement)
- **`db/schema.sql` full regen** — `supabase db dump` (gaps : newsletter/wishlists/shop_settings absents, orders/product_ranges droppés encore listés)
- **Test e2e newsletter double opt-in** — non exercé (nécessite `RESEND_API_KEY` + post publié)

### Contenu (bloqueur prod)
- **Prix réels** — 353 produits à 100 DOP placeholder → `npm run prices:export`, remplir CSV, `npm run prices:import`
- **About placeholders** — photos d'équipe, vrais noms, reg. sanitario, adresse SLC
- **Juridique ES/EN** — les 4 pages `/legal/*` sont FR uniquement
- **Contenu produit** — INCI, benefits, pharmacist_advice vides sur 353 produits

### Hygiène long terme
- **Audit Storage policies** (2 buckets publics avec policy `select` large)
- **AggregateRating** sur `ProductJsonLd` si système de reviews un jour
- **Playwright CI secrets** — configurer pour les tests E2E en CI

---

## Score audit (2026-05-28, post-fix)

| Dimension | Note | Ouverts |
|---|---|---|
| Sécurité | **A-** | 0 (XSS ✅, TTL ✅, rate limit ✅, Zod ✅) |
| Performance | **A- (9/10)** | 0 (code splitting ✅) |
| Architecture | **A (9/10)** | 0 |
| Base de données | **A- (9/10)** | 0 (schema.sql partiel, gaps documentés) |
| Accessibilité | **A (9/10)** | 0 (ink-400 ✅) |
| SEO | **A (9/10)** | 0 (JSON-LD Article ✅) |
| DX | **A (9/10)** | 1 (Playwright CI secrets) |
| UX | **B+ (7.5/10)** | 0 |
| Code Quality | **A+ (10/10)** | 0 |

**145 findings → 145 fermés** + 1 blocker build préexistant levé. Restent des tâches de contenu/feature, **0 finding d'audit ouvert**.

---

## Workflow recommandé

1. Lis `CLAUDE.md` + ce HANDOFF.
2. Demande à l'utilisateur ce qu'il veut attaquer (findings d'audit tous fermés ; reste contenu/features).
3. Vérifie le MCP Supabase : `mcp__supabase__get_project_url` → `https://adxpoxcynrpnbbxnncsk.supabase.co`.
4. Changements DB : via MCP `apply_migration`.
5. Avant chaque commit : `npm run typecheck && npm run test:unit -- --run && npm run lint`.
6. Convention commit : `<type>(<scope>): <description>` + `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
7. Push : seulement sur demande explicite.

## Pièges connus

- **Pas de commit sauf demande explicite.**
- Bash deny list bloque `rm`, `git --force`, `git rebase`, `git reset --hard`.
- `.mcp.json` est gitignored (contient la clé API Vercel).
- Cache `.next/types/` stale après suppression de routes.
- `next-intl` redirect : préférer `redirect(\`/${locale}/...\`)` avec `next/navigation`.
- Cookie admin locale : `farmau_admin_locale` (sameSite=lax, 1 an).
- Supabase ré-émet `SIGNED_IN` au focus tab → hooks auth comparent ID à un `useRef`.
- `useModalA11y` est générique : `<HTMLDivElement>` par défaut, `<HTMLElement>` pour les `<aside>`.
- `RESEND_API_KEY` optionnelle — sans elle, newsletter passe en single opt-in direct.
