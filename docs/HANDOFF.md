# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (catalogue + réservation dermo-cosmétique, marché RD, Next.js 15 + Supabase, multilingue FR/EN/ES). Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. Ce fichier (`docs/HANDOFF.md`) — punch list courante
3. `docs/audits/INDEX.md` si tu attaques un finding d'audit

## État actuel (2026-05-26, post Sprint 4 design + i18n admin)

**Branche `main` synchronisée avec `origin/main`.** Dernier commit : `5228dfa fix(auth): stop tab-focus reload flicker in admin shell`.

**Métriques** :
- 0 erreur TypeScript, 8/8 vitest, **0 warning lint**
- 23 tests Playwright (4 golden-path smoke + 6 cart + 13 auth-guard admin/account)
- CI verte (lint + tsc + vitest sur PR et push main)
- Pre-commit hook actif (Husky + lint-staged → `eslint --fix --no-warn-ignored`)
- Vercel auto-deploy sur push main, domaine prod `https://farmau.do`
- Supabase project `adxpoxcynrpnbbxnncsk` : 13 brands, 52 ranges, 353 produits actifs à 100 DOP placeholder (tous ont `range_id`), 299 product_images, 36 tags, 844 product_tags, 1 admin, 1 row dans shop_settings
- **i18n admin opérationnel** via cookie `farmau_admin_locale` (FR/ES/EN, switcher dans le footer sidebar admin)

**Chantiers fermés session 2026-05-26** (14 commits, `e30e7a2` → `5228dfa`) :

### Design Sprint 4 — pages publiques
- `e30e7a2` refactor(pharmacie): `PICKUP_LOCATIONS[3]` → singleton `PICKUP_LOCATION`, rename `/pharmacies` → `/pharmacie`, supprime mentions « plusieurs pharmacies » partout (i18n + composants + sitemap + admin/settings notes)
- `db8ad45` feat(a-propos): refonte 8 sections — `AboutHero/Stats/Manifest/Team/Criteria/Visit/Partner/LeaveReview/Cta` + `AboutSectionHead` partagé. Drop `ReviewCard.tsx` + `BestProductsCard.tsx`
- `4d4262a` feat(catalogue): refonte éditoriale — `CatalogueHeader/Toolbar/Sidebar/Pagination` + `ProductCard` redesign (aspect 4/5, flags auto-dérivés, quick-add hover via nouveau variant `card-cta-quick`). Drop `Filters.tsx`. SELECT étendu (`old_price/stock/is_new/is_featured/volume`), filtre `is_active=true`
- `f54834b` fix(catalogue): drop `sold_30d` qui vit sur la vue `v_bestsellers`, pas sur `products` (400 sur Vercel)

### Copy/branding cleanup
- `cd3bf6a` refactor(copy): drop toutes les promesses de consultation dermato à la pharmacie. `pharmacien-dermatologue` → `pharmacien`. CTAs "parler à un pharmacien" → "Nous écrire sur WhatsApp". Redirection explicite vers clinique partenaire Skin Laser Center pour diagnostics dermato. FAQ + About + AboutCta + headerSubtitle Contact alignés sur la réalité (pharmacie = questions produit, clinique = consultation)

### Design Sprint 3 — pages admin
- `4b9d76c` feat(admin/product): `PageHeader` + sticky filterbar sand-100 + bouton clay-700 + `ProductsTable` restylée (sand-50, status pills avec dot, stock mono ochre/brick)
- `5b1722f` feat(admin/marques): idem + `BrandStatsCards` 3 KPIs sand-50 serif 32px + `BrandsTable` restylée
- `131230b` feat(admin/stock): idem + 4 KPIs avec accent olive/ochre/brick + tabs statut (Sin stock peint brick-600 quand actif) + modal restylé
- `13a8fc5` feat(admin/tags): idem mais **garde la structure `tag_types → tags`** (per user "adapte au système existant", pas la liste plate du design). `<article>` sand-50 par tag_type avec dot couleur en header, tags en `<li>`
- `14fbf19` feat(admin/messages): `PageHeader` + 7 KPIs sand-50 + filterbar 5 pills statut + liste sand-50 (lignes non lues `bg-clay-50/50` avec dot clay) + status pills (clay/ink/olive/sand) + priority icons brick/ochre + modal restylé
- `de00c36` feat(admin/annonce): chrome seulement (`PageHeader` + toggle Aperçu ghost/ink + bouton clay-700). Composants internes gardent le legacy

