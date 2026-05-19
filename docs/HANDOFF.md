# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (e-commerce dermo-cosmétique Next.js 15 + Supabase) après un long cycle de cleanup + audit + premier fix sécu. Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. `docs/audits/INDEX.md` — synthèse audit 9 dimensions (142 findings)

## État actuel (résumé)

**Branche `main`, synchronisée avec `origin/main`, 6 commits depuis le redémarrage post-pause Supabase :**

```
8c6bf63 fix(security): authentifie toutes les routes /api/admin/* (finding #1 audit)
5458d59 docs: ajoute audit complet du projet (9 dimensions, 142 findings)
33b8191 fix(security): bump Next.js 15.3.4 to 15.5.18
61c65c3 fix: seed-import idempotent + filtre --brands + script prices-default
583dbcb chore: quick wins lint + outils prix CSV + audit catalog + hook useIsAdmin
d032574 refactor: cleanup massif et préparation redémarrage post-pause Supabase
```

**Métriques actuelles :**
- 0 erreur TypeScript, 8/8 tests Vitest, lint 39 warnings (mostly `any` admin pages)
- Vercel déployé (auto-deploy sur push main)
- Supabase : projet `adxpoxcynrpnbbxnncsk` avec 13 brands, 52 ranges, 353 produits actifs à 100 DOP placeholder, 299 images, 36 tags, 1 admin (`j@gmail.com`)
- Service-role key Supabase **rotée** récemment (l'ancienne est compromise — au cas où, ne pas la chercher dans l'historique git)

## Findings critiques restants — par ordre de priorité

### P1 — Encore bloquants prod

1. **Bug RPC `add_to_cart`** — `db/schema.sql:328`. Le `ON CONFLICT DO UPDATE SET quantity = EXCLUDED.quantity` **écrase** la quantité au lieu d'incrémenter. Cliquer "Ajouter au panier" 2× ne donne pas 2 unités. Fix : `quantity = cart_items.quantity + EXCLUDED.quantity`. Voir `docs/audits/database.md#10`.

2. **`<html lang="en">`** dans `src/app/layout.tsx:31` alors que tout est en français. Casse SEO + accessibilité. Fix trivial : changer `"en"` → `"fr"`. Voir `docs/audits/accessibility.md#finding-1` et `docs/audits/seo.md`.

3. **Checkout cassé** — `/cart` (`src/components/CartClient.tsx`) a un bouton "Procéder au paiement" sans handler ni disabled. Drawer dit "à venir" mais page non. Soit désactiver le bouton sur `/cart` (1 ligne), soit brancher un lien WhatsApp pré-rempli avec le panier (`wa.me/...?text=...`) — quick win UX proposé dans `docs/audits/ux.md`.

4. **Rate limit absent sur `/api/contact`** — énumération d'emails possible. Voir `docs/audits/security.md`.

### P2 — Quick wins (haut impact, < 30 min chacun)

5. **`.limit(100)` dans `src/app/catalogue/page.tsx:45`** — 253 produits sur 353 invisibles. Passer à `.limit(500)` ou paginer.

6. **7 indexes DB manquants** sur FKs — `docs/audits/database.md` contient le SQL prêt. Gain perf RLS direct.

7. **`sitemap.ts` + `robots.ts` + `metadataBase`** + `generateMetadata` pour `/product/[id]` — snippets prêts dans `docs/audits/seo.md`.

8. **`revalidate = 60`** sur `/`, `/catalogue`, `/product/[id]` — actuellement tout SSR à chaque requête.

9. **5 `<img>` → `next/image`** — `CartDrawer.tsx:185`, `ProductClient.tsx:67,79`, `DirectImageUpload.tsx:119`, `ImageUpload.tsx:96`.

10. **`.env.local.example`** manquant — bloque l'onboarding. Template dans `docs/audits/developer-experience.md`.

### P3 — A11y/UX (sprint 1-2 semaines)

11. **`focus:outline-none` global** (~50 occurrences) → remplacer par `focus-visible` + skip link. WCAG 2.4.7 AA.
12. **Modales sans `role="dialog"`** — CartDrawer + 6 modales admin. Focus trap, Escape, retour focus.
13. **Footer** : 24 liens morts (catégories, besoins, marques, réseaux sociaux).
14. **NavBar dropdown langue** non fonctionnel (FR/EN/ES).
15. **CartDrawer mobile** : `w-96` déborde sur iPhone SE → `w-full sm:w-96`.

### P4 — Hygiène long terme

16. **Stockage image dupliqué** — `products.image_url` + `product_images` cohabitent. Choisir l'un, migrer, supprimer l'autre.
17. **CI GitHub Actions** (lint + typecheck + vitest sur PR) — template prêt dans `docs/audits/developer-experience.md`.
18. **Husky + lint-staged** pre-commit.
19. **Tests d'intégration des routes admin** (Playwright).
20. **Split pages admin > 500 lignes** : `tags/page.tsx` 753, `marques/page.tsx` 708, `product/page.tsx` 703, `annonce/page.tsx` 668.
21. **Types Supabase générés** : `npx supabase gen types typescript --project-id adxpoxcynrpnbbxnncsk > src/lib/database.types.ts`.
22. **URLs `/product/[slug]`** au lieu de UUID (slugs déjà en BDD).

