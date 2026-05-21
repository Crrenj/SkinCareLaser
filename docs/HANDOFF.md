# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (catalogue + réservation dermo-cosmétique, marché RD, Next.js 15 + Supabase, multilingue FR/EN/ES). Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. Ce fichier (`docs/HANDOFF.md`) — punch list courante
3. `docs/audits/INDEX.md` si tu attaques un finding d'audit

## État actuel (2026-05-22, post quick wins SEO/perf)

**Branche `main`, synchronisée avec `origin/main`.** Dernier commit : `8d8ec14 feat(pdp): JSON-LD Product schema + next/image (CartEmpty + ConfirmationRecap)`.

**Métriques** :
- 0 erreur TypeScript, 8/8 vitest, 4/4 smoke Playwright, lint 0 erreur (~38 warnings préexistants non bloquants)
- CI verte (lint + tsc + vitest sur PR et push main)
- Pre-commit hook actif (Husky + lint-staged → `eslint --fix --no-warn-ignored`)
- Vercel auto-deploy sur push main, domaine prod `https://farmau.do`
- Supabase project `adxpoxcynrpnbbxnncsk` : 13 brands, 52 ranges, 353 produits actifs à 100 DOP placeholder, **4 produits is_featured + 3 tags featured_on_home** (curation home active)

**6 sessions livrées entre `c37a915` et `8d8ec14`** :

### Session 1 (commit `279f462`) — `/marques` + filtres URL + 404
- Page `/marques` Server data-driven (count + image par marque) — s'adapte aux marques ajoutées en admin
- `CatalogueClient` lit `?brand`, `?range`, `?need`, `?tag=type:slug` au mount avec matching tolérant name OU slug
- `not-found.tsx` design FARMAU (NavBar + Footer + serif italic 160px + CTAs + quick-links) au niveau locale + fallback global
- Footer Productos câblé vers `/besoins/[slug]` quand mapping, sinon `/catalogue` (au lieu de `?category=` cassé)

### Session 2 (commit `da37dfe`) — Pages légales + cookies
- 4 pages `/legal/{mentions-legales,cgv,confidentialite,cookies}` avec contenu FR pré-rédigé (Ley 172-13 + 358-05 + 126-02 RD)
- Composants `LegalShell` + `LegalSidebar` + `LegalSection` partagés (`src/components/legal/`)
- Bandeau `CookieBanner` fixed bottom-right monté dans `[locale]/layout.tsx`, persistence `farmau:cookies:consent` localStorage
- Footer bottom-bar 4 liens légaux câblés vers vraies routes
- Traductions FR/EN/ES UI (`Legal.shell`, `Legal.sidebar`, `Legal.cookieBanner`, `Legal.pageMeta`) — contenu juridique FR uniquement avec disclaimer "à valider par juriste"

### Session 3 (commit `ac1f9c3`) — Hub `/account`
- Layout `/account` Server avec check session + sidebar 5 onglets (Profil / Réservations / Favoris / Sécurité / Préférences)
- `/account/reservations` SSR avec status badges colorés, preview 3 items, lien WhatsApp/détail
- `/account/security` : CTA email reset → `/reset-password`, session info (`last_sign_in_at`), danger zone mailto demande RGPD
- `/account/preferences` : toggle newsletter (GET/DELETE) + select langue préférée (PATCH)
- Migration `profiles.preferred_locale text CHECK ('fr'|'en'|'es')` nullable
- APIs `/api/newsletter` étendues (GET/DELETE auth, POST modifié pour body vide quand user connecté) + `/api/account/preferences` PATCH

### Session 4 (commit `46ea917`) — Pages éditoriales statiques
- `/livraison` (workflow click & collect 3 étapes + 3 cards info + bloc TTL 24h)
- `/faq` (5 sections : Réservation/Produits/Compte/Retrait/Confidentialité, 19 Q&A, `<details>` natifs)
- `/pharmacies` (1 pharmacie Cerros de Gurabo, hero + carte Google Maps + sidebar contact + cards Accès/Pour qui)
- `/manifeste` (hero gradient + 3 paragraphes drop cap + 4 piliers + citation dark mode ink-900)
- Traductions FR/EN/ES exhaustives (~150 nouvelles clés)
- Footer service/brand câblé vers ces routes (au lieu de `/contact`/`/a-propos`)

### Session 5 (commit `ebad106`) — Admin hygiène
- `/admin/users` : 3 stats cards + recherche email/nom/téléphone + table avec toggle Promover/Admin (insert/delete dans `admin_users` source RLS + sync `profiles.is_admin`) + garde-fou self-demote + pagination
- `/admin/newsletter` : 4 stats cards (total + par langue) + filtre lang/search + export CSV (`?format=csv`) + delete par ligne
- APIs `GET/PATCH /api/admin/users[/id]` + `GET/DELETE /api/admin/newsletter[/id]` toutes gardées par `requireAdmin()`
- Sidebar admin nouvelle section "Clientes" (Usuarios + Newsletter)
- `/admin/my-team` supprimé (était en démo)

### Session 6 (commit `8d8ec14`) — Quick wins SEO/perf
- **JSON-LD Product schema** sur `/product/[slug]` via composant `ProductJsonLd` (Server, injecté hors `<main>`). Schema complet : `name`, `description`, `image[]` URLs absolues, `brand`, `offers` (URL, priceCurrency, price.toFixed(2), `availability` calculé depuis `stock`, `itemCondition: NewCondition`, `seller: FARMAU`).
- `stock` ajouté au `PRODUCT_SELECT` + propagation au type `MappedProduct` (page + ProductClient avec `stock?: number | null`)
- 2 derniers `<img>` migrés vers `next/image` : `CartEmpty` (bestsellers fallback) + `ConfirmationRecap` (items recap). Les autres `<img>` du HANDOFF d'origine (`CartDrawer`, `ProductClient`) avaient déjà été refactorés en composants utilisant `next/image` lors du sprint 3.

