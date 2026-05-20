# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (catalogue + réservation dermo-cosmétique, marché RD, Next.js 15 + Supabase, multilingue FR/EN/ES). Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. Ce fichier (`docs/HANDOFF.md`) — punch list courante
3. `docs/audits/INDEX.md` si tu attaques un finding d'audit

## État actuel (2026-05-20, post sprint 2 design)

**Branche `main`, synchronisée avec `origin/main`.** Dernier commit : `c37a915 refactor(admin): annonce form conditionnel editorial/hero/quote`.

**Métriques** :
- 0 erreur TypeScript, 8/8 vitest, 4/4 smoke Playwright, lint ~36 warnings (stable, non bloquants)
- CI verte (lint + tsc + vitest sur PR et push main)
- Pre-commit hook actif (Husky + lint-staged → `eslint --fix --no-warn-ignored`)
- Vercel auto-deploy sur push main, domaine prod `https://farmau.do`
- Supabase project `adxpoxcynrpnbbxnncsk` : 13 brands, 52 ranges, 353 produits actifs à 100 DOP placeholder

**Système de réservation complet** : catalogue public + click & collect (pas de paiement online). Workflow : user connecté ajoute au panier → "Réserver" sur `/[locale]/cart` → snapshot via RPC + cart vidé → admin voit dans `/admin/reservations`, contacte via WhatsApp pré-rempli, marque confirmée/collectée. TTL 24h, auto-expire via `pg_cron` toutes les 5 min.

**i18n complet** : routes préfixées `/(fr|es|en)/...`, ~250+ strings UI traduites, LocaleSwitcher dans NavBar (desktop) + MobileDrawer (mobile). Seul le contenu BDD (noms produits/marques) n'est pas traduit.

**SEO** : sitemap.ts dynamique (routes × locales + produits actifs avec hreflang), robots.ts, generateMetadata par page avec canonical + hreflang `x-default`, openGraph. /cart, /account/profile et /favoris en `noindex`.

**Sprint 2 design livré** (commits `677622c` → `c37a915`, 15 commits) :
- ProductCard refondue (Instrument Serif sur prix, CTA outline ink, quick-add au hover, ❤ heart top-right)
- NavBar 3-row sticky + recherche `⌘K` avec dropdown (recents + bestsellers fallback) + MobileDrawer
- Fiche produit : 5 accordéons `<details>` + galerie sticky desktop + zoom natif + pharmacist conditionnel + sticky bar mobile
- 6 bannières → 3 (`editorial`/`hero`/`quote`) avec admin form conditionnel
- Home + Footer : 7 sections home data-driven (Hero éditorial → v_bestsellers → tags featured_on_home → quote → brands → expertise → routine), Footer 5 col + newsletter
- Wishlist système complet : table `wishlists` RLS + `/api/wishlist` + `useWishlist` + page `/favoris`
- Migration consolidée DB sprint 2 : 12 nouvelles colonnes products + tags.featured_on_home + 4 col banners + table wishlists + vue v_bestsellers + 7 indexes FK

## Findings restants — par ordre de priorité

### P2 — Quick wins (impact moyen-élevé, < 1h chacun)

1. **Page `/marques`** : lien ajouté dans NavBar mais route inexistante (404). Créer `/[locale]/marques/page.tsx` qui liste les 13 brands avec lien vers `/catalogue?brand=...`. ~30 min.

2. **Routes `/besoins/[slug]`** : 14 liens dans le Footer pointent vers ces slugs (hydratation, anti-age, etc.) mais les pages n'existent pas. Deux options :
   - Créer `/[locale]/besoins/[slug]/page.tsx` qui SSR le catalogue filtré
   - Rewriter via `next.config.ts` vers `/[locale]/catalogue?need={slug}`
   ~1h pour l'option 1, 10 min pour l'option 2.

3. **3 `<img>` → `next/image`** : reste `CartDrawer`, `ProductClient` (×2). Les 2 admin déjà faits (commit `b580342`). Surtout important pour LCP fiche produit. ~10 min.

4. **Curation home** : les sections Bestsellers et ByNeed sont en degraded mode tant que la DB n'est pas remplie. Actions admin :
   - `UPDATE products SET is_featured = true WHERE id IN (...)` → 4 best-sellers visibles
   - `UPDATE tags SET featured_on_home = true WHERE slug IN ('sunProtection', 'sensitive', 'radiance')` → 3 cards Besoins data-driven
   ~10 min SQL.

5. **JSON-LD structured data** : Product schema sur `/product/[slug]`. Améliore rich snippets Google. ~30 min.