## Pièges connus

- **Ne JAMAIS commit sans demande explicite** (règle Cursor `alwaysApply` dans `.cursor/rules/rules.mdc`).
- **Bash deny list** dans `.claude/settings.local.json` bloque `rm`, `git reset --hard`, `git rebase`, `git commit --amend`, `git push --force`. Utiliser `git rm` + `git reset --soft` + créer un nouveau commit plutôt que amend.
- **GitHub Push Protection** scanne le contenu — ne jamais coller la service-role key telle quelle dans un fichier (utiliser `sb_secret_***` à la place).
- **`.next/types/`** est un cache TS — après suppression de routes, `mv .next /tmp/.next-stale-$(date +%s)` puis rebuild pour que `tsc --noEmit` arrête de râler sur les modules manquants.
- **MCP Supabase** : `.mcp.json` à la racine pointe vers le bon projet (`adxpoxcynrpnbbxnncsk`). Si le token expire : `/mcp` → supabase → Authenticate.
- **`scripts/package.json`** a `"type": "module"` — les nouveaux scripts Node doivent être `.cjs` ou utiliser la syntaxe ES.
- **Vercel a un domaine prod** (l'utilisateur le connaît) — penser à ajouter ses URLs dans Supabase Auth → Redirect URLs avant de tester du login en prod.

## Workflow suggéré pour reprendre

1. **Lis `CLAUDE.md` + `docs/audits/INDEX.md` + ce HANDOFF** en premier.
2. **Demande à l'utilisateur quel finding il veut attaquer** — ne pas attaquer en autonome sauf demande explicite ("vas-y de manière autonome", "fais les quick wins").
3. **Vérifie le MCP Supabase** : appelle `mcp__supabase__get_project_url`. Doit retourner `https://adxpoxcynrpnbbxnncsk.supabase.co`. Sinon, demande à l'utilisateur de faire `/mcp` → Authenticate.
4. **Pour les changements DB** : utilise `mcp__supabase__apply_migration` plutôt que de demander à l'utilisateur d'ouvrir le SQL editor.
5. **Avant chaque commit** : `npx tsc --noEmit && npm run test:unit -- --run && npm run lint`.
6. **Convention de commit** : `<type>(<scope>): <description courte FR>` + corps détaillé + `Co-Authored-By: Claude <noreply@anthropic.com>` (fin).

## Premier prompt suggéré au prochain Claude

> Lis CLAUDE.md, docs/audits/INDEX.md et docs/HANDOFF.md, puis vérifie l'état git + le MCP Supabase. Confirme ce qui est OK et propose-moi le prochain finding à attaquer (P1 : add_to_cart, lang="en", checkout, rate limit /contact).

---

## Détails techniques pour reprendre tel quel

### Pour fixer `add_to_cart` (~10 min)

```sql
-- Via MCP : mcp__supabase__apply_migration
-- name: fix_add_to_cart_increment
-- query:

CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_cart_id    UUID,
  p_product_id UUID,
  p_quantity   INT,
  p_anon_id    UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF p_anon_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND anonymous_id = p_anon_id
  ) THEN
    RAISE EXCEPTION 'Panier non autorisé';
  END IF;

  INSERT INTO public.cart_items (cart_id, product_id, quantity)
  VALUES (p_cart_id, p_product_id, p_quantity)
  ON CONFLICT (cart_id, product_id)
  DO UPDATE SET
    quantity = public.cart_items.quantity + EXCLUDED.quantity,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Puis mettre à jour `db/schema.sql:328` pour refléter le fix (même corps de fonction), et écrire un test Playwright qui clique 2× sur "Ajouter au panier" et vérifie qty=2 dans le drawer.

### Pour fixer `<html lang>` + skip link (~5 min)

Dans `src/app/layout.tsx:31` :

```tsx
<html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
  <body className="antialiased">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow"
    >
      Aller au contenu principal
    </a>
    {/* ... */}
```

Et `<main id="main-content">` dans `src/app/page.tsx` et les autres pages publiques.

### Pour fixer le checkout (~10 min, version WhatsApp)

Dans `src/components/CartClient.tsx`, remplacer le bouton "Procéder au paiement" par un `<a>` qui pointe vers `wa.me/<num>?text=<panier-encodé>`. Voir `docs/audits/ux.md` pour le pattern.

### Pour les indexes DB (~5 min)

```sql
-- Via MCP : mcp__supabase__apply_migration
CREATE INDEX IF NOT EXISTS idx_product_ranges_product_id ON public.product_ranges(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ranges_range_id   ON public.product_ranges(range_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id   ON public.product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id       ON public.product_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_ranges_brand_id           ON public.ranges(brand_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id        ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id     ON public.cart_items(product_id);
```

Puis ajouter ces lignes à la fin de `db/schema.sql` pour qu'un futur déploiement les inclue.
