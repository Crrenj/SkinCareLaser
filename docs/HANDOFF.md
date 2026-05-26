# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (catalogue + réservation dermo-cosmétique, marché RD, Next.js 15 + Supabase, multilingue FR/EN/ES). Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. Ce fichier (`docs/HANDOFF.md`) — punch list courante
3. `docs/audits/INDEX.md` si tu attaques un finding d'audit

## État actuel (2026-05-26)

**Branche `main` synchronisée avec `origin/main`.** Dernier commit : `772b83b feat(ui): modernise all 13 popups & drawers with unified design system`.

### Métriques santé

| Métrique | Valeur |
|---|---|
| TypeScript | **0 erreur** |
| ESLint | **0 warning** |
| Usages `any` | **0** |
| `<img>` brut | **0** |
| `focus:outline-none` | **0** |
| Vitest | **8/8** |
| Playwright | **11 specs, ~27 tests** |
| CI | **verte** (lint + tsc + vitest) |

### Métriques projet

| Métrique | Valeur |
|---|---|
| LOC (src/) | 31 315 |
| Fichiers TS/TSX | 241 |
| Pages publiques | 28 |
| Pages admin | 12 |
| Routes API | 24 (admin) + 8 (public) |
| Migrations DB | 22 |
| Clés i18n (par locale) | ~1 360 |
| Produits actifs DB | 353 (stock=50, prix=100 DOP placeholder) |
| Marques | 13, Gammes | 52, Tags | 36 |

### Infrastructure

- Vercel auto-deploy sur push main, domaine prod `https://farmau.do`
- Supabase project `adxpoxcynrpnbbxnncsk`
- MCP Supabase configuré dans `.mcp.json`
- Pre-commit Husky + lint-staged actif
- i18n admin opérationnel via cookie `farmau_admin_locale` (FR/ES/EN)

---

## Findings restants — par priorité

### P1 — Performance (impact utilisateur direct)

**CatalogueClient SSR massif (500+ produits)**
- 353 produits envoyés en un bloc, filtrage 100% client-side
- HTML initial massif, pas de pagination serveur
- **Fix** : paginer côté serveur (24/page) ou infinite scroll avec limit/offset
- Fichiers : `src/components/CatalogueClient.tsx` (513 LOC), `src/app/[locale]/catalogue/page.tsx`

### P2 — CI & DX

**Playwright pas dans CI**
- 11 specs ne tournent qu'en local
- **Fix** : job GitHub Actions avec `--project=chromium` pour la rapidité
- Fichier : `.github/workflows/ci.yml`

**Step `build` manquant dans CI**
- Un build cassé peut passer les checks
- **Fix** : ajouter `npm run build` au workflow

**Supabase SDKs en retard**
- `@supabase/supabase-js` 2.50 → 2.106+ (44 minor versions)
- `@supabase/ssr` 0.6 → 0.10+
- **Fix** : `npm update @supabase/supabase-js @supabase/ssr` (pas de breaking entre minors)

### P3 — Accessibilité

**Focus trap manquant sur drawers**
- `CartDrawer` et `MobileDrawer` n'utilisent pas `useModalA11y`
- L'utilisateur clavier peut Tab en dehors du drawer
- **Fix** : ajouter `useModalA11y(isOpen, onClose)` sur ces 2 composants
- Fichiers : `src/components/cart/CartDrawer.tsx`, `src/components/MobileDrawer.tsx`

**`aria-invalid` + `aria-describedby` manquants**
- Les inputs en erreur ne signalent pas leur état aux lecteurs d'écran
- Concerne : login, signup, reset-password, contact
- **Fix** : `aria-invalid={!!error}` + `aria-describedby="field-error"` + `id="field-error"` sur le message

