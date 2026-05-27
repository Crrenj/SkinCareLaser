# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (catalogue + réservation dermo-cosmétique, marché RD, Next.js 15 + Supabase, multilingue FR/EN/ES). Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. Ce fichier (`docs/HANDOFF.md`) — punch list courante
3. `docs/audits/INDEX.md` si tu attaques un finding d'audit

## État actuel (2026-05-27, soir)

**Branche `main`.** Dernier commit : `85fa6ad feat(i18n): localize 5 remaining admin pages (FR/ES/EN)`.

### Métriques santé

| Métrique | Valeur |
|---|---|
| TypeScript | **0 erreur** |
| ESLint | **0 warning** |
| `any` / `alert()` / `text-ink-400` / `<img>` brut | **0 / 0 / 0 / 0** |
| `console.error` brut | **0** (tout passe par `logger`) |
| Vitest | **8/8** |
| Playwright | **11 specs, ~27 tests** |
| CI | **lint + typecheck + vitest + build** (+ Playwright quand secrets configurés) |

### Métriques projet

| Métrique | Valeur |
|---|---|
| LOC (src/) | ~31 400 |
| Fichiers TS/TSX | 253 |
| Clés i18n (par locale) | ~1 616 (+250 cette session, admin complet) |
| Migrations DB | 24 (+2 cette session) |
| Dépendances ajoutées | `zod` (validation API) |
| Supabase SDKs | supabase-js **2.106**, ssr **0.10** |
| Produits actifs DB | 353 (stock=50, prix=100 DOP placeholder) |

### Changements session 2026-05-27 matin (5 commits précédents)

- Pagination catalogue serveur, CI build + Playwright, SDKs Supabase, a11y focus trap + contraste, refactor admin (DeleteConfirmModal unifié).

### Changements session 2026-05-27 soir (17 commits, `b00aa82`→`85fa6ad`)

**Sécurité (5 commits)** :
- `fab9c64` Cookie `cart_id` → `httpOnly: true` + nouveau `/api/cart/merge` server-side (supprime lecture cookie client dans `useAuth`)
- `3c23835` CSRF origin check sur `/api/newsletter` POST + `/api/contact` POST via `src/lib/csrf.ts`
- `ab05f50` Validation Zod sur tous les body POST/PATCH/PUT des 20 routes admin (`src/lib/schemas.ts` + `parseBody()`)
- `5f4a379` CSP + Permissions-Policy headers dans `next.config.ts`
- `9cd632d` `(SELECT auth.uid())` dans 28 RLS policies + `ALTER FUNCTION is_user_admin STABLE` (migration `20260527100000`)

**Accessibilité (2 commits)** :
- `130af64` `aria-invalid` + `aria-describedby` sur login/signup, `aria-live="polite"` sur newsletter feedback
- `26aa8d2` Error boundaries `error.tsx` sur `[locale]` et `admin` routes + namespace `Error` FR/ES/EN

**Architecture / DX (3 commits)** :
- `f6814ab` `src/lib/logger.ts` + migration des 128 `console.error/warn` vers `logger.error/warn` (49 fichiers)
- `fafe139` Drop `orders` + `order_items` (0 ligne) + refonte `v_bestsellers` sans dépendance orders (migration `20260527110000`)
- `c994a0f` CI utilise `npm run typecheck` au lieu de `npx tsc --noEmit`

**SEO (2 commits)** :
- `9e15048` JSON-LD `CollectionPage` sur `/catalogue` et `/marques` + clés i18n
- `596309e` `og:image` dynamique sur `/marques/[slug]` et `/besoins/[slug]`

**shop_settings SSR (2 commits)** :
- `b947348` Confirmation réservation lit pickup depuis `getShopSettings()` (plus de constante `PICKUP_LOCATION` statique)
- `5c81dcb` Footer (async Server Component + `getTranslations`) et CartEmpty lisent WhatsApp depuis `shop_settings`

**i18n admin complet (2 commits, ~270 nouvelles clés)** :
- `3b59d91` 6 modaux d'édition localisés FR/ES/EN (ProductFormModal, BrandFormModal, RangeFormModal, TagModal, TagTypeModal, BannerFormModal) — namespace `Admin.modals.*`
- `85fa6ad` 5 pages admin restantes localisées FR/ES/EN (reservations, users, newsletter, settings, setup + sous-composants UsersClient, NewsletterClient) — namespaces `Admin.{reservations,users,newsletter,settings,setup}`

**Nettoyage (1 commit)** :
- `b00aa82` Suppression 3 modaux orphelins (ProductDeleteModal, TagDeleteModal, DeleteConfirmModal) — 224 LOC

---

## Tâches autonomes restantes

### Technique pur
- **Code splitting** — `next/dynamic` sur les composants client lourds (CatalogueClient, ReservationClient)
- **`metadata.openGraph.siteName`** — lire `shop_name` depuis `shop_settings`
- **`banner_type_enum`** strict — la colonne reste `text` pour compat legacy
- **`tags_with_types`** — envisager vue matérialisée si perf catalogue

### Contenu (bloqueur prod)
- **Prix réels** — 353 produits à 100 DOP placeholder → `npm run prices:export`, remplir CSV, `npm run prices:import`
- **About placeholders** — photos d'équipe, vrais noms, reg. sanitario, adresse SLC
- **Juridique ES/EN** — les 4 pages `/legal/*` sont FR uniquement
- **Blog** — table `posts` + admin CRUD + `/blog` + sitemap
- **Contenu produit** — INCI, benefits, pharmacist_advice vides sur 353 produits

### Hygiène long terme
- **Double opt-in newsletter** (provider d'envoi : Resend/Postmark)
- **Audit Storage policies** (2 buckets publics avec policy `select` large)
- **4 fichiers untracked** à la racine (`_audit-*.mjs`, `_check-*.mjs`) — nettoyer
- **AggregateRating** sur `ProductJsonLd` si système de reviews un jour

---

## Score audit (2026-05-27, post session soir)

| Dimension | Note | Ouverts |
|---|---|---|
| Sécurité | **A-** | 0 (CSRF ✅, Zod ✅, CSP ✅, httpOnly ✅, RLS perf ✅) |
| Performance | B+ (8/10) | 1 (code splitting) |
| Architecture | A (9/10) | 0 |
| Base de données | **A- (9/10)** | 1 (tags_with_types vue) |
| Accessibilité | **A (9/10)** | 0 (aria-invalid ✅, error boundaries ✅) |
| SEO | **A (9/10)** | 0 (JSON-LD ✅, og:image ✅) |
| DX | **A (9/10)** | 1 (Playwright CI secrets) |
| UX | B+ (7.5/10) | 0 |
| Code Quality | **A+ (10/10)** | 0 (logger ✅, Zod ✅, 0 console.error) |

**142 findings → 139 fermés, 3 ouverts** (code splitting, tags_with_types vue, Playwright CI secrets).

---

## Workflow recommandé

1. Lis `CLAUDE.md` + ce HANDOFF.
2. Demande à l'utilisateur ce qu'il veut attaquer.
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
