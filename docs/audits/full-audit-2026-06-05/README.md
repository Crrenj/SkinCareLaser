# Audit complet FARMAU — 2026-06-05

Audit ligne-par-ligne multi-agent (Opus 4.8 max effort). 38 workstreams.
Contrat partagé : [`_BRIEF.md`](./_BRIEF.md). Consolidation : `00-VERDICT.md` + `00-REGISTRE-CONSOLIDE.md`.

## Workstreams

### Frontend public (structurel)
- **WS01** Home — `[locale]/page.tsx`, `[locale]/layout.tsx`, `components/home/*`, `lib/homeSections.ts`
- **WS02** Catalogue + filtres — `[locale]/catalogue/page.tsx`, `CatalogueClient.tsx`, `components/catalogue/*`, `lib/catalogueFilters.ts`
- **WS03** Fiche produit (PDP) — `[locale]/product/[slug]/page.tsx`, `ProductClient.tsx`, `ProductDetailCard.tsx`, `components/pdp/*`, `ProductCard.tsx`, `ProductCardHeart.tsx`
- **WS04** Panier UI — `[locale]/cart/page.tsx`, `CartClient.tsx`, `CartDrawer.tsx`, `CartIcon.tsx`, `AddToCartButton.tsx`, `components/cart/*`, `types/cart.ts`
- **WS05** Réservation + confirmation — `[locale]/(checkout)/**`, `components/reservation/*`, `components/confirmation/*`, `lib/reservation.ts`, `lib/shipping.ts`
- **WS06** About + éditorial — `[locale]/{a-propos,manifeste,faq,pharmacie,livraison}/page.tsx`, `components/about/*`
- **WS07** Contact + aide + legal — `[locale]/{contact,aide}/page.tsx`, `[locale]/legal/**`, `components/legal/*`, `ContactForm.tsx`, `HelpForm.tsx`, `CookieBanner.tsx`
- **WS08** Auth pages — `[locale]/(auth)/**`, `components/auth/*`, `ProfileEditForm.tsx`, `AuthProvider.tsx`
- **WS09** Compte — `[locale]/account/**`, `components/account/*`
- **WS10** Blog/Marques/Besoins/Favoris — `[locale]/blog/**`, `[locale]/marques/**`, `[locale]/besoins/**`, `[locale]/favoris/page.tsx`, `components/blog/*`
- **WS11** Nav/chrome — `NavBar.tsx`, `MobileDrawer.tsx`, `components/nav/*`, `Footer.tsx`, `components/footer/*`, `Breadcrumb.tsx`, `LocaleSwitcher.tsx`, `ThemeFavicon.tsx`, `ThemeModeToggle.tsx`, `IframeHeightReporter.tsx`, `SWRProvider.tsx`
- **WS12** Bannières + primitives UI — `components/banners/*`, `Banner.tsx`, `components/ui/*`, `components/brand/*`, `[locale]/not-found.tsx`, `[locale]/error.tsx`, `app/not-found.tsx`, `app/layout.tsx`

### Admin (structurel)
- **WS13** Shell + dashboard — `admin/layout.tsx`, `admin/_AdminShell.tsx`, `admin/page.tsx`, `admin/error.tsx`, `admin/_dashboard/data.ts`, `components/admin/dashboard/*`
- **WS14** Admin produit + marques — `admin/product/**`, `admin/marques/**`
- **WS15** Admin stock + tags + annonce — `admin/stock/**`, `admin/tags/**`, `admin/annonce/**`, `components/admin/HomeLayoutPanel.tsx`
- **WS16** Admin réservations — `admin/reservations/page.tsx`, `components/admin/reservations/*`
- **WS17** Admin messages/tickets + settings + setup — `admin/messages/**`, `admin/settings/page.tsx`, `admin/setup/page.tsx`
- **WS18** Admin users + admins + newsletter — `admin/users/page.tsx`, `admin/admins/page.tsx`, `admin/newsletter/page.tsx`, `components/admin/users/*`, `components/admin/admins/*`, `components/admin/newsletter/*`
- **WS19** Admin blog + apparence + éditeurs — `admin/blog/page.tsx`, `admin/apariencia/page.tsx`, `components/admin/blog/*`, `components/admin/RichTextEditor.tsx`, `components/admin/ImageUploadField.tsx`, `components/admin/ConfirmDialog.tsx`

### API (structurel)
- **WS20** API admin catalogue — `api/admin/{products,products/[id],products/with-tags,brands,brands/[id],ranges,ranges/[id],tags,tags/[id],tag-types,tag-types/[id],upload,banners,banners/stats,home-layout}/route.ts`
- **WS21** API admin ops — `api/admin/{reservations,messages,stock,sidebar-stats,newsletter,newsletter/[id],posts,users,users/[id],admins,appearance,settings,set-locale}/route.ts`
- **WS22** API public — `api/{cart,cart/reserve,cart/merge,contact,search,newsletter,newsletter/confirm,wishlist,theme,account/preferences}/route.ts`, `lib/apiError.ts`

### Sécurité (transverse)
- **WS23** Authz & contrôle d'accès — `middleware.ts`, `lib/requireAdmin.ts`, `lib/safeRedirect.ts`, `app/auth/callback/page.tsx`, logique redirect login/signup, hiérarchie de rôles
- **WS24** RLS + sécurité DB — toutes les policies/SECURITY DEFINER/GRANT des migrations + MCP read-only + migration non-commitée cart RLS + `rls-idor-audit-2026-06-05.md`
- **WS25** Validation entrée / injection / XSS — `lib/schemas.ts`, `lib/uploadImage.ts`, `dangerouslySetInnerHTML`, DOMPurify, validation upload, surface SQL
- **WS26** Rate-limit / CSRF / CSP-headers / secrets — `lib/rateLimit.ts`, `lib/csrf.ts`, `lib/env.ts`, `next.config.ts` (headers/CSP), gestion secrets

### Données / infra (transverse)
- **WS27** Intégrité schéma DB — migrations (ordre/idempotence/correction), `db/schema.sql` drift, staleness `database.types.ts`
- **WS28** Clients Supabase + lib cœur — `lib/supabase{Client,Server,Admin}.ts`, `getShopSettings`, `getThemeConfig`, `constants`, `formatPrice`, `slug`, `logger`, `resend`, `seo`, `whatsapp`
- **WS29** Hooks + state client — `hooks/*`
- **WS30** i18n parité + chasse aux strings en dur — `messages/{fr,es,en}.json`, `i18n/*`
- **WS31** SEO — `sitemap.ts`, `robots.ts`, `lib/seo.ts`, `generateMetadata`, JSON-LD, hreflang
- **WS32** Accessibilité (transverse)
- **WS33** Thème/CSS — `globals.css`, `lib/themes.ts`, `lib/themeModeScript.ts`, contraste, dark mode
- **WS34** Logique métier (transverse) — réservation/panier/stock/prix/whatsapp bout-en-bout
- **WS35** Performance (transverse) — frontières SSG/ISR/dynamic, efficacité requêtes, images, cache

### Outillage / ops
- **WS36** Scripts — `scripts/*`
- **WS37** Tests — `tests/*`, `src/__tests__/*`, `playwright.config.ts`, `vitest.config.ts`
- **WS38** Config & hygiène repo + docs — `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `.claude/*`, `.github/*`, `.husky`, `.gitignore`, `.env.local.example`, `venv/` tracking, `README.md`, cohérence `CLAUDE.md`/`docs/`