### Curation home (DB seule)
- 4 produits `is_featured=true` : Avène Hyaluron Activ B3 Serum + Avène Hydrance Aqua Gel + Babe Aloe Vera + Babe Bicalm+ (4 besoins distincts)
- 3 tags besoins `featured_on_home=true` : hydratation, anti-age, protection-solaire (les 3 plus peuplés)
- Section HomeBestsellers + HomeByNeed désormais 100 % data-driven (plus de fallback statique)

---

## Findings restants — par priorité

### Quick wins SEO / perf (≤ 1h chacun)
1. **Migration `banner_type_enum`** strict : la colonne reste `text` pour compat legacy. Quand toutes les lignes auront été re-sauvegardées via l'admin, créer l'enum strict.
2. **AggregateRating** sur `ProductJsonLd` si on ajoute un système de reviews un jour (le composant est prêt à recevoir le champ).

### Accessibilité (note 38/100 avant refonte, à re-mesurer)
4. **`focus-visible` global** : remplacer ~50 occurrences `focus:outline-none` par `focus-visible:ring sand-700` propre
5. **Modales** : audit `role="dialog"` + focus trap (CartDrawer et MobileDrawer le font déjà, vérifier le reste)
6. **Contraste palette** : certains hover sand-50 / clay-200 passent juste WCAG AA

### Contenu éditorial (gros chantiers)
7. **Blog** : table `posts` (slug, title, excerpt, body MDX/HTML, cover, status, published_at, author_id) + admin CRUD + `/blog` liste + `/blog/[slug]` + sitemap + nav lien (Footer "blog" pointe encore vers `/a-propos`)
8. **Saisie INCI / benefits / pharmacist_advice** sur les 353 produits — colonnes prêtes, contenu à fournir. Workflow d'enrichissement (parse-pdfs amélioré OU saisie manuelle admin) à designer
9. **Traductions ES/EN du contenu juridique** `/legal/*` — actuellement FR uniquement avec disclaimer

### Hygiène long terme
10. **`<html lang={locale}>` dynamique** : actuellement statique `"fr"` dans root layout. Route group `(admin)` pour séparer admin/public.
11. **Stockage image dédupliqué** : `products.image_url` + table `product_images` cohabitent. Choisir un seul et migrer.
12. **Tests d'intégration Playwright** admin + `/account/*` (actuellement smoke seulement)
13. **Split pages admin > 500 LOC** : `tags` 753, `annonce` ~890, `marques` 708, `product` 703
14. **Fallback `localStorage` pour tokens Supabase** (security finding #4, XSS exfiltration triviale)
15. **Double opt-in newsletter** : provider d'envoi (Resend/Postmark) + email de confirmation
16. **Vraie `/admin/settings`** câblée à une table `shop_settings` (actuellement démo)
17. **Audit RPC `SECURITY DEFINER`** pour `SET search_path = public` manquants

### Décisions produit en suspens
- **Services esthétiques laser** : le repo s'appelle `skincarelaser` mais le projet vendu est FARMAU pharmacie. Si volet services laser pertinent → discussion produit avant code (catalogue prestations, booking créneaux, etc.)

## Workflow recommandé

1. **Lis `CLAUDE.md` + ce HANDOFF + l'audit relevant** d'abord.
2. **Demande à l'utilisateur ce qu'il veut attaquer** — ne pas démarrer en autonome sauf demande explicite.
3. **Vérifie le MCP Supabase** : `mcp__supabase__get_project_url` doit renvoyer `https://adxpoxcynrpnbbxnncsk.supabase.co`.
4. **Changements DB** : via MCP `apply_migration`, miroir dans `supabase/migrations/`, regen types via `mcp__supabase__generate_typescript_types` puis `Edit` sur `src/lib/database.types.ts`.
5. **Avant chaque commit** : `npx tsc --noEmit && npm run test:unit -- --run && npm run lint`.
6. **Convention commit** : `<type>(<scope>): <description FR>` + corps + `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`. Passer le message via fichier (`git commit -F /tmp/...`) pour éviter les soucis d'échappement d'apostrophes.
7. **Push** : seulement sur demande explicite. Vercel auto-deploy sur push main.

## Pièges connus (résumé — voir CLAUDE.md pour détails)

- Cursor rule `alwaysApply` : **NE JAMAIS commit sans demande explicite**.
- Bash deny list bloque `rm`, `git --force`, `git rebase`, `git reset --hard` → utiliser `git rm` + `git reset --soft`.
- Cache `.next/types/` stale après suppression de routes : `mv .next /tmp/.next-stale-...` puis re-tsc. Vu sur la suppression de `/admin/my-team` à la session 5.
- `next-intl` redirect : préférer `redirect(\`/${locale}/...\`)` avec `next/navigation` plutôt que la version next-intl.
- Login + Signup utilisent `next/navigation` useRouter (pas next-intl) pour gérer les redirects `/admin/*` (non localisé).
- L'utilisateur push régulièrement en parallèle. Toujours `git status` avant de commit.
- `Link` next-intl exigé pour les `<a>` internes vers `/legal/*`, `/contact`, etc. (ESLint `@next/next/no-html-link-for-pages` errors sinon).
- `mailto:` et `tel:` restent des `<a>` normaux.

## Premier prompt suggéré au prochain Claude

> Lis CLAUDE.md, docs/HANDOFF.md, vérifie l'état git + le MCP Supabase. Confirme ce qui est OK et propose-moi le prochain chantier parmi les findings restants (quick wins SEO/perf, a11y focus-visible, blog complet, ou autre).