**Contraste `ink-400` fail WCAG AA**
- `ink-400` (#A8A293) sur `sand-50` = 3.8:1 (minimum AA = 4.5:1)
- **Fix** : remplacer `text-ink-400` par `text-ink-500` (#807969, 5.5:1) sur fonds clairs

### P4 — Sécurité (améliorations, pas de bloqueurs)

**Validation Zod sur les body API admin**
- Les routes admin acceptent `...body` en spread sans liste blanche
- **Fix** : schema Zod par route (product, brand, tag, etc.)

**CSRF sur POST publics**
- Newsletter et contact n'ont pas de vérification d'origin
- **Fix** : `if (req.headers.get('origin') !== process.env.NEXT_PUBLIC_APP_URL) return 403`

### P5 — Localisation admin (gros morceau)

**Modaux d'édition non localisés**
- `ProductFormModal`, `BrandFormModal`, `RangeFormModal`, `TagModal`, `TagTypeModal`, `BannerFormModal` — labels en espagnol/français
- **Fix** : ajouter les clés dans `Admin.*` namespace + `useTranslations('Admin')`

**Pages admin non touchées par i18n**
- `/admin/reservations` (498 LOC), `/admin/users`, `/admin/newsletter`, `/admin/settings` (395 LOC), `/admin/setup` (210 LOC)
- **Fix** : ajouter à `Admin.{reservations,users,newsletter,settings,setup}` quand on s'y attaque

### P6 — Contenu éditorial

**About : données placeholder**
- Photos d'équipe : silhouettes SVG (`AboutTeam.tsx`)
- Noms : `Dra. María Pérez`, `Andrés Reyes`, `Yarisa Tavárez` = placeholders
- Stats : "60+ marques · 353 références · 7 farmacéuticos · 12 ans" — à vérifier
- "Reg. Sanitario DGM-42-2014" — placeholder, mettre le vrai numéro
- Adresse Skin Laser Center : "Même bâtiment · entrée Calle 3" — à préciser

**Blog**
- Table `posts` + admin CRUD + `/blog` + `/blog/[slug]` + sitemap
- Footer "blog" pointe encore vers `/a-propos`

**Contenu produit**
- 353 produits ont INCI, benefits, pharmacist_advice vides (colonnes prêtes)
- Traductions ES/EN du contenu juridique `/legal/*` manquantes

### P7 — Hygiène long terme

- Double opt-in newsletter (provider Resend/Postmark)
- `auth.uid()` → `(SELECT auth.uid())` dans les RLS policies (perf)
- `is_user_admin` → marquer `STABLE`
- Logger structuré (126 `console.error` → helper)
- Supprimer `orders`/`order_items` legacy si le modèle réservation est confirmé
- 4 fichiers untracked à la racine (`_audit-*.mjs`, `_check-*.mjs`)
- `shop_settings` consommation à finir (tunnel réservation, Footer, metadata)

---

## Score audit par dimension (2026-05-26)

| Dimension | Note | Findings ouverts |
|---|---|---|
| Sécurité | B+ | 3 |
| Performance | B (7/10) | 3 |
| Architecture | A- (8/10) | 2 |
| Base de données | B+ (8/10) | 4 |
| Accessibilité | B+ (~78%) | 4 |
| SEO | A- (8/10) | 1 |
| Developer Experience | B+ (7.5/10) | 3 |
| UX / Product | B (7/10) | 2 |
| Qualité de code | A- (8.5/10) | 3 |

**142 findings initiaux → 117 fermés, 25 ouverts.**

---

## Workflow recommandé

1. **Lis `CLAUDE.md` + ce HANDOFF + l'audit relevant** d'abord.
2. **Demande à l'utilisateur ce qu'il veut attaquer.**
3. **Vérifie le MCP Supabase** : `mcp__supabase__get_project_url` → `https://adxpoxcynrpnbbxnncsk.supabase.co`.
4. **Changements DB** : via MCP `apply_migration`, miroir dans `supabase/migrations/`, regen types si besoin.
5. **Avant chaque commit** : `npx tsc --noEmit && npm run test:unit -- --run && npm run lint`.
6. **Convention commit** : `<type>(<scope>): <description>` + `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
7. **Push** : seulement sur demande explicite.

## Pièges connus (résumé — voir CLAUDE.md pour détails)

- **Pas de commit sauf demande explicite.**
- Bash deny list bloque `rm`, `git --force`, `git rebase`, `git reset --hard`.
- Cache `.next/types/` stale après suppression de routes : `mv .next /tmp/.next-stale-...`.
- `next-intl` redirect : préférer `redirect(\`/${locale}/...\`)` avec `next/navigation`.
- Login + Signup utilisent `next/navigation` useRouter (pas next-intl) pour `/admin/*`.
- `Filters.tsx` est mort (supprimé). Sidebar catalogue = `CatalogueSidebar.tsx`.
- `PICKUP_LOCATIONS` n'existe plus → `PICKUP_LOCATION` (singleton).
- Route `/pharmacies` n'existe plus → `/pharmacie` (singulier).
- Cookie admin locale : `farmau_admin_locale` (sameSite=lax, 1 an).
- Supabase ré-émet `SIGNED_IN` au focus tab → les hooks auth comparent l'ID à un `useRef`.
