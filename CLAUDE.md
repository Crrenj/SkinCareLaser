# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

- `npm run dev` — start Next.js (Turbopack) on http://localhost:3000
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — Next.js ESLint
- `npm run test:unit` — Vitest (happy-dom). Watch mode: `npm run test:unit:watch`. Single file: `npx vitest run src/__tests__/auth.test.tsx`
- `npm run test` — Playwright E2E (auto-starts `npm run dev`; specs in `tests/`). Single spec: `npx playwright test tests/cart.spec.ts --project=chromium`
- `npm run check-products` / `npm run test:cart` / `npm run setup-cart` — one-off Node scripts in `scripts/`

## Required environment

`.env.local` must define:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` **or** `SUPABASE_SERVICE_ROLE_KEY` — admin API routes accept either; they refuse to start without one (see `src/app/api/admin/products/route.ts:7`).

## Architecture

Next.js 15 App Router + React 19 + Supabase (Auth, Postgres with RLS, Storage). All UI text is in French.

### Three Supabase clients — pick the right one

1. **`src/lib/supabaseClient.ts`** — browser client (`createBrowserClient` from `@supabase/ssr`). Wraps cookie get/set with `typeof window` guards and a `localStorage` fallback for private-browsing mode. Use in client components only.
2. **`src/lib/supabaseServer.ts`** — `createSupabaseServerClient()` async helper using `next/headers` cookies. Use in Server Components and route handlers that act on behalf of the user.
3. **Service-role client** — instantiated inline in `src/app/api/admin/*/route.ts` with `SUPABASE_SERVICE_KEY`/`SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for admin operations.

Both `supabaseClient.ts` and `src/middleware.ts` carry “DO NOT MODIFY WITHOUT AUTHORIZATION” banners — they encode hard-won fixes for SSR `document is not defined`, private-browsing cookie loss, and Supabase cookie sync. Touch them only when the change is the actual task, and re-test login in both normal and private windows + middleware redirects after.

### Auth & admin gating (two layers, both required)

- **`src/middleware.ts`** runs on `/admin/:path*`. It uses `createServerClient`, reads the session, then queries `profiles.is_admin`. No session → `/login`; not admin → `/login?error=unauthorized`. The matcher explicitly skips `/api`, `/_next`, and asset paths.
- **`src/app/admin/layout.tsx`** repeats the check client-side via `supabase.auth.getSession()` + `profiles.is_admin` (also accepts `app_metadata.role === 'admin'`). This double-check is intentional — the middleware protects the request, the layout protects the rendered UI before children mount.

The `admin_users` table exists specifically to avoid recursive RLS policies on `profiles` — see header comments in `db/schema_complet.sql`. When writing RLS, prefer checking `admin_users` over `profiles.is_admin` inside policy expressions.

### Route map

- `src/app/(auth)/login`, `(auth)/signup` — auth group (no layout chrome)
- `src/app/admin/*` — gated dashboard: `overview`, `product`, `marques`, `stock`, `tags`, `commande`, `messages`, `annonce`, `my-team`, `statistics`, `settings`, `setup`
- `src/app/api/admin/*` — service-role-backed CRUD: `products` (+ `[id]`, `with-tags`), `brands`, `ranges`, `tags`, `tag-types`, `stock`, `banners`, `messages`, `upload`
- `src/app/api/cart/route.ts`, `src/app/api/contact/route.ts` — public APIs
- Public pages: `catalogue`, `product/[…]`, `cart`, `a-propos`, `contact`, plus debug pages (`debug`, `test-auth`, `test-redirect`, `login-private`, `login-simple`) used for live troubleshooting — do not delete without checking.

### Data model

Schema lives in `db/schema_complet.sql` (single source of truth — run it in Supabase SQL editor); `db/populate_catalog.sql` seeds the catalog. Key relations:

- `products` ←→ `ranges` ←→ `brands` via `product_ranges` (many-to-many; products usually have one range, exposed as `product.brand`/`product.range` after flattening in API responses).
- `product_images` stores ordered URLs; admin product GET falls back to `image_url` when `product_images` is empty.
- Tags use a `tag_types` → `tags` → `product_tags` structure (see `GUIDE_MIGRATION_TAGS.md`).
- Cart uses `carts` + `cart_items`; guest carts are supported.

### Client state

- **`src/contexts/CartContext.tsx`** — in-memory cart state with `addToCart` / popup logic. Wrapped by `SWRProvider` and `AuthProvider` in `src/app/layout.tsx`.
- **`src/hooks/useAuth.ts`**, **`src/hooks/useCart.ts`** — shared hooks.
- SWR (`swr` package) is used for client-side data fetching; the global provider is in `src/components/SWRProvider.tsx`.

## Conventions

- All user-facing strings, error messages, and admin labels are in **French**. Keep new strings in French unless explicitly told otherwise.
- The repo has many troubleshooting markdown files at the root (`SOLUTION_*.md`, `GUIDE_*.md`, `DOCUMENTATION_*.md`) — they document past incidents (login in private mode, RLS recursion, storage policies, etc.). Skim the relevant one before re-solving a “tricky” problem in auth, RLS, or storage.
- `db/` contains many `fix_*.sql` / `final_fix_*.sql` files representing iterative migrations. Treat `schema_complet.sql` as canonical; the `fix_*` files are historical patches that should already be subsumed.
- TypeScript path alias `@/*` → `src/*` (configured in `tsconfig.json` and `vitest.config.ts`).
- ESLint rules in `eslint.config.mjs` downgrade `no-explicit-any`, `no-unused-vars`, `no-unescaped-entities`, `react-hooks/exhaustive-deps` to warnings — `npm run lint` rarely fails, but warnings still matter.

## Do not commit unless asked

The `.cursor/rules/rules.mdc` rule (alwaysApply) instructs: never create git commits unless the user explicitly requests one. Respect this.
