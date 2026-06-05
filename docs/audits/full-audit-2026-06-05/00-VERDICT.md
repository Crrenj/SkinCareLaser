# 00 — Verdict V1 · Audit complet FARMAU (2026-06-05)

Synthèse exécutive de l'audit ligne-par-ligne (38 workstreams, Opus 4.8, lecture seule, recoupé en DB live + `npm run build`/`vitest`/`tsc`).
Registre détaillé : [`00-REGISTRE-CONSOLIDE.md`](./00-REGISTRE-CONSOLIDE.md) · Contrat : [`_BRIEF.md`](./_BRIEF.md).

---

## Verdict : **GO conditionnel**

**Aucun bloqueur dur (0 P0).** Le socle est solide : authz exhaustive, RLS active partout, XSS blog réellement assaini, pas de secret exposé, parité i18n parfaite, build/tsc/lint verts. Le projet **peut** lancer.

**MAIS** un cluster de **24 P1** impose une **pré-V1 courte** avant mise en ligne publique, parce que plusieurs touchent ce que le client voit/utilise au premier contact : **coordonnées de contact fausses servies en statique, CTA WhatsApp mort, livraison fantôme avec total divergent, dark mode illisible**. Aucun n'est une faille critique, mais leur effet cumulé dégrade la crédibilité et le flux de réservation — qui est *le* cœur fonctionnel de ce site.