6. **Migration `banner_type_enum`** : la colonne reste `text` pour compat legacy. Quand toutes les bannières DB auront été re-sauvegardées via l'admin (qui écrit le nouveau type), créer l'enum strict. ~15 min DB.

### P3 — Hygiène long terme

7. **`<html lang={locale}>` dynamique** : actuellement statique `"fr"` dans root layout. Créer un route group `(admin)` qui isole l'arbre admin avec son propre html, déplacer le html du root vers `[locale]/layout.tsx`. ~1h.

8. **Stockage image dédupliqué** : `products.image_url` + table `product_images` cohabitent. Décider d'une seule source, migrer, supprimer l'autre. ~1-2h.

9. **Tests d'intégration routes admin** (Playwright) : actuellement seulement 4 smoke tests publics. Couvrir login admin + actions admin (create product, create banner, etc.) + parcours wishlist. ~3-4h.

10. **Split pages admin > 500 lignes** : `annonce/page.tsx` ~887 (croissance sprint 2), `tags/page.tsx` 753, `marques/page.tsx` 708, `product/page.tsx` 703. Pas urgent, maintenabilité quand ça grossira. ~1 jour.

11. **Fallback `localStorage` pour tokens Supabase** (security finding #4) : XSS peut exfiltrer les tokens. Conséquences avant fix : peser la perte navigation privée vs risque. ~1-2h pour fix + tests.

12. **Audit `SET search_path` sur toutes les RPC SECURITY DEFINER** : risque d'injection de schéma si manquant. ~30 min audit.

13. **Double opt-in newsletter** : actuellement insert direct. Ajout d'un provider d'envoi (Resend, Postmark) + email de confirmation. ~2-3h.

14. **Saisie contenu PDP** : les colonnes `pharmacist_advice`, `benefits[]`, `usage`, `inci`, `texture`, `volume` sont prêtes en DB mais vides sur 353 produits. Workflow d'enrichissement (parse-pdfs amélioré OU saisie manuelle admin) à designer. ~journée+

### Décisions produit en suspens

Aucune connue. Le modèle business (catalogue + réservation WhatsApp, pas de paiement online) est confirmé.

## Workflow recommandé

1. **Lis `CLAUDE.md` + ce HANDOFF + l'audit relevant** d'abord.
2. **Demande à l'utilisateur ce qu'il veut attaquer** — ne pas démarrer en autonome sauf demande explicite.
3. **Vérifie le MCP Supabase** : `mcp__supabase__get_project_url` doit renvoyer `https://adxpoxcynrpnbbxnncsk.supabase.co`.
4. **Changements DB** : via MCP `apply_migration`, sync `db/schema.sql`, regen types si besoin (`mcp__supabase__generate_typescript_types`).
5. **Avant chaque commit** : `npx tsc --noEmit && npm run test:unit -- --run && npm run lint`.
6. **Convention commit** : `<type>(<scope>): <description FR>` + corps + `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
7. **Push** : seulement sur demande explicite de l'utilisateur. Vercel auto-deploy sur push main.

## Pièges connus (résumé — voir CLAUDE.md pour détails)

- Cursor rule `alwaysApply` : **NE JAMAIS commit sans demande explicite**.
- Bash deny list bloque `rm`, `git --force`, `git rebase`, `git reset --hard` → utiliser `git rm` + `git reset --soft`.
- Cache `.next/types/` stale après suppression de routes : `mv .next .next-stale-...` puis rebuild (`.next-stale-*` est gitignored).
- Test files : signup teste avec mot de passe FR, vitest mock `next-intl` charge fr.json.
- `next-intl` redirect : préférer `redirect(\`/${locale}/...\`)` avec `next/navigation` plutôt que la version next-intl (signature plus rigide).
- Login + Signup utilisent `next/navigation` useRouter (pas next-intl) pour gérer les redirects `/admin/*` (non localisé).
- L'utilisateur (`gaming11.r6@gmail.com`) push régulièrement en parallèle. Toujours `git status` avant de commit pour ne pas écraser ses changements. Le sprint 2 design a déclenché des refactors croisés (slug routing, locale link, etc.) — vérifier les diffs avant de toucher NavBar/Footer/ProductClient.
- Sprint 2 a ajouté ProductCard `slug` field obligatoire pour le href. Si tu refactor le mapping produits, garde le slug.
- Le composant `Banner.tsx` accepte 9 valeurs `banner_type` (3 nouveaux + 6 legacy) pour rétro-compat tant que l'enum DB n'est pas serré.

## Premier prompt suggéré au prochain Claude

> Lis CLAUDE.md, docs/HANDOFF.md, vérifie l'état git + le MCP Supabase. Confirme ce qui est OK et propose-moi le prochain finding à attaquer parmi le P2.
