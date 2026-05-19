# Audit complet — FARMAU / Skincare Laser

Date : 2026-05-19
Branche : `main` @ `8c6bf63` (Next.js 15.5.18, Supabase, 353 produits)
Méthode : 9 audits parallèles spécialisés, ~5 500 lignes de rapports

> **État** : voir `docs/HANDOFF.md` pour la suite à reprendre.
> Findings critiques fermés : ✅ #1 (auth /api/admin/*), ✅ #5 (UUID admin hardcodé), ✅ Next.js CVE.
> Findings critiques restants : bug `add_to_cart`, checkout cassé, `lang="en"`, image storage dupliqué.

---

## Vue d'ensemble

| Dimension | Note | Findings | Lignes | Rapport |
|---|---|---|---|---|
| Sécurité | 🔴 **Critique** | 15 | 219 | [security.md](./security.md) |
| Performance | 🟠 Moyen | 12 | 273 | [performance.md](./performance.md) |
| Architecture | 🟠 Moyen | 15 | 392 | [architecture.md](./architecture.md) |
| Base de données | 🟠 Moyen | 20 | 962 | [database.md](./database.md) |
| Accessibilité | 🔴 38/100 | 18 | 685 | [accessibility.md](./accessibility.md) |
| SEO | 🟠 65-75/100 | 15 | 824 | [seo.md](./seo.md) |
| Developer Experience | 🟡 6/10 | 15 | 841 | [developer-experience.md](./developer-experience.md) |
| UX / Product | 🔴 4/10 | 14 | 614 | [ux.md](./ux.md) |
| Qualité de code | 🟡 Moyen+ | 18 | 703 | [code-quality.md](./code-quality.md) |
| **TOTAL** | | **142 findings** | **5 513** | |

---

## 🚨 Findings critiques (à corriger AVANT prod publique)

Les audits ont convergé sur 5 problèmes qui apparaissent dans plusieurs rapports :

### ~~1. API admin entièrement ouvertes sur Internet~~ ✅ FIXÉ (commit `8c6bf63`)
**Audits concernés** : Sécurité (Critical), Architecture (High)
- ~~Le middleware (`src/middleware.ts:33-43`) protège `/admin/*` mais **exclut explicitement `/api`**~~
- ✅ Helper `src/lib/requireAdmin.ts` créé, appelé en tête des 16 routes `/api/admin/*`
- ✅ Client service-role centralisé dans `src/lib/supabaseAdmin.ts` (singleton)
- ✅ UUID admin hardcodé dans `/api/admin/messages` remplacé par `auth.userId`
- ✅ -320 lignes de duplication, -34 warnings lint
- **Vérification** : `curl https://farmau.vercel.app/api/admin/products -X DELETE` → `401 Non authentifié`

### 2. Tunnel d'achat cassé
**Audits concernés** : UX (Critical), Architecture
- Le `CartDrawer` désactive "Procéder au paiement (à venir)"
- Mais `/cart` (`CartClient.tsx`) a le même bouton **sans `disabled` ni handler** → clic = rien
- `.limit(100)` dans `src/app/catalogue/page.tsx:45` → 253 produits sur 353 invisibles
- Footer : 24 liens (catégories, besoins, marques, réseaux) tous non cliquables