Décision honnête : **ne pas lancer tel quel**, mais le travail restant est **borné et bien identifié** (l'essentiel = ~10 corrections + 4 décisions humaines). Ce n'est pas un No-Go (rien n'est cassé au point d'empêcher l'usage) ; c'est un **Go dès que le top 10 ci-dessous est traité**.

### Tally de sévérité

| | P0 | P1 | P2 | P3 |
|---|---|---|---|---|
| **Brut** (38 rapports) | 0 | 47 | 165 | 191 |
| **Dédupliqué** | **0** | **24** | **105** | **~96** |

Santé globale : **architecture saine, finition incomplète.** Les défauts sont concentrés sur la *jointure* code↔contenu↔données (rendu dynamique mal maîtrisé, contenu placeholder, schéma dérivé périmé), pas sur la logique cœur ni la sécurité d'autorisation.

---

## Top 12 « à corriger avant V1 » (priorisé)

Les P1 réels, dédupliqués, classés par impact client × effort. Effort : **S** ≤ 2 h · **M** ≤ 1 j · **L** > 1 j.

| # | Cluster | Quoi corriger | Fichier:ligne | Effort | Pourquoi V1 |
|---|---|---|---|---|---|
| 1 | **Données figées** (C-01) | Refaire `getShopSettings` sur le modèle `getThemeConfig` (client anon sans cookies + `unstable_cache`) et **ne plus avaler** le `DynamicServerError`. Débloque Footer + pharmacie + contact + cart. | `lib/getShopSettings.ts:45-63` | **M** | Le Footer sert en permanence des **contacts factices** (WhatsApp→`/contact`, tél/email absents) sur ~9 pages. C'est la régression la plus visible. |
| 2 | **Coordonnées** (C-07) | Trancher **une** adresse de contact + corriger le typo `skinlacercenter`→`skinlasercenter` (ou `@farmau.do`), le `tel:+18091234567` bidon, et aligner les **4 jeux d'horaires** sur `shop_settings`. | `legal/*`, `WhatsappHero.tsx:61`, FAQ/about messages | **M** | Email RGPD/légal pointe vers un domaine tiers probablement mort ; horaires contradictoires = client devant porte close. |
| 3 | **WhatsApp mort** (C-06) | Brancher le numéro WhatsApp de confirmation sur `shop_settings` (prop serveur) au lieu de `NEXT_PUBLIC_WHATSAPP_NUMBER` (jamais fournie). | `lib/whatsapp.ts:39,87-92` | **S** | Le CTA central « coordonner ma réservation » bascule silencieusement vers `/contact`. Tue la finalité du tunnel. |
| 4 | **Livraison fantôme** (C-05) | Aligner le tunnel sur click&collect : retirer les `ZoneCard` payantes de `ShippingStep`, purger `+ shippingCost` du total WhatsApp/récap, forcer `pickup`. | `ShippingStep.tsx:42-67`, `lib/whatsapp.ts:45-81`, `ConfirmationRecap.tsx` | **M** | Total annoncé au client (sous-total +300/600 DOP) ≠ `total_price` réservé, pour un service inexistant → litige. |
| 5 | **Mass-assignment** (C-09) | Schéma `productCreate` **strict** (retirer `.passthrough()`), insérer `parsed.data` ; ajouter `productUpdate` Zod au PATCH. | `api/admin/products/route.ts:79-136`, `products/[id]/route.ts` | **M** | Admin-only mais c'est le seul trou d'intégrité produit (prix/flags/devise/`id` écrasables). Aligne sur les autres routes. |
| 6 | **Sur-vente panier** (C-13) | Valider `existant + delta <= stock` dans `add_to_cart` (ou POST) ; appliquer `MAX_CART_QUANTITY` (C-28). | `api/cart/route.ts:197-204` + RPC | **S** | Le seul garde-fou d'ajout (le stock n'est pas bloqué — choix assumé) est inopérant → réservation > stock. |
| 7 | **Open-redirect signup** (C-08) | Remplacer le check inline par `safeRedirectPath` (déjà importable). | `(auth)/signup/page.tsx:134-139` | **S** | Vecteur `?next=/\evil.com` post-signup → phishing. Login/callback sont durcis ; signup oublié. |
| 8 | **PII newsletter** (C-11) | Retirer la colonne `ip` de l'export CSV + JSON ; neutraliser l'injection de formule (`=/+/-/@`). | `api/admin/newsletter/route.ts:32,53-62` | **S** | Fuite email↔IP (Ley 172-13) dans un fichier exportable, bénéfice nul. |
| 9 | **Dark mode WCAG** (C-15) | CTA `accent-strong` : foreground lisible en dark (token `--c-on-accent`) ; dériver `clay-800/900` selon le mode (pas figé `#000`). | `globals.css:24,111-194` | **M** | CTA primaire + 27 usages `text-clay-800` illisibles en mode sombre sur 4/6 thèmes. (Le mode sombre est exposé via le toggle visiteur.) |
| 10 | **Scripts seed/admin cassés** (C-16, C-17) | Retirer `image_url`/`product_ranges` de `seed-import` (poser `range_id`) ; retirer `profiles.is_admin` de `create-admin`. | `scripts/seed-import.cjs:259-301`, `create-admin-user.js:91-100` | **S** | `npm run seed-import` importe **0 produit** ; `npm run create-admin` **échoue** → pas de bootstrap admin sur base à jour. |
| 11 | **Hygiène repo** (C-20, C-21) | `git rm -r --cached venv/` + `.gitignore` ; `npm audit fix` (transitifs) + planifier `vitest@4`/`happy-dom`. | `venv/**`, `package.json` | **S** | 1010 fichiers parasites (67 % du repo) + chemin home publié ; 2 vulns critiques (dev). |
| 12 | **CI/tests** (C-18, C-19) | Réparer `admin-smoke` (`/admin` au lieu de `/admin/product`) ; gater l'e2e CI sur les secrets et le pointer vers une **branche Supabase**, pas la prod. | `tests/admin-smoke.spec.ts:42,49`, `ci.yml:46-75` | **M** | Job e2e rouge + écrit de vrais users/réservations en **production**. |

**Recommandé aussi avant V1 (effort cumulé faible, fort signal de qualité)** :
- C-24 / C-32 — Garantir un `<h1>` sur la home même hero off (`sr-only`) **S** ; activer « Leaked password protection » Supabase (1 clic, 0 code) **S**.
- C-46 / C-47 — `noindex` sur les pages auth + `disallow:/*/account/` (sinon login/compte indexables) **S**.
- C-12 — hreflang blog honnête (1 locale par post) avant que Google n'indexe les 3 **S**.
- C-27 — Décider 0 décimale DOP et l'appliquer (client affiche `100.00`, admin `100`) **S**.

---

## Thèmes transverses (clusters récurrents)

1. **Rendu dynamique non maîtrisé + données figées (le plus structurant).** `getShopSettings`/Footer/sitemap/home/catalogue/marques/blog passent par le client cookie → `revalidate` mort, N+1 `/marques` (~50 req/hit), catalogue 500 produits/hit, similaires 50-pour-2. **Pire** : `getShopSettings` avale le `DynamicServerError` → contacts FALLBACK servis en statique. Le projet **a déjà le bon pattern** (`getThemeConfig`) mais ne l'a pas généralisé. → C-01, C-02, C-03, C-04, C-107.
2. **Couche livraison vestigiale vs click&collect.** Le tunnel propose et chiffre une livraison payante jamais persistée (`total_price`=sous-total), total WhatsApp divergent, adresse/note en sessionStorage seulement, `FALLBACK.shipping_*` propagé. → C-05, C-27(devise liée), C-92.
3. **Chaos des coordonnées de contact.** Emails légaux vers un domaine tiers (typo probable), `tel:` bidon, WhatsApp en dur vs `shop_settings`, numéros sans normalisation E.164, 4 jeux d'horaires, `NEXT_PUBLIC_WHATSAPP_NUMBER` absente. → C-06, C-07, C-52.
4. **`getSession()` vs `getUser()` (défense en profondeur incohérente).** `/account/*`, `/api/cart/reserve`, pages réservation gardent `getSession()` (cookie non revalidé) alors que middleware/requireAdmin ont migré vers `getUser()`. Mitigé par RLS/RPC, mais incohérent. → C-29, C-30.
5. **Open-redirect appliqué de façon incohérente.** `safeRedirectPath` câblé sur login/callback, **oublié** au signup (C-08) et au profil `?from=` (C-31).
6. **Validation API produits contournée.** POST déstructure le `body` brut + `.passthrough()`, PATCH sans Zod, upload produit non-sniffé. → C-09, C-86.
7. **Sur-vente / quantité non bornée.** Stock validé sur le delta pas le cumul, `MAX_CART_QUANTITY` jamais appliqué (3 littéraux divergents), « Ajouté ✓ » faux positif avant hydratation. → C-13, C-28, C-114.
8. **Espagnol en dur hors dashboard.** Module admin réservations entier (~40 chaînes), `BannerDeleteModal`, `TagSelector`, icons/colorpicker, drawer panier public (`producto/productos`), placeholders. (Distinct de l'ES-dashboard intentionnel.) → C-10, C-41, C-61, C-68, C-69.
9. **a11y des modales/overlays.** `BlogClient` jette le `dialogRef` (focus-trap mort), `useModalA11y` re-piège à chaque render parent (vol de focus), drawer panier focusable quand fermé, `SearchOverlay` sans combobox/trap, méga-menus `role=menu` malformés. → C-14, C-40, C-36, C-37, C-38.
10. **`dangerouslySetInnerHTML` non assaini sur contenu admin.** Bannières (`title`+`link_url`), `BrandsTable` empty-state. Admin-only (donc P2), mais hors du pattern DOMPurify du blog. → C-54, C-63.
11. **Scripts cassés par dérive de schéma.** `seed-import` (image_url/product_ranges), `create-admin`/`make-admin` (profiles.is_admin), `check-products` (anon + ESM/require), CSV multi-ligne. → C-16, C-17, C-120.
12. **Tests/CI fragiles.** admin-smoke cassé, e2e écrit en prod, `cleanupStaleTestUsers` mort, `npm run test` lance 5 navigateurs, flux sécu (super_admin/mass-assignment/XSS/merge A→B) non couverts. → C-18, C-19, C-124, C-125, C-126, C-127.
13. **Contraste dark mode WCAG.** CTA `clay-700`, `clay-800/900` invisibles, `ink-400` (54 %) et `ink-500` (66 %, 415 usages) sous AA sur plusieurs thèmes ; `bg-white` littéraux hors thème. → C-15, C-104, C-105, C-103.
14. **RLS = défense unique.** Grants TABLE `arwdDxtm` à anon/authenticated sur toutes les tables ; `REVOKE` default-ACL `supabase_admin` incomplet ; 2 vues SECURITY DEFINER ; 2 buckets listables ; leaked-password off. **Non exploitable aujourd'hui** (policies tiennent) mais fragile. → C-22, C-93, C-96, C-32.
15. **SEO transverse.** hreflang mensonger (blog + legal), pages auth indexables sans noindex, `robots:/account/` inopérant (locale), pas de Twitter Card / OG par défaut, JSON-LD FAQPage/LocalBusiness manquants, sitemap dynamique sans `x-default`. → C-12, C-46, C-47, C-48, C-49, C-50.
16. **Dérive de doc.** CLAUDE.md (22 routes→28, 1 admin→2, 0 posts→4, « SSG »→ISR, vitest 8/8→19), `database.types.ts` (`mark_message_as_read`), `db/schema.sql` (2 objets), doc IDOR (migration « non appliquée » alors qu'appliquée). → C-130, C-206.

---

## Ce qui est sain / bien construit (calibrage positif)

L'audit confirme un socle de qualité réelle — à ne pas casser en corrigeant le reste :

- **Authz exhaustive et correcte.** 100 % des routes `/api/admin/*` (28) gardées par `requireAdmin`/`requireSuperAdmin` (scan ligne par ligne) ; CSRF Origin centralisée même sur GET ; `getUser()` (JWT validé) sur middleware/requireAdmin ; garde-fous super-admin (anti-auto-modification, anti-modification d'un autre super_admin) **côté serveur**, pas seulement UI. (WS20, WS21, WS23)
- **RLS solide en pratique.** RLS active sur 27/27 tables ; tables service-role-only en deny-all correct ; `search_path` figé sur toutes les fonctions ; GRANT EXECUTE des RPC panier/messages resserré à `service_role` ; `is_user_admin` correctement laissée à anon (documenté). Modèle cart **sans IDOR par construction** (identité 100 % dérivée serveur, RPC service-role-only, jamais de `cart_id` client). (WS24, WS22)
- **XSS réellement mitigé.** Blog : Tiptap (pas de HTML brut) + `isomorphic-dompurify` au rendu + upload **magic-bytes** + chemin serveur `crypto.randomUUID()`. Recherche `ilike` échappée. Rate-limit IP non-spoofable sur Vercel (finding historique levé). CSP **sans `unsafe-eval`** (hash SHA-256 du script anti-flash). (WS25, WS26, WS19)
- **i18n exemplaire.** 1703 clés-feuilles strictement à parité FR/ES/EN (0 manquante, 0 type/placeholder divergent, 0 doublon). Résolution duale URL/cookie sûre. (WS30)
- **Système de thème : pièges maîtrisés.** Le piège « thème imbriqué » est correctement géré (mappings `--color-*` dans `[data-theme]`, vérifié dans le CSS compilé) ; anti-flash + hash CSP propre ; le piège `position:fixed` sous `backdrop-filter` est respecté (overlays hors `<header>`) ; toutes les teintes utilisées sont déclarées (0 élément invisible). Les défauts thème = **contraste** (résoluble), pas l'architecture. (WS33, WS11, WS12)
- **Dashboard : isolation service-role exemplaire.** `_dashboard/data.ts` (`server-only`) consommé uniquement par le Server Component ; aucune donnée brute service-role ne franchit la frontière client ; agrégats typés en props ; `Promise.all` partout, `count head` pour les comptages. (WS13)
- **Snapshot pattern réservation propre.** `create_reservation` fige nom/prix/contact, n'accepte pas de `p_user_id` (auth.uid() interne), unicité « 1 réservation active » garantie en DB. Migrations idempotentes/replay-safe sur 35 fichiers. (WS34, WS27)
- **Migration RLS non commitée (C-24 du brief) : jugée saine.** `20260605120000` est en réalité **appliquée + committée** (`358adc0`), techniquement correcte, idempotente, ne casse rien. Sa valeur est modeste (les `WITH CHECK` sont des no-op car tout passe en service-role) mais le `REVOKE` est un durcissement prospectif valable. L'auto-critique du doc IDOR (P1-1 = faux positif) est exacte. (WS24)
- **Bonnes pratiques tests unitaires.** `safeRedirect`/`rateLimit`/`themeModeScript` testent les vrais vecteurs d'attaque ; discipline `data-testid` (0 selector orphelin). (WS37)

---

## Décisions humaines requises (non-code, bloquantes pour le contenu V1)

Ces points ne sont pas des bugs à coder mais des **arbitrages métier/juridiques** sans lesquels le contenu V1 reste faux :

1. **Vraies coordonnées de contact.** Quelle est l'adresse email officielle (clinique `skin@skinlacercenter.net` vs `contact@farmau.do`) ? Le domaine `skinlacercenter` est-il un **typo** de `skinlasercenter` ? Vrais horaires d'ouverture (4 versions en circulation, DB = `Lun-Vie 6h30-17h · Sáb 8h-16h`) ? Vrai `NEXT_PUBLIC_WHATSAPP_NUMBER` (à mettre sur Vercel). → conditionne C-06, C-07, C-52.
2. **Contenu placeholder à remplacer.** Noms d'équipe (`Dra. María Pérez`, `Andrés Reyes`, `Yarisa Tavárez` = fictifs), n° « Reg. Sanitario DGM-42-2014 », stat « **60+ marques** » (DB = **13**, contredisable en 2 clics via `/marques`), « 7 farmacéuticos / 12 ans » (non vérifiés), avis Google réels, adresse exacte Skin Laser Center. → WS06.
3. **Validation juriste du contenu légal RD.** CGV/confidentialité/mentions/cookies (Ley 172-13/358-05/126-02/65-00) portent déjà un disclaimer « à valider » ; les bases légales s'inspirent du RGPD. La traduction ES est « de travail ». → WS07.
4. **Décisions produit mineures à trancher.** Garder ou retirer les **badges de paiement** du footer (Visa/MC/PayPal/Azul) puisqu'il n'y a pas de paiement en ligne (C-44) ? Convention **DOP 0 vs 2 décimales** (C-27) ? Prix manuels libres en réservation admin = voulu (négociation walk-in) ou garde-fou manquant (C-74) ? Conserver la livraison pour le futur ou la retirer (C-05) ?

---

## Décisions intentionnelles confirmées OK (NE PAS traiter comme bugs)

Vérifiées dans le code et **non comptées comme défauts** (re-signalées seulement si régression de mise en œuvre) :

- **Pas de paiement en ligne / checkout = placeholder.** Stade catalogue + réservation. ✔
- **Click & collect uniquement** ; colonnes/tarifs `shipping_*` orphelins **connus**. (Le finding C-05 vise l'*écart* : le tunnel propose activement la livraison, contredisant cette décision — c'est une régression de la décision, pas une demande de re-câblage.) ✔
- **`is_user_admin` garde le GRANT EXECUTE à `anon`** — obligatoire (policies RLS publiques). ✔
- **Auth volontairement simple** : confirmation email désactivée, signup = auto-login, email éditable. ✔
- **« Un user, deux casquettes »** : `/account/*` réutilisé pour le profil admin (pas de `/admin/account`). ✔
- **Espagnol en dur dans `components/admin/dashboard/*` + `_dashboard/data.ts`** — seule surface admin hors i18n, intentionnel. (Distinct du module réservations C-10, qui lui n'est pas une exception et doit être traduit.) ✔
- **CSP `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN`** — requis pour l'iframe d'aperçu `/admin/annonce`. ✔
- **Pas de nonce CSP** (casserait le SSG) ; hash SHA-256 utilisé à la place. ✔
- **`db/catalog.json` versionné** — snapshot seed assumable (PDF sources gitignorés). ✔ (à acter dans la doc, C-206.)

---

## Recommandation d'orchestration de la remédiation

1. **Sprint pré-V1 (bloquant lancement)** : Top 12 ci-dessus + les 4 « recommandés aussi » + les 4 décisions humaines. Effort estimé : ~3-5 jours dev + arbitrages métier. Couvre l'essentiel des P1.
2. **Sprint post-V1 immédiat** : le reste des P1 a11y/perf non bloquants (C-14 si pas fait, C-23, C-79) + les P2 sécurité défense-en-profondeur (C-22 grants, C-93/C-96 advisors, C-29/C-30 getUser) + perf catalogue/dashboard.
3. **Backlog dette** : P2 i18n résiduels, P3 (code mort, clés orphelines, contraste fin, drift doc). Régénérer `database.types.ts` + `db/schema.sql` + rafraîchir CLAUDE.md.

> Le détail de chaque finding (constat/impact/reco/confiance, avec `fichier:ligne`) vit dans son rapport `WSxx-*.md` et est indexé dans `00-REGISTRE-CONSOLIDE.md`.
