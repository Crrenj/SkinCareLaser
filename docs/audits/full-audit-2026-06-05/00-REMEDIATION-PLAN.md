# Plan de remédiation V1 — FARMAU

> **Statut : Phases 0→5 EXÉCUTÉES et déployées sur `main` (2026-06-06).** Reliquat ci-dessous pour une session suivante.
> Validé par 3 relecteurs Opus. Audit source : `00-VERDICT.md` / `00-REGISTRE-CONSOLIDE.md`.
>
> ### ✅ Fait (commits sur `main`)
> - `4030af9` **P0** — venv dé-suivi, e2e hors CI, deps (vitest@4/happy-dom, audit fix)
> - `e065e33` **P1** — `getShopSettings` cookieless+`unstable_cache` (+`revalidateTag` au PATCH settings + validation email), email canonique `contact@farmau.do` (legal/account/messages)
> - `c3d9731` **P2** — tunnel pickup-only, WhatsApp threadé depuis `shop_settings`, `AddressStep` adresse optionnelle, `formatPrice` 0 déc., footer sans badges paiement
> - `84b82e7` **P3** — `safeRedirect` signup+profil, `getUser()` /account+reserve, `productCreate/Update` STRICT + `parsed.data` + 23505→409, `slug`≠'', **migration M1 `add_to_cart` (stock cumulé `FOR UPDATE` + cap 99 — APPLIQUÉE prod)**, `cartItemBody` Zod, `useAuth` A→B, newsletter sans IP + anti-formule, mdp 12
> - `4ba9aef` **P3** — bannières DOMPurify `<em>` + CTA locale/externe (+ `banners.link_url` normalisés)
> - `7baa051` **P4** — `BlogClient` `dialogRef`, `ContactForm` aria-live, dark `clay-800/900` lisibles, `LocaleSwitcher` `bg-white`→token
> - `b8b160b` **P5** — `create-admin`/`make-admin` réparés (retrait `profiles.is_admin`), `robots /*/account/`, blog `hreflang` locale-post, `admin-smoke` /admin, garde-fou `ALLOW_E2E`
>
> **DB (prod) :** M1 appliquée (grants/`search_path` préservés, 0 régression advisor) · `shop_settings.contact_email`=`contact@farmau.do` · `banners.link_url` normalisés (`/es/…`→`/…`).
>
> ### ⏳ Reste à faire (session suivante)
> 1. **i18n module admin réservations** — ~40 chaînes ES en dur → namespace `Admin.reservations` FR/ES/EN. Fichiers : `components/admin/reservations/{types,FilterBar,BulkActionBar,ReservationsTable,ReservationDrawer}.tsx` + `BannerDeleteModal`, `TagSelector`, compteur panier `producto/productos`. [C-10]
> 2. **`scripts/seed-import.cjs`** — retirer `image_url` (col droppée, ~l.267) + `product_ranges` (table droppée, ~l.279-281), poser `range_id`. [C-16]
> 3. **Régénération** — `database.types.ts` (MCP `generate_typescript_types`) + `db/schema.sql` + compteurs `CLAUDE.md` (22→28 routes, 1→2 admin, 0→4 posts). [C-130]
> 4. **SEO** — `sitemap.ts` hreflang blog = locale du post seule ; `noindex` metadata sur pages auth (login/signup/forgot/reset). [C-12/C-46]
> 5. **Tests** — `playwright.config` `globalSetup`/`globalTeardown` → `cleanupStaleTestUsers()` ; specs sécu (open-redirect bloqué, mass-assignment→400, super_admin). [C-19]
> 6. **Contraste CTA dark** — token `--c-on-accent` + rewiring `text-sand-50` sur `bg-clay-700` [C-15 partiel] · **`getUser`** sur `reservation/page` + `confirmation/[id]/page` [C-30 partiel].
>
> **Hors périmètre assumé** : grants TABLE RLS (D24) ; rendu statique `[locale]` bloqué par `getLocale()` du root layout (cluster perf C-02/03/04). **Action user** : activer Supabase « Leaked password protection » (D6).
>
> _Le plan détaillé original (Context, décisions, phases) suit, inchangé._

---

## Context

L'audit du 2026-06-05 (`docs/audits/full-audit-2026-06-05/`, 38 workstreams) a rendu un verdict **GO conditionnel** : **0 P0**, **24 P1 dédupliqués** concentrés sur le premier contact client. Ce plan exécute ces P1 + quelques quick wins.

