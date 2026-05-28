# Verdict V1 — FARMAU (re-vérification pré-lancement)

**Date** : 2026-05-28 · **Branche** : `main` · **Décision** : **NO-GO en l'état → GO conditionné**
Base : `00-REGISTRE-CONSOLIDE.md` + 18 rapports WS + recoupement DB live (MCP read-only).

---

## 1. Décision

> **NO-GO immédiat.** Le projet est **proche** d'un lancement mais 3 conditions bloquantes restent ouvertes. Aucune n'est lourde : avec un sprint court (estimé **2–4 j**), la V1 passe en **GO**.

Ce n'est **pas** un « 0 finding sécurité » comme l'affirmait l'audit historique : la re-vérification **confirme en DB live** la classe IDOR RPC (advisor Supabase à l'appui) et découvre des écarts neufs (grants DML larges, bug panier, SSG inexistant, contraste AA, légal FR-only).

Rien de catastrophique non plus : **pas de fuite PII de masse, pas de flux d'argent, pas de perte de données serveur**. Les bloquants sont de la correction ciblée, pas de la refonte.

---

## 2. Bloquants P0 (à fermer AVANT lancement)

| # | Bloquant | Pourquoi P0 | Effort | Réf |
|---|---|---|---|---|
| **P0-1** | **Bug panier** : modifier la quantité **incrémente** au lieu de remplacer → panier corrompu (flow réservation cassé) + masqué par un test en faux positif. | Flow critique cassé. | **M** | WS09-01, WS13-01, WS15-01 |
| **P0-2a** | **Liens de consentement signup cassés** (`/cgv`, `/confidentialite` → 404). | Consentement vicié + lien mort à la création de compte. | **S (2 lignes)** | WS06-01 |
| **P0-2b** | **Pages légales FR-only** sur marché RD hispanophone (UI ES/EN). | Non-conformité consommateur Ley 358-05 / 172-13. | **M (trad ES + juriste)** | WS06-02 |

---

## 3. P1 à traiter dans le sprint de lancement (recommandé avant, sinon J+7)

