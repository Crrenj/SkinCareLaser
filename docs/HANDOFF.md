# Handoff — Prompt pour le prochain Claude

Copier-coller ce qui suit dans une nouvelle session Claude Code ouverte sur `/Users/juan/Documents/skincarelaser`.

---

## Prompt à coller

Tu reprends le projet FARMAU (catalogue + réservation dermo-cosmétique, marché RD, Next.js 15 + Supabase, multilingue FR/EN/ES). Lis d'abord :

1. `CLAUDE.md` à la racine — état actuel, conventions, pièges
2. Ce fichier (`docs/HANDOFF.md`) — punch list courante
3. `docs/audits/INDEX.md` si tu attaques un finding d'audit

## État actuel (2026-05-20)

**Branche `main`, synchronisée avec `origin/main`.** Dernier commit : `3521c21 feat(seo): sitemap + robots + generateMetadata + hreflang`.

**Métriques** :
- 0 erreur TypeScript, 8/8 vitest, 4/4 smoke Playwright, lint ~38 warnings (stable, non bloquants)
- CI verte (lint + tsc + vitest sur PR et push main)
- Pre-commit hook actif (Husky + lint-staged → `eslint --fix --no-warn-ignored`)
- Vercel auto-deploy sur push main, domaine prod `https://farmau.do`
- Supabase project `adxpoxcynrpnbbxnncsk` : 13 brands, 52 ranges, 353 produits actifs à 100 DOP placeholder

**Système de réservation complet** : catalogue public + click & collect (pas de paiement online). Workflow : user connecté ajoute au panier → "Réserver" sur `/[locale]/cart` → snapshot via RPC + cart vidé → admin voit dans `/admin/reservations`, contacte via WhatsApp pré-rempli, marque confirmée/collectée. TTL 24h, auto-expire via `pg_cron` toutes les 5 min.

**i18n complet** : routes préfixées `/(fr|es|en)/...`, ~250+ strings UI traduites, LocaleSwitcher dans NavBar (desktop) + MobileDrawer (mobile). Seul le contenu BDD (noms produits/marques) n'est pas traduit.

**SEO** : sitemap.ts dynamique (routes × locales + produits actifs avec hreflang), robots.ts, generateMetadata par page avec canonical + hreflang `x-default`, openGraph. /cart et /account/profile en `noindex`.

## Findings restants — par ordre de priorité

### P2 — Quick wins (impact moyen-élevé, < 1h chacun)

1. **`/product/[id]` → `/product/[slug]`** : slugs déjà en BDD (column `products.slug`), URL SEO-friendly. Migration : changer le routing + redirect 301 des UUID → slugs + mettre à jour les Links + ajuster `sitemap.ts`. ~45 min.

2. **5 `<img>` → `next/image`** : CartDrawer, ProductClient (×2), DirectImageUpload, ImageUpload. Surtout important pour LCP fiche produit. ~15 min.

3. **Anti-énumération `create_contact_message`** : la RPC répond différemment selon que l'email existe ou non en `auth.users`, permettant d'énumérer les comptes (le rate limit ralentit mais ne ferme pas le trou). Fix : retourner uniformément `{success: true}` même si email inconnu, OU supprimer le check d'existence côté DB et laisser passer tout le monde. Choix produit. ~10 min DB + 5 min route.

4. **Footer vrais liens** : 24 `<li>` (Produits/Besoins/Service/Marque) actuellement non cliquables. Brancher vers `/[locale]/catalogue?tag=...` ou pages dédiées. ~30 min.

5. **`npm audit fix`** : 19 vulnerabilities (1 critique, 11 high) héritées des transitives. Trier avec attention breaking changes. ~30-60 min.

### P3 — Hygiène long terme

6. **`<html lang={locale}>` dynamique** : actuellement statique `"fr"` dans root layout. Pour le faire propre, créer un route group `(admin)` qui isole l'arbre admin avec son propre html, et déplacer le html du root layout vers `[locale]/layout.tsx`. ~1h.

7. **Stockage image dédupliqué** : `products.image_url` + table `product_images` cohabitent (finding archi #3). Décider d'une seule source, migrer les données, supprimer l'autre colonne/table. ~1-2h.

8. **Tests d'intégration routes admin** (Playwright) : actuellement seulement 4 smoke tests publics. Couvrir login admin + actions admin (create product, etc.). ~3-4h.

9. **Split pages admin > 500 lignes** : `tags/page.tsx` 753, `marques/page.tsx` 708, `product/page.tsx` 703, `annonce/page.tsx` 668. Pas urgent (ça marche), mais maintenabilité quand ça grossira. ~1 jour.

10. **Fallback `localStorage` pour tokens Supabase** (security finding #4) : XSS peut exfiltrer les tokens. Conséquences avant fix : peser la perte navigation privée vs risque. ~1-2h pour fix + tests.

11. **Audit `SET search_path` sur toutes les RPC SECURITY DEFINER** : `add_to_cart`, `get_or_create_cart`, `handle_new_user` (déjà OK), `remove_from_cart`, etc. à vérifier. Risque d'injection de schéma si manquant. ~30 min audit.

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
- Cache `.next/types/` stale après suppression de routes : `mv .next /tmp/.next-stale-...` puis rebuild.
- Test files : signup teste avec mot de passe FR, vitest mock `next-intl` charge fr.json.
- `next-intl` redirect : préférer `redirect(\`/${locale}/...\`)` avec `next/navigation` plutôt que la version next-intl (signature plus rigide).
- Login + Signup utilisent `next/navigation` useRouter (pas next-intl) pour gérer les redirects `/admin/*` (non localisé).
- L'utilisateur (`gaming11.r6@gmail.com`) push régulièrement en parallèle, et fait souvent du refactor design dans `NavBar.tsx`, `Footer.tsx`, `CartDrawer.tsx`, etc. en parallèle des sessions Claude. Toujours `git status` avant de commit pour ne pas écraser ses changements.

## Premier prompt suggéré au prochain Claude

> Lis CLAUDE.md, docs/HANDOFF.md, vérifie l'état git + le MCP Supabase. Confirme ce qui est OK et propose-moi le prochain finding à attaquer parmi le P2.