→ Voir [ux.md#flux-utilisateur-principal](./ux.md)

### 3. Bug RPC `add_to_cart` — écrase la quantité au lieu d'incrémenter
**Audits concernés** : Base de données (High)
- `db/schema.sql:328-342` : `ON CONFLICT DO UPDATE SET quantity = EXCLUDED.quantity` au lieu de `+ EXCLUDED.quantity`
- Cliquer "Ajouter au panier" 2 fois sur le même produit ne donne **pas** 2 unités

→ Voir [database.md#10](./database.md)

### 4. Accessibilité non conforme WCAG AA
**Audits concernés** : Accessibilité (Critical), SEO
- `<html lang="en">` mais contenu **100 % français** — Google se trompe de langue
- `focus:outline-none` dans ~50 endroits sans alternative `focus-visible` → site inutilisable au clavier
- Modales sans `role="dialog"`, sans focus trap, sans Escape (CartDrawer + 6 modales admin)
- Spinners de chargement sans `role="status"`
- Contraste `#CCC5BD` (beige) + texte blanc = 1.96:1 (échec WCAG, requis 4.5:1)

→ Voir [accessibility.md](./accessibility.md), [seo.md#7](./seo.md)

### 5. Stockage d'images dupliqué
**Audits concernés** : Architecture, Base de données
- `products.image_url` (TEXT) **ET** table `product_images` (1-n) coexistent
- Le fallback `image_url || product_images?.[0]?.url` est dispersé sur 11 sites
- L'admin écrit dans les deux, le catalogue public ne lit que `product_images`
- → divergences silencieuses possibles

→ Voir [architecture.md#3](./architecture.md), [database.md#6](./database.md)

---

## 📊 Findings importants par dimension

### Sécurité (15)
- `.env.local` versionne `SUPABASE_SERVICE_ROLE_KEY` (à révoquer)
- Fallback `localStorage` pour tokens Supabase = exfiltration XSS triviale
- UUID admin hardcodé dans `/api/admin/messages/route.ts:74` (vieille policy de l'ancien projet)
- RPC `SECURITY DEFINER` sans `SET search_path` — risque d'injection de schéma
- `/api/contact` permet énumération d'emails utilisateurs + spam (pas de rate limit)
- Pas de validation des champs côté API (`...productData` propage tout)
- Pas de protection CSRF

### Performance (12)
- **0 page utilise `revalidate`/`unstable_cache`/`force-static`** — tout est SSR à chaque requête
- **0 index sur les FK** `product_ranges`, `product_tags`, `product_images` (7 indexes recommandés)
- 5 balises `<img>` au lieu de `next/image` (LCP dégradé sur fiche produit)
- Middleware admin = 2 round-trips DB par requête + double check côté layout
- `splitChunks` custom → un vendor chunk de **864 KB** invalidé en bloc
- `framer-motion` et `@supabase/auth-helpers-nextjs` listés mais jamais importés
- `FiltersNew.tsx` (394 lignes) jamais importé

### Architecture (15)
- `createClient(url, serviceKey)` répété **16 fois** (~300 LOC à factoriser dans `src/lib/supabase/admin.ts`)
- Auth admin vérifiée à 5 endroits avec 4 formulations différentes
- Pages admin obèses : tags 753, marques 708, product 703, annonce 668 lignes
- NavBar couple CartDrawer (drawer devrait être au layout)
- `<button>` dans `<Link>` (HTML invalide)
- Types `Product`/`Brand`/`Tag`/`Banner` redéfinis 5-10 fois ad-hoc

### Base de données (20)
- Pas de FK indexes sauf sur banners/contact_messages
- `auth.uid()` non wrappé dans `(SELECT auth.uid())` → évalué par ligne (perf RLS)
- `is_user_admin` pas marquée STABLE
- `products.image_url` + `product_images` doublon
- `is_admin` + `role='admin'` + `admin_users` = triple source de vérité
- `CHAR(3) currency` → texte fixe brittle (préférer enum ou ISO check)
- `tags_with_types` est une VUE non matérialisée — pas d'index possible
- Migration consolidée prête en annexe du rapport

### Accessibilité (18) — note 38/100
- 3 blockers critiques (lang erroné, focus invisible, modales non conformes)
- 50% des composants nécessitent des correctifs
- Roadmap 5 sprints pour atteindre ~88% conformité ; sprint 1 (1-2 jours) gagne +20 points

### SEO (15) — note 65-75/100
- Pas de `sitemap.ts`, pas de `robots.ts`, pas de `metadataBase`
- Pas de `generateMetadata()` pour les pages produits
- 0 JSON-LD structured data
- URLs `/product/[uuid]` au lieu de `/product/[slug]` (slug existe en BDD)
- `NEXT_PUBLIC_SITE_URL` manquant
- 7 snippets prêts à copier dans le rapport

### Developer Experience (15) — note 6/10
- `.env.local.example` manquant → onboarding cassé
- Aucune CI (`.github/workflows/` vide)
- Aucun pre-commit hook (Husky/lint-staged)
- 73 warnings ESLint, 32 `any` dans src/, 120 console.log/error
- Types Supabase non générés (`supabase gen types` non utilisé)
- Pas de validation runtime des env vars (`process.env.X!` partout)
- 15 templates prêts à coller (CI, Husky, env validation Zod, supabaseAdmin singleton, logger…)

### UX (14) — note 4/10
- 3 frictions bloquantes (checkout cassé, limit 100, conflit palette)
- 100% des liens du Footer morts
- Dropdown langue NavBar non fonctionnel
- Filtres catalogue 100% client-side (mauvais SEO + perf sur tag changes)
- 35 `alert()` natifs dans l'admin
- `localeCompare` utilisé pour le tri "meilleures ventes" (faux)
- Quick win proposé : remplacer checkout par lien WhatsApp (`wa.me/`) en attendant

### Qualité de code (18)
- 63 warnings ESLint, dont 33 `no-explicit-any`
- 320 lignes dupliquées (boilerplate `supabaseAdmin` × 16)
- `FiltersNew.tsx`, `ProductDetailCard.tsx`, `admin/ImageUpload.tsx` = code mort
- Couverture tests < 5%
- `generateSlug` copié 4 fois
- Magic numbers/strings : `'DOP'`, `5.99`, `10`, `5MB`, `25`, `100`

---

## 🛠️ Plan de remédiation recommandé

### Phase 1 — Sécurité bloquante (1-2 jours, AVANT toute prod publique)

1. **Sécuriser les routes `/api/admin/*`** — ajouter check `is_user_admin` ou middleware sur ces routes
2. **Révoquer + régénérer** `SUPABASE_SERVICE_ROLE_KEY` (versionné dans `.env.local`)
3. **Corriger le bug `add_to_cart`** (quantité écrasée → incrémentée)
4. **Fixer `<html lang="fr">`** et `Site URL` dans Supabase Auth
5. **Activer rate limit** sur `/api/contact` (Vercel ou Upstash)

### Phase 2 — Quick wins haut impact (3-5 jours)

6. **Indexes DB** : 7 indexes manquants sur FKs (script SQL prêt dans database.md)
7. **`sitemap.ts` + `robots.ts` + `metadataBase`** + lang fix (gain SEO immédiat)
8. **`generateMetadata` pour /product/[id]**
9. **`revalidate` sur /catalogue, /product/[id], /` (60s)
10. **Migrer 5 `<img>` vers `next/image`**
11. **`.env.local.example` + validation Zod**
12. **Supprimer code mort** : `FiltersNew.tsx`, `ProductDetailCard.tsx`, `framer-motion`
13. **Factoriser `supabaseAdmin`** en singleton (`src/lib/supabase/admin.ts`)

### Phase 3 — Accessibilité / UX (1-2 semaines)

14. **Skip link + focus-visible global** + correctifs modales
15. **Resize CartDrawer pour mobile** (`w-full sm:w-96`)
16. **Brancher checkout via WhatsApp** ou désactiver bouton sur /cart aussi
17. **`.limit(100)` → `.limit(500)` ou pagination réelle**
18. **Nettoyer le Footer** (vrais liens ou retrait)

### Phase 4 — Hygiène long terme (3-4 semaines)

19. **CI GitHub Actions** (lint + typecheck + vitest sur PR)
20. **Husky + lint-staged**
21. **Tests d'intégration** des routes API admin (Playwright)
22. **Splitter pages admin > 500 lignes** en composants
23. **Générer types Supabase** automatiquement
24. **Migrer URLs produits vers slug** (`/product/[slug]`)
25. **Bumper deps obsolètes** (Tailwind 4 → check, supabase-js, etc.)

---

## 📌 Points forts identifiés

Les audits ont aussi relevé ce qui est **bien fait** :

- TypeScript strict, 0 erreur `tsc`
- Schéma BDD bien normalisé (3NF sauf cas justifiés)
- RLS appliquée partout, helper `is_user_admin` astucieux pour éviter récursion
- App Router + Server Components utilisés correctement pour catalogue/product
- `next/image` avec `remotePatterns: '**'` (compatible Storage)
- Path alias `@/*` utilisé partout, 0 import relatif
- Tests Vitest qui passent (8/8 après les corrections)
- Documentation interne récente (`CLAUDE.md`, `db/README.md`)
- Scripts CLI bien structurés (`parse-pdfs`, `seed-import`, `prices:default`, etc.)
- `ContactForm`, login, signup ont des labels HTML corrects
- `globals.css` gère `prefers-reduced-motion`

---

## Comment lire les rapports

Chaque rapport suit la même structure :
- **Synthèse** en tête (note + top 3)
- **Findings** numérotés avec severity (Critical/High/Medium/Low), file:line, problème, fix
- **Snippets prêts à coller** pour SEO, DX, Database

Ouvrir dans l'ordre selon ton intérêt :
- Tu déploies bientôt en prod publique → **security.md** d'abord
- Tu veux du gain rapide → **performance.md** + **seo.md** (quick wins)
- Tu veux comprendre la dette → **architecture.md** + **code-quality.md**
- Tu veux améliorer le produit → **ux.md** + **accessibility.md**
- Tu veux installer du tooling → **developer-experience.md**
- Tu vas migrer la BDD → **database.md**