**Sécurité (1 migration ferme l'essentiel)**
1. **Durcir les RPC** : `REVOKE EXECUTE … FROM PUBLIC, anon` + `GRANT … TO service_role` sur `get_or_create_cart`, `add_to_cart`, `remove_from_cart`(3-arg), `create_contact_message`, `get_messages_stats`, `mark_message_as_read` (puis `DROP` celle-ci, morte) ; `is_user_admin` → `REVOKE anon` + `GRANT authenticated` ; `handle_new_user` → `REVOKE` (trigger-only). Aligne sur `create_reservation` déjà durcie. **[P1-SEC-1/3, DB-2]** — *migration à appliquer par l'utilisateur.*
2. **Grants table** : retirer INSERT/UPDATE/DELETE à `anon` (et resserrer `authenticated`) là où seul le service-role écrit, ou acter formellement « RLS-only » + audit de chaque policy. **[DB-4, P1-SEC-2]**
3. **CSP `frame-src`** : ajouter `maps.google.com` (sinon cartes Maps cassées en prod sur /contact + /pharmacie) ; ajouter **HSTS** ; retirer `unsafe-eval`. **[WS08-01/03/07]**

**Correction prod visible**
4. **`/favicon.ico`** : remplacer le favicon Next.js par défaut (sinon logo Next en onglet/SERP). **[WS16-01]**
5. **Contraste AA** : corriger l'ancre `ink-500` (échoue 4.5:1 en mode clair, 344 usages). **[WS11-01]**
6. **Fuite favoris** : purger le cache SWR `/api/wishlist` au login/logout. **[WS13-02]**
7. **Mode sombre** : verrouiller `default_mode=light` + `allow_visitor_mode=false` en DB jusqu'à la passe sombre (surfaces `bg-white` + hero hors-thème + statuts). **[WS10, WS11]**

**Réservation / produit**
8. **Livraison** : trancher — persister adresse/zone/frais dans `reservations` **ou** retirer l'option livraison (pickup-only). Aujourd'hui l'admin ne voit ni mode ni adresse, `total_price` ≠ total client. **[WS04-01]**
9. **Affichage prix** : unifier sur `formatPrice` (catalogue/PDP/search en `.toFixed()` brut) + afficher promo/old_price sur le PDP. **[WS09-03/04]**

**Email / conformité**
10. Rate-limit newsletter **par email cible** + IP fiable (anti subscription-bombing) ; lien de **désinscription**/`List-Unsubscribe`. **[WS07-01, P1-PII-2]**
11. Mentions légales : remplir l'identité éditeur (RNC, capital, repr.) ; mécanisme d'accès/suppression compte (Ley 172-13). **[WS06-03/05]**

**Observabilité / tests**
12. `/api/health` + alerting Vercel (recommandé : `@sentry/nextjs` + `global-error.tsx`) ; `/api/contact` GET → message générique. **[WS14-01/02]**
13. Tests : couvrir le bug panier **après** correction (régression) ; secrets Supabase en CI (sinon e2e = fausse couverture) ; activer leaked-password protection. **[WS15, DB-3]**

---

## 4. Calibrage des sévérités contestées

- **SSG inexistant / tout-dynamic** (WS12 proposait P0) → **P1**. Le site fonctionne ; c'est un coût compute/DB + latence sous charge, pas un flow cassé. À corriger pour la tenue en charge (répliquer le pattern `getThemeConfig` au `Footer`/`getShopSettings`, sortir `getLocale()` du root). Le **système de thèmes est innocenté**.
- **IDOR RPC panier** (WS02/advisor) → **P1** malgré la confirmation DB live : exploitation conditionnée à la connaissance d'un UUID victime non énuméré publiquement. Mais fix trivial (1 migration) → **à faire avant launch**.
- **WS06-01 liens consentement** → **P0** : trivial mais à la création de compte, donc bloquant correctness + consentement.

---

## 5. Ordre de remédiation recommandé

1. **Jour 1 (S, rapide)** : WS06-01 liens (2 lignes) · favicon · CSP Maps+HSTS · `ink-500` contraste · purge SWR favoris · `default_mode=light` en DB · `/api/contact` GET générique.
2. **Jour 1–2 (1 migration SQL — appliquée par l'utilisateur)** : durcissement RPC + grants + `DROP mark_message_as_read` + leaked-password ON. Re-jouer `get_advisors(security)` pour vérifier 0 `anon_security_definer_function_executable`.
3. **Jour 2–3 (M)** : bug panier (`set_cart_quantity` vs `add_to_cart`) + test de non-régression · décision livraison réservation · unification prix `formatPrice` + promo PDP.
4. **Jour 3–4 (contenu/juridique)** : traduction ES (+EN) des 4 pages légales + relecture juriste RD · identité éditeur · désinscription newsletter.
5. **Post-launch (J+7+)** : SSG/perf, monitoring Sentry, passe mode sombre complète, tests libs pures + flux non couverts, JSON-LD LocalBusiness, hygiène deps (happy-dom, react-icons, dotenv, engines.node), nettoyage dead-code (après vérif 0-réf indépendante).

---

## 6. Critères de sortie (Definition of Done V1)

- [ ] **P0-1** : changer la quantité d'une ligne panier met la valeur exacte en DB (vérifié par test corrigé, non-flaky).
- [ ] **P0-2a** : les liens de consentement au signup pointent vers `/legal/cgv` + `/legal/confidentialite` (200).
- [ ] **P0-2b** : CGV + politique de confidentialité disponibles en ES (a minima), relues par un juriste RD.
- [ ] `get_advisors(security)` ne remonte **plus aucun** `anon_security_definer_function_executable` sur les RPC panier/messages.
- [ ] Cartes Google Maps s'affichent en prod (CSP) ; HSTS présent ; favicon FARMAU servi.
- [ ] Contraste AA ≥ 4.5:1 sur le texte courant en mode clair (palette par défaut Terra) ; `default_mode=light` + `allow_visitor_mode=false` en DB.
- [ ] Pas de fuite de favoris entre comptes sur un même navigateur (test manuel login A → logout → login B).
- [ ] Décision livraison tranchée et cohérente (ce que voit le client = ce que voit l'admin).
- [ ] `/api/health` répond ; alerting Vercel actif ; aucune `error.message` PG renvoyée à un client.
- [ ] Build prod OK, CI verte avec secrets réels (e2e non placebo).

---

## 7. Ce qui est déjà solide (ne pas régresser)

Secrets cloisonnés · auth `getUser()` + 26 routes admin gardées · `create_reservation` sûre + 0 flux argent · double opt-in cryptographiquement correct · parité i18n 1466×3 · tsc/ESLint/any/console à 0 · 0 `<img>` brut · pas de Realtime · SEO technique (hreflang/canonical/JSON-LD/sitemap) complet · cron d'expiration actif.

---

## 8. Limites de cet audit

- **Lecture seule** : aucune correction appliquée ; migrations à appliquer par l'utilisateur.
- **DB live** recoupée en read-only (grants RPC, advisors, cron, colonnes, vues, triggers) — les points sécu majeurs sont donc **confirmés**, pas seulement suspectés.
- **Non exercé dynamiquement** : pas de dev server ni navigateur (contraste/mode sombre calculés sur les tokens ; flux email double opt-in non envoyé). Web Vitals non mesurés en réel.
- **Juridique** : les findings de conformité RD sont à valider par un juriste local (les agents ne sont pas avocats).
- Reste à nettoyer : dossier vide `.audit-tmp/` à la racine (créé par un agent, `rmdir` bloqué par la deny-list) → `rmdir .audit-tmp`.
