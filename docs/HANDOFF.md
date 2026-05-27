# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (catalogue + réservation dermo-cosmétique, marché RD, Next.js 15 + Supabase, multilingue FR/EN/ES). Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. Ce fichier (`docs/HANDOFF.md`) — punch list courante
3. `docs/audits/INDEX.md` si tu attaques un finding d'audit

## État actuel (2026-05-27)

**Branche `main`.** Dernier commit : `b00aa82 chore: remove 3 orphan delete modals replaced by ConfirmDialog`.

### Métriques santé

| Métrique | Valeur |
|---|---|
| TypeScript | **0 erreur** |
| ESLint | **0 warning** |
| `any` / `alert()` / `text-ink-400` / `<img>` brut | **0 / 0 / 0 / 0** |
| Vitest | **8/8** |
| Playwright | **11 specs, ~27 tests** |
| CI | **lint + tsc + vitest + build** (+ Playwright quand secrets configurés) |

### Métriques projet

| Métrique | Valeur |
|---|---|
| LOC (src/) | 31 055 |
| Fichiers TS/TSX | 247 |
| Clés i18n (par locale) | ~1 366 |
| Supabase SDKs | supabase-js **2.106**, ssr **0.10** |
| Produits actifs DB | 353 (stock=50, prix=100 DOP placeholder) |

### Changements session 2026-05-27 (5 commits)

- `e2314c2` **Pagination catalogue serveur** — filtrage/tri/comptage facetté côté serveur, 24 produits/page, filtres URL-driven (?brand=, ?need=, ?sort=, ?page=). CatalogueClient 513→230 LOC. Nouveau `lib/catalogueFilters.ts`.
- `e2314c2` **CI complété** — `npm run build` ajouté au job principal + job Playwright chromium séparé avec upload artifacts.
- `e2314c2` **Supabase SDKs** — supabase-js 2.50→2.106, ssr 0.6→0.10. 3 routes API corrigées pour les types plus stricts.
- `fb99317` **A11y** — focus trap CartDrawer+MobileDrawer via `useModalA11y<HTMLElement>`, ink-400→ink-500 (46 occ, 30 fichiers), 0 alert() (3→toast), script typecheck, gitignore nettoyé.
- `937dd6c` **Refactor admin** — DeleteConfirmModal unifié (3 copies→useConfirmDialog, 18 clés i18n), messages split (489→150 LOC), stock split (468→145 LOC).

---

## Ce qui peut être fait en autonomie (19 tâches)

### Technique pur

1. **`aria-invalid` sur login/signup/forgot-password** — ajouter `aria-invalid={!!error}` + `aria-describedby` sur les inputs en erreur (FooterNewsletter déjà fait)
2. **Cookie `cart_id` → `httpOnly: true`** — `src/app/api/cart/route.ts` (2 endroits)
3. **CSRF origin check** — `/api/newsletter` POST + `/api/contact` POST
4. **Validation Zod** sur les body POST/PATCH des routes `/api/admin/*`
5. **CSP headers** dans `next.config.ts`
6. **Error boundaries** `error.tsx` sur les routes principales
7. **Logger structuré** — créer `src/lib/logger.ts` + remplacer 126 `console.error`

### Base de données

8. **Migration** `(SELECT auth.uid())` dans les ~15 RLS policies
9. **Migration** `ALTER FUNCTION is_user_admin STABLE`
10. **Migration** `DROP TABLE orders, order_items` (0 ligne, jamais branchées)

### SEO

11. **JSON-LD `CollectionPage`** sur `/catalogue` et `/marques`
12. **`og:image` dynamique** sur `/marques/[slug]` et `/besoins/[slug]`

### Consommation `shop_settings`

13. **Tunnel réservation** — SSR la pickup info via `getShopSettings()` au lieu de la constante `PICKUP_LOCATION`
14. **Footer + CartEmpty** — lire WhatsApp depuis `shop_settings` au lieu de `NEXT_PUBLIC_WHATSAPP_NUMBER`

### i18n admin (gros morceau)

15. **6 modaux d'édition** — ProductFormModal, BrandFormModal, RangeFormModal, TagModal, TagTypeModal, BannerFormModal
16. **5 pages admin** — reservations, users, newsletter, settings, setup
17. **CI typecheck** — remplacer `npx tsc --noEmit` par `npm run typecheck` dans le workflow

---

## Ce qui nécessite ta décision

### Contenu (bloqueur prod)
- **Prix réels** — 353 produits à 100 DOP placeholder → `npm run prices:export`, remplir CSV, `npm run prices:import`
- **About placeholders** — photos d'équipe, vrais noms, reg. sanitario, adresse SLC
- **Juridique ES/EN** — les 4 pages `/legal/*` sont FR uniquement
- **Blog** — table `posts` + admin CRUD + `/blog` + sitemap
- **Contenu produit** — INCI, benefits, pharmacist_advice vides sur 353 produits

### Architecture
- **Supprimer `orders`/`order_items`** — confirmer que le modèle réservation est définitif

---

## Score audit (2026-05-27)

| Dimension | Note | Ouverts |
|---|---|---|
| Sécurité | B+ | 3 |
| Performance | B+ (8/10) | 1 |
| Architecture | A (9/10) | 1 |
| Base de données | B+ (8/10) | 4 |
| Accessibilité | A- (~82%) | 2 |
| SEO | A- (8/10) | 1 |
| DX | A- (8/10) | 2 |
| UX | B+ (7.5/10) | 0 |
| Code Quality | A (9/10) | 1 |

**142 findings → 127 fermés, 15 ouverts.**

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