**Objectif V1 (cadré par D17)** : livrer un **template visuel propre + un portail admin solide** pour que l'équipe de la pharmacie remplisse elle-même la BD. Prix en **placeholder 100 DOP** ; on **ne génère pas** de contenu réel — on **fiabilise** l'exemple et on **assainit** le contenu faux.

**Validation** : plan relu par **3 architectes Opus indépendants** (vs code + DB live). Consensus : **exécutable avec ajustements** — partis-pris DB vérifiés sûrs (`getShopSettings` cookieless, M1 `CREATE OR REPLACE` préserve grants+search_path, pickup-only sans impact réservation, `formatPrice` 0-déc.), **3 corrections dures** + complétude/ordre intégrés ci-dessous.

## Décisions verrouillées
- **D2** : commits directs sur `main` **par phase** (chaque push = déploiement Vercel prod ; pré-lancement, risque faible — donc **donnée + code d'une même correction doivent partir ensemble**).
- **D3** : migrations **écrites ET appliquées via MCP** (additives/idempotentes ; SQL montré avant `apply_migration` ; `get_advisors` après).
- **D8** : email unique `contact@farmau.do` (dans `shop_settings.contact_email`) — remplace `skin@skinlacercenter.net` ET `hola@farmau.do` en dur.
- **D9/D10/D11** : tél / WhatsApp / horaires **déjà éditables** dans `/admin/settings` → juste à **lire partout**.
- **D14 / D15 / D16** : retirer la livraison du parcours · retirer les badges de paiement · DOP **0 décimale**.
- **D23 / D24 / D25** : durcissement défense-en-profondeur **inclus** · grants TABLE RLS **différés (assumé)** · mdp min 12 + leaked-password (toggle Supabase D6).
- **D27 / D28 / D29 / D30=B** : `venv/` dé-suivi · régénérer types/schema/CLAUDE.md · réparer+compléter tests · **e2e retiré de la CI** (local à la demande).

## Hors périmètre (explicite)
- Vrais prix/produits (équipe via admin) · génération de contenu réel (noms d'équipe, Reg. Sanitario, avis → **adouci/générique, jamais inventé**) · resserrement grants TABLE RLS (D24) · validation juriste du **fond** légal (D26 — on ne corrige que les **coordonnées** mécaniques, pas le texte de loi) · branche Supabase Pro.

## Reporté post-V1 (P1 assumés, hors ce sprint)
- **C-02 / C-03 / C-04** (perf : `revalidate` mort marques/blog/besoins + N+1 `/marques` ~50 req, catalogue 500 produits/hit, similaires 50-pour-2). Même cause racine que C-01 (client cookie) mais **perf, pas correction** → traités après V1 (sauf si on décide d'ajouter au moins le N+1 `/marques`). À acter.

## Actions utilisateur en parallèle
- **D5 (env Vercel)** — vérifier : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (+ `RESEND_API_KEY`/`RESEND_FROM_EMAIL` opt.). **Aucune nouvelle var** (WhatsApp passe en DB ; `NEXT_PUBLIC_WHATSAPP_NUMBER` supprimée). Opt. `NEXT_PUBLIC_SITE_URL=https://farmau.do`.
- **D6** — activer **Auth → Leaked password protection** (Supabase dashboard).
- **Coordonnées** — renseigner tél/WhatsApp/horaires réels dans `/admin/settings` (je pose `contact@farmau.do` ; tu corriges les numéros).
- **D7 (vérif visuelle)** — valider chaque phase déployée.

## Mode de travail & vérification (chaque phase)
Avant chaque commit : `npx tsc --noEmit` (0) · `npm run lint` (0) · `npm run test:unit` · `npm run build` (vert). Migration : SQL montré → `apply_migration` → `get_advisors` (0 régression). Commit (`fix(...)`/`feat(...)` + trailer Co-Authored-By) + push `main`.

---

## Phase 0 — Hygiène repo + CI (commit isolé)
- **venv** : `git rm -r --cached venv/` + `venv/` dans `.gitignore` (n'efface pas les fichiers locaux). [C-20]
- **Retrait job e2e CI** (remonté ici) : supprimer le job `e2e` de `ci.yml` **dès maintenant** — sinon chaque push des phases 1-5 (D2 déploie) déclenche des écritures e2e en **prod**. Garder lint/tsc/unit/build. [C-19, D30=B]
- **Deps (commit séparé, validé)** : `npm audit fix` ; bump **vitest@4 + happy-dom** = **major** → isoler, `npm run test:unit -- --run` **vert** avant push (risque tests `themeModeScript`/`safeRedirect`). `npm audit` → `--audit-level=high` (sinon vulns *moderate* restantes rougissent la CI). [C-21]
Fichiers : `.gitignore`, `.github/workflows/ci.yml`, `package.json`, `package-lock.json`.

## Phase 1 — Données figées + coordonnées (impact client max)
- **`getShopSettings` cookieless + caché** *(vérifié sûr par les 3 relecteurs)* : réécrire sur le modèle exact de `src/lib/getThemeConfig.ts` — `createClient` anon (sans cookies) + `unstable_cache` (tag `shop-settings-config`, `revalidate:300`). Élimine le `DynamicServerError` avalé → vraies valeurs en SSG/ISR. Garder `FALLBACK`. [C-01]
- **Invalidation** : `/api/admin/settings` PATCH → `revalidateTag('shop-settings-config')` (calque `appearance/route.ts:66`).
- **Validation settings** : Zod léger au PATCH (email format, longueurs max), **allowlist `TEXT_FIELDS` conservée**. [C-53]
- **Lire partout — périmètre élargi** (remplacer les littéraux ; helpers `telHref`/`whatsappHref`/`mailtoHref` existent) :
  - `Footer`, `pharmacie/page.tsx`, `contact/page.tsx`, `AboutVisit`/`AboutCta`/`AboutPartner`, `cart/page.tsx`, `aide/page.tsx`.
  - **Coordonnées légales (mécanique, D26)** : `legal/{mentions-legales,cgv,confidentialite,cookies}` (16+ occurrences `skin@skinlacercenter.net`), **messages FAQ** `messages/{fr,es,en}.json` (~l.1145/1217), `faq/page.tsx` (`wa.me/18094122468`), `account/security`. Approche : Server Components → lire `getShopSettings()` (ou une seule constante partagée) pour email/tél ; **ne pas toucher au texte de loi**.
- **Donnée** : `UPDATE shop_settings SET contact_email='contact@farmau.do'` (MCP).
*(La page de confirmation + WhatsappHero sont traités en Phase 2 pour éviter d'éditer `ConfirmationClient` deux fois.)*
Fichiers : `src/lib/getShopSettings.ts`, `api/admin/settings/route.ts`, `Footer.tsx`, `[locale]/{pharmacie,contact,faq,aide}/page.tsx`, `about/*`, `legal/*`, `account/security/page.tsx`, `messages/*.json`.

## Phase 2 — Tunnel réservation : livraison + WhatsApp + prix/devise
- **Tunnel pickup-only** *(vérifié sans impact réservation)* : `ShippingStep` retire les `ZoneCard` payantes, force `pickup` ; ajuster `StepIndicator`/`ReservationClient`. [C-05, D14]
- **❌→fix WhatsApp threading complet** (correction dure des relecteurs) :
  - `confirmation/[id]/page.tsx` (serveur, a déjà `getShopSettings()`) → passer props `whatsappNumber`, `contactPhone`, `contactEmail` à `<ConfirmationClient>`.
  - `ConfirmationClient.tsx` → recevoir ces props ; `buildReservationWhatsappLink(payload, whatsappNumber)`.
  - `WhatsappHero.tsx:61,69` → remplacer `tel:+18091234567` + `mailto:hola@farmau.do` (faux) par les props.
  - `whatsapp.ts` : signature `(payload, whatsappNumber)`, drop `NEXT_PUBLIC_WHATSAPP_NUMBER`. [C-06]
- **Message + récap = sous-total seul** (drop `shippingCost`/`Envío`) ; `ReservationSummary` ET `ConfirmationRecap` (qui lit `draft.shipping` du sessionStorage) retirent la ligne livraison + ne calculent plus de `shippingCost`. `total == total_price` réservé. [C-05]
- **DOP 0 décimale** : `formatPrice` défaut `fractionDigits:0` *(aucun appelant ne dépend des 2 déc. — vérifié)*. [C-27, D16]
- **Footer** : retirer badges paiement **et** le lien `/livraison` (SERVICE_LINKS) devenu incohérent avec le click&collect ; décider du sort de la page `/livraison` (la garder en « infos retrait » ou retirer). [C-44, D15]
Fichiers : `reservation/ShippingStep.tsx`, `(checkout)/.../confirmation/[id]/{page.tsx,ConfirmationClient.tsx}`, `confirmation/WhatsappHero.tsx`, `reservation/ReservationSummary.tsx`, `confirmation/ConfirmationRecap.tsx`, `lib/whatsapp.ts`, `lib/formatPrice.ts`, `lib/shipping.ts`, `Footer.tsx`.

## Phase 3 — Sécurité (inclut migration M1)
- **Open-redirect** : `safeRedirectPath` (existant) au signup (`(auth)/signup/page.tsx:134-139`) et au profil (`ProfileEditForm.tsx:103` ← `profile/page.tsx:50`). [C-08, C-31]
- **getUser()** : `/account/layout.tsx` + `/api/cart/reserve` **ET tous leurs usages enfants** (`reserve` `session.user.id:55`, pages compte `user!.id`) migrés **dans le même commit** (sinon `undefined`→500). `reservation/page.tsx` + `confirmation/[id]` restent en `getSession()` = **hors périmètre assumé** (P2, mitigé RLS). [C-29/30]
- **Produits — validation stricte (champs RÉELS)** : `schemas.ts` `productCreate` **sans `.passthrough()`**, champs = exactement `{ name(min1), slug(min1), description(str opt), price(num≥0), stock(int≥0), brand_id(uuid opt), range_id(uuid nullish), imageFile(str opt), selectedTags(uuid[] opt) }` ; ajouter `productUpdate` (tout `.optional()` + `id`). **Routes `products` POST/PATCH déstructurent `parsed.data`, pas `body`** (`route.ts:83` = la vraie faille). `23505`→409 ; `slug.ts` jamais `''`. [C-09]
- **Panier — sur-vente (migration M1)** : `CREATE OR REPLACE add_to_cart` — contrôle stock **cumulé** + cap `MAX_CART_QUANTITY=99`, contrôle **dans l'UPSERT** (`DO UPDATE SET quantity = …` avec garde `RAISE`) pour limiter le TOCTOU ; **re-déclarer `SET search_path = public, pg_temp`** ; **ne PAS ré-ajouter de GRANT anon/authenticated** (proacl `{postgres,service_role}` préservé par CREATE OR REPLACE — vérifié live). Route POST mappe le `RAISE`→400 **même commit** ; PATCH cape `min(stock,99)`. Zod `cartItemBody` (UUID + int 1..99) sur POST/PATCH. *(Limite concurrence faible trafic V1 = acceptable, stock non bloquant assumé.)* [C-13, C-28]
- **Fuite favoris A→B (ajouté)** : `useAuth.ts:49-53` rejoue le merge panier + purge SWR wishlist sur **switch d'identité** (userA→userB), pas seulement null↔user (calquer `useIsAdmin`). [C-23]
- **Newsletter PII** : retirer `ip` de l'export CSV+JSON + neutraliser l'injection de formule (`escapeCsv` préfixe `=+-@` → `'`). [C-11]
- **Bannières** : (a) `title` **non aplati** → rendu assaini `DOMPurify.sanitize(title, {ALLOWED_TAGS:['em','strong','br']})` (le `<em>` est un design documenté, 2 bannières live l'utilisent) ; (b) `link_url` validé (interne `/…` **non préfixé locale** OU `http(s)://` absolu) + rendu `<a>` natif pour l'absolu (le `Link` next-intl re-préfixe → `/{locale}/…` 404) ; (c) **migrer la donnée** des bannières (`link_url` `/es/…`→`/…`) **même phase**. [C-12-banner, C-54/55]
- **Mot de passe min 12** : signup (`:23`) + reset (`:12`) — les **deux** constantes. Ajuster `test-users.ts` si besoin. [C-25]
Migration **M1** (montrée avant apply). Fichiers : `schemas.ts`, `api/admin/products/{route,[id]/route}.ts`, `slug.ts`, `api/cart/route.ts`, `hooks/useAuth.ts`, `api/admin/newsletter/route.ts`, `components/banners/*` + `Banner.tsx` + données `banners`, `(auth)/{signup,reset-password}/page.tsx`, `ProfileEditForm.tsx`, `account/layout.tsx`, `api/cart/reserve/route.ts`.

## Phase 4 — Dark mode + a11y + i18n admin
- **Contraste dark (WCAG)** *(dans le bon scope CSS)* : `globals.css` → token foreground lisible du CTA `accent-strong` ; dériver `clay-800/900` **par mode dans les blocs `[data-theme][data-mode="dark"]`** (PAS `:root`/`@theme` — piège « thème imbriqué » du BRIEF) ; `LocaleSwitcher` pilule `bg-white` littéral → token. [C-15, C-103/104/105]
- **a11y** : attacher le `dialogRef` de `useModalA11y` dans `BlogClient` ; mémoïser `onClose` (useCallback) aux call-sites ; `CartDrawer` `return null`/`inert` fermé ; `ContactForm` succès/erreur en `role=alert`/`aria-live` ; `<h1>` home garanti même `hero` off (`sr-only`). [C-14, C-36/37/40, C-24]
- **i18n admin réservations** : ~40 chaînes ES en dur → `Admin.reservations` (FR/ES/EN) ; idem `BannerDeleteModal`, `TagSelector`, `producto/productos`. [C-10]
Fichiers : `globals.css`, `admin/blog/BlogClient.tsx`, `hooks/useModalA11y.ts` (+ call-sites), `CartDrawer.tsx`, `ContactForm.tsx`, `admin/reservations/*`, `messages/*.json`.

## Phase 5 — SEO + scripts + tests + régénération
- **SEO** : hreflang blog = **locale du post seule** → ajouter `locale` au `select` de `blog/[slug]/generateMetadata` + 1 alternate + `x-default` ; idem `sitemap.ts` ; `noindex` pages auth ; `robots` `/*/account/`. [C-12, C-46/47]
- **Scripts** : `seed-import.cjs` retire `image_url`/`product_ranges`, pose `range_id` ; `create-admin-user.js` + `make-existing-user-admin.js` retirent `profiles.is_admin`, insèrent `admin_users`. [C-16/17]
- **Tests (D30=B)** : `playwright.config.ts` `globalSetup`/`globalTeardown` → `cleanupStaleTestUsers()` + garde `ALLOW_E2E` ; réparer `admin-smoke.spec.ts` (`/admin`) ; spécs sécurité (open-redirect signup/profil bloqué, mass-assignment produit→400, super_admin) ; helper produits `__E2E__`+`is_active=false` si requis. *(Job e2e CI déjà retiré en Phase 0.)* [C-18, D29]
- **Régénération** : `database.types.ts` (MCP) + `db/schema.sql` + compteurs `CLAUDE.md`. [C-130, C-206]
- **Migration M2** (optionnelle, additive) : 4 index FK (`reservation_items.product_id`, `contact_messages.user_id/replied_by`, `shop_settings.updated_by`). [WS27-01]
Fichiers : `app/{sitemap,robots}.ts`, `blog/[slug]/page.tsx`, `scripts/*`, `playwright.config.ts`, `tests/*`, `CLAUDE.md`, `db/schema.sql`.

---

## Migrations (D3 — écrites + appliquées via MCP, SQL montré avant)
- **M1** (Phase 3, requise) : `add_to_cart` — stock cumulé + cap 99, contrôle dans l'UPSERT, `SET search_path` re-figé, **aucun GRANT anon/authenticated** (préservés). `CREATE OR REPLACE` idempotent. `get_advisors` après = profil inchangé (preuve grants/search_path OK).
- **M2** (Phase 5, optionnelle) : 4 index FK (`CREATE INDEX IF NOT EXISTS`).

## Vérification end-to-end
- **Par phase** : tsc 0 · lint 0 · `test:unit` · `build` vert → commit+push `main` → vérif visuelle (D7).
- **Phase 1** : Footer/pharmacie/contact/legal affichent les coordonnées DB (plus aucun `skinlacercenter`/`hola@`).
- **Phase 2** : CTA WhatsApp confirmation pré-rempli OK ; total affiché == réservé ; pas de ligne livraison.
- **Phase 3** : panier cumul > stock → 400 (et panier toujours fonctionnel post-M1) ; signup `?next=//evil.com` → interne ; création produit légitime → OK, champ hors-schéma → 400 ; bannières home rendues avec italique (pas de `<em>` littéral), CTA non-404.
- **Phase 5** : `ALLOW_E2E=1 npm run test` local → vert + teardown (0 `@farmau.test` résiduel) ; `list_migrations` (M1/M2) ; `get_advisors`.