### Admin sidebar + i18n in-place
- `030f1f1` feat(admin/sidebar): `sticky top-0 h-screen` (Cerrar sesión toujours visible quoi qu'on scroll) + premier groupe Sitio público avec 3 Link vers la home publique
- `8a9fc5e` feat(admin): **i18n admin in-place via cookie** — `request.ts` fallback `farmau_admin_locale` cookie, `AdminLayout` Server wrap avec `NextIntlClientProvider`, `_AdminShell` Client héberge auth-gate + sidebar + barre mobile, `POST /api/admin/set-locale` admin-only, switcher FR/ES/EN dans sidebar pose le cookie + `router.refresh()`. Namespace `Admin.*` ~100 clés FR/ES/EN. Localisé : sidebar, AdminLayout mobile, dashboard, `/admin/{product,marques,stock,tags}`
- `14fbf19` + `de00c36` (déjà cités) ajoutent `Admin.messages` + `Admin.annonce` namespaces

### UX fix critique
- `5228dfa` fix(auth): plus de flash spinner "reload" à chaque changement de tab. Supabase v2 ré-émet `SIGNED_IN` au focus → `useIsAdmin` repassait `loading=true` → spinner full-screen visible → re-render. `useAuth` rejouait aussi `merge_anon_cart_to_user`. Fix par `useRef<string|null>` qui retient l'ID précédent : `SIGNED_IN` avec même ID ignoré. `_AdminShell` ne montre le spinner que si `loading && !user` (premier mount uniquement). Évènement `INITIAL_SESSION` enregistre l'ID sans side-effect.

---

## Sessions historiques antérieures

### Session 2026-05-23 (commits `186058b` → `b7ad240`)

**Chantiers fermés sessions 2026-05-22 → 2026-05-23** (16 commits) :

### Hygiène + a11y
- `186058b` chore: zero lint warnings (73 unescaped + 14 ESLint + custom splitChunks)
- `c4b851b` fix(a11y): stretched-link pattern ProductCard (button-in-link fixed)
- `a037202` fix(security): localStorage tokens removed + Secure cookie en prod
- `423cd62` feat(a11y): useConfirmDialog hook + 3 confirm() admin migrés
- `325660b` test(e2e): 13 Playwright auth-guard (admin + /account/*)
- `c1f1a04` chore: uninstall framer-motion + @supabase/auth-helpers-nextjs
- `688859c` feat(a11y): role=dialog + focus trap sur 13 modales admin (hook `useModalA11y`)

### Refactors structurels
- `d914f26` refactor(admin/tags): 797 → 211 LOC (10 fichiers colocalisés)
- `e522a1f` refactor(admin/product): 733 → 157 LOC + `src/lib/slug.ts` centralisé
- `34612d0` refactor(admin/marques): 765 → 229 LOC
- `00b6606` refactor(admin/annonce): 828 → 162 LOC

### Architecture + SEO
- `bb95ef6` feat(a11y/seo): `<html lang={locale}>` dynamique via `getLocale()`
- `4567e19` refactor(db): drop `products.image_url`, source unique `product_images`
- `b7ad240` refactor(db): drop table `product_ranges`, FK directe `products.range_id`

### Configuration boutique
- `be5f318` feat(admin/settings): table `shop_settings` + API GET/PATCH + page rewrite 2 tabs
- `5b0e7fe` feat(public): /pharmacies + /contact lisent shop_settings (helper `getShopSettings()`)

### Sécurité
- `57a92cc` fix(security): `getUser` (validation JWT) + RPC `is_user_admin` dans middleware + requireAdmin (audit security #8 + #11)

**6 sessions historiques livrées entre `c37a915` et `8d8ec14`** :

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

_(Les détails de la session 7 et toutes les vérifications sont désormais dans le récap "État actuel" en haut du fichier + dans `CLAUDE.md` section "État du projet 2026-05-23". Tous les chantiers session 7 ont été commités + poussés entre `186058b` et `b7ad240`.)_

---

## Findings restants — par priorité

### Localisation admin (suite, gros morceau)
- **Modaux d'édition** : `ProductFormModal`, `BrandFormModal`, `RangeFormModal`, `TagModal`, `TagTypeModal`, `TagDeleteModal`, `ProductDeleteModal`, `BannerFormModal`, `BannerDeleteModal` — labels de formulaire encore figés.
- **Pages admin non touchées par i18n** : `/admin/reservations` (498 LOC + sous-composants), `/admin/users`, `/admin/newsletter`, `/admin/settings` (395 LOC), `/admin/setup` (210 LOC). Ajouter à `Admin.{reservations,users,newsletter,settings,setup}` quand on s'y attaque.

### Sprint 3 Admin Anuncios — refonte architecturale séparée
Le design Sprint 3 propose une grille 4 slots fixes (Hero / Banner / Card / Modal) + 5 status sémantiques + KPIs (Impresiones / Clics / CTR) par slot. Notre schéma `banners` (text type + position int) ne supporte pas la structure. À envisager : enum `banner_slot_type` + tracking impressions/clics + dashboard analytics par slot.

### Contenu éditorial — About / Skin Laser Center
- **Photos d'équipe** réelles dans `AboutTeam.tsx` (silhouettes SVG génériques)
- **Vrais noms/numéros** : `Dra. María Pérez`, `Andrés Reyes`, `Yarisa Tavárez` = placeholders Sprint 4
- **Stats** : "60+ marques · 353 références · 7 farmacéuticos · 12 ans" — confirmer vs DB
- **Reg. Sanitario DGM-42-2014** : placeholder, mettre le vrai numéro
- **Avis Google réels** dans `AboutLeaveReview` : actuellement CTA "pharmacie neuve, laisse un avis". Passer en mosaïque si historique se constitue.
- **Adresse exacte SLC** dans `AboutPartner` (actuellement "Même bâtiment · entrée Calle 3")

### Quick wins (≤ 1h chacun)
- **Migration `banner_type_enum`** strict : la colonne reste `text` pour compat legacy.
- **AggregateRating** sur `ProductJsonLd` si on ajoute un système de reviews un jour.
- **Tests Playwright admin interactifs** (CRUD product/marques/tags via login) — nécessite seed test admin en CI.
- **4 fichiers untracked** à la racine (`_audit-reservation.mjs`, `_audit-screenshots.mjs`, `_check-chips.mjs`, `_check-pagination.mjs`) — soit déplacer dans `scripts/`, soit gitignore, soit supprimer.

### Accessibilité
- **Contraste palette** : certains hover sand-50 / clay-200 passent juste WCAG AA — à mesurer
- **Standardisation CTAs `bg-blue-*` → palette FARMAU**. Update 2026-05-26 : `/admin/{product,marques,stock,tags,messages,annonce}` propres. Restent les pages admin non touchées + recoins (login, signup, …).

### Contenu éditorial — autres (gros chantiers)
- **Blog** : table `posts` + admin CRUD + `/blog` + `/blog/[slug]` + sitemap (Footer "blog" pointe encore vers `/a-propos`)
- **Saisie INCI / benefits / pharmacist_advice** sur les 353 produits — colonnes prêtes, contenu à fournir
- **Traductions ES/EN du contenu juridique** `/legal/*` — actuellement FR uniquement avec disclaimer

### Consommation `shop_settings` à finir
- **Tunnel de réservation** : `lib/shipping.ts` expose `PICKUP_LOCATION` singleton aligné sur `shop_settings`, mais c'est une constante figée — un changement admin de `shop_settings.pickup_*` ne se propage pas. Idéal : SSR la pickup info dans `ReservationClient` via `getShopSettings()`.
- **Footer + CartEmpty** utilisent encore `NEXT_PUBLIC_WHATSAPP_NUMBER`
- **`metadata.openGraph.siteName`** pourrait lire `shop_name` depuis settings

### Hygiène long terme
- **Double opt-in newsletter** : provider d'envoi (Resend/Postmark) + email de confirmation
- **Audit Storage policies** : 2 buckets publics avec policy `select` large (`brand-fiche` + `product-image`) — Supabase advisor `public_bucket_allows_listing`
- **Refactor `auth.uid()` → `(SELECT auth.uid())`** dans les policies RLS (perf, audit DB #3)

### Décisions produit en suspens
- **Services esthétiques laser** : le repo s'appelle `skincarelaser` mais le projet vendu est FARMAU pharmacie. **Update 2026-05-26** : Skin Laser Center est désormais traité comme **clinique partenaire** dans `/a-propos` (section `AboutPartner` + Maps + Facebook + redirection pour consultations dermato). Pas de catalogue de prestations à intégrer pour l'instant ; FARMAU reste centré sur la pharmacie dermo-cosmétique + click & collect.

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

> Lis CLAUDE.md, docs/HANDOFF.md, vérifie l'état git (`git log --oneline -5` pour voir où on en est) + le MCP Supabase. Confirme ce qui est OK et propose-moi le prochain chantier parmi les findings restants (suite localisation admin, refonte Sprint 3 Anuncios, contenu éditorial About, blog, ou autre).

## Pièges spécifiques nouveaux (session 2026-05-26)

- **Cookie i18n admin** : `farmau_admin_locale` (sameSite=lax, 1 an) — pose par `POST /api/admin/set-locale`. Si ce cookie n'existe pas, `request.ts` retombe sur `routing.defaultLocale` (fr). Pour tester manuellement : `document.cookie = 'farmau_admin_locale=es; path=/'` puis reload.
- **Supabase ré-émet `SIGNED_IN` au focus tab** : les hooks `useAuth` + `useIsAdmin` doivent comparer l'ID user à un `useRef` pour éviter de rejouer les side-effects. Si on ajoute un nouveau hook auth-aware, suivre le même pattern (voir commit `5228dfa`).
- **`Filters.tsx` est mort** (supprimé 2026-05-26). La sidebar catalogue vit dans `src/components/catalogue/CatalogueSidebar.tsx`.
- **`PICKUP_LOCATIONS` n'existe plus** — utiliser `PICKUP_LOCATION` (singleton) de `lib/shipping.ts`. Les références encore en `PICKUP_LOCATIONS` indiquent du code legacy à mettre à jour.
- **`AboutTestimonials.tsx` n'existe plus** — remplacé par `AboutLeaveReview.tsx` (CTA Google Reviews honnête).
- **Route `/pharmacies` n'existe plus** — c'est `/pharmacie` (singulier). Les anciens liens externes vers `/pharmacies` cassent.
