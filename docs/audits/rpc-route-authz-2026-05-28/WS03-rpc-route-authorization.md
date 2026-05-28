# WS03 — Re-vérification authz RPC / Route (FARMAU)

**Date** : 2026-05-28 · **Scope** : SECURITY DEFINER RPC + route handlers `src/app/api/**` · **Mode** : READ-ONLY, sans MCP, corps RPC lus depuis `supabase/migrations/*` + `db/schema.sql`.
**Classe de bug chassée** : RPC SECURITY DEFINER (ou route service-role) qui FAIT CONFIANCE à un identifiant fourni par le client (`p_user_id` / `p_cart_id` / `p_anon_id` / `check_user_id` / `p_message_id`) au lieu de dériver l'identité de `auth.uid()` ou de la session serveur → bypass RLS / IDOR / vol de panier.

---

## Verdict

**L'audit 145-findings déclare cette surface fermée. La re-vérification trouve le contraire sur les RPC panier.**

- ✅ **Les routes sont solides.** Les 26 routes `/api/admin/*` appellent toutes `requireAdmin()` (getUser server-validé + lookup `admin_users`) avant toute opération DB. Les routes publiques dérivent l'identité côté serveur (`getUser()` / cookie httpOnly), jamais d'un champ du body. `/api/wishlist` et `/api/account/preferences` utilisent le client session + RLS (le bon pattern). `/api/cart/*` dérive correctement l'identité dans la route.
- ✅ **3 RPC sensibles sont correctement verrouillées** : `create_reservation`, `check_rate_limit`, `expire_stale_reservations` font `REVOKE … FROM PUBLIC, anon` + `GRANT … TO authenticated`/`service_role` + dérivent l'identité de `auth.uid()` en interne.
- ❌ **MAIS les RPC panier sont la faille.** `get_or_create_cart`, `add_to_cart` et surtout `remove_from_cart` sont `SECURITY DEFINER` (bypass RLS), **exécutables par `anon`** (clé anon publique → PostgREST `/rest/v1/rpc/*`), et **font confiance à une identité fournie par le client** :
  - `remove_from_cart(p_product_id, p_anon_id, p_user_id)` fait `v_user_id := COALESCE(p_user_id, auth.uid())` → **un `p_user_id` fourni par le client écrase l'identité de session** → suppression d'items dans le panier d'autrui (**F-RPC-1, P1**).
  - `get_or_create_cart(p_user_id, …)` retourne / crée le panier de n'importe quel `user_id` (**F-RPC-2, P1**).
  - `add_to_cart(p_cart_id, …, p_anon_id)` ne vérifie la propriété **que si `p_anon_id` est non-null** → écriture dans un panier arbitraire (**F-RPC-3, P2**).
- ❌ **Les protections de route ne sont pas une frontière de sécurité** pour les RPC `SECURITY DEFINER` exposées à `anon` : `create_contact_message` (rate-limit + CSRF + regex email dans la route) est appelable directement, contournant tout (**F-RPC-4, P2** — énumération de comptes + injection de messages usurpés).
- ⚠️ **Surface morte ouverte** : `mark_message_as_read` n'est appelée nulle part dans le code mais reste `SECURITY DEFINER` + `anon` + sans contrôle admin (**F-RPC-5, P2**).

**Cause racine commune** : le baseline `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;` (`baseline.sql:614`, ré-affirmé `db/schema.sql:1025`) ouvre **toutes** les fonctions à `anon`. Les RPC qui ne devraient être appelées que côté serveur (via service-role) ou que par `auth.uid()` n'ont pas reçu le `REVOKE FROM anon` que `create_reservation`/`check_rate_limit` ont reçu. Comme les RPC panier sont `SECURITY DEFINER`, elles **bypassent la RLS de `carts`/`cart_items`** (par ailleurs correcte), donc la RLS ne sert PAS de filet de sécurité ici.

**Correctif structurel recommandé** : `REVOKE EXECUTE … FROM PUBLIC, anon` sur `get_or_create_cart`, `add_to_cart`, `remove_from_cart`, `create_contact_message`, `get_messages_stats`, `mark_message_as_read`, puis `GRANT … TO service_role` pour celles appelées via `supabaseAdmin` (panier + messages) — la route dérive déjà l'identité correctement. `is_user_admin` peut être `REVOKE anon` + `GRANT authenticated`. Aligner ainsi sur le pattern déjà appliqué à `create_reservation`.

---

## Table maître

Légende canal auth : **SR** = service-role (`supabaseAdmin`, bypass RLS) · **SS** = session/SSR (`createSupabaseServerClient`, anon key + JWT user) · **MW** = middleware. Légende « anon exécute ? » : provabilité depuis code (baseline GRANT / PG default PUBLIC / db/schema.sql).

### RPC

| RPC | Call-site(s) | Params client-supplied | Canal | Modèle attendu | Corps dérive `auth.uid()` / vérifie propriété ? | anon exécute ? | Risque | Statut |
|---|---|---|---|---|---|---|---|---|
| `remove_from_cart(p_product_id,p_anon_id,p_user_id)` | `api/cart/route.ts:266` | `p_user_id`, `p_anon_id`, `p_product_id` | SR | identité = session | ❌ `COALESCE(p_user_id, auth.uid())` — client gagne (`mig 20260523111500:16`) | **oui** (PG default PUBLIC sur l'overload 3-arg; schema.sql:1025) | **IDOR destructif** : vider le panier d'autrui | **F-RPC-1 · P1 · confirmed** |
| `get_or_create_cart(p_user_id,p_anonymous_id)` | `api/cart/route.ts:56,202` | les 2 params | SR | identité = session | ❌ aucun check, SELECT/INSERT sur l'id fourni (`baseline:331-352`) | **oui** (baseline GRANT) | fuite/appropriation du `cart_id` d'autrui + création de carts junk | **F-RPC-2 · P1 · confirmed** |
| `add_to_cart(p_cart_id,p_product_id,p_quantity,p_anon_id)` | `api/cart/route.ts:214` | tous | SR | propriété du cart vérifiée | ⚠️ check **seulement si `p_anon_id` non-null** (`mig 20260519092026:17-22`) | **oui** (baseline GRANT) | écriture dans un `cart_id` arbitraire (griefing) | **F-RPC-3 · P2 · confirmed** |
| `create_contact_message(p_email,p_subject,p_message)` | `api/contact/route.ts:65` (SR + rate-limit + CSRF) | `p_email` (sender) | SR | message lié à l'appelant ; protections route effectives | ❌ insère pour tout email existant ; route by-passable en appel direct (`baseline:425-447`) | **oui** (baseline GRANT) | énumération de comptes + injection de messages usurpés, sans rate-limit en direct | **F-RPC-4 · P2 · confirmed** |
| `mark_message_as_read(p_message_id)` | **aucun** (`database.types.ts:969` seul) | `p_message_id` | — | admin-only | ❌ UPDATE sans check admin/propriété (`baseline:450-458`) | **oui** (baseline GRANT) | tamper du triage admin (marquer lu n'importe quel message) | **F-RPC-5 · P2 · confirmed** |
| `get_messages_stats()` | `api/admin/messages/route.ts:38` (SR, requireAdmin) | — | SR | admin-only | n/a (agrégat global) | **oui** (baseline GRANT) | fuite des compteurs de messages (total/unread/today) | **F-RPC-6 · P3 · confirmed** |
| `is_user_admin(check_user_id)` | `middleware.ts:106`, `auth/callback:66`, `login:85`, `useIsAdmin:56` | `check_user_id` | MW/SS | id dérivé session | ✅ gating correct : tous passent `user.id` issu de `getUser()` (`middleware:88,106`) | **oui** (baseline GRANT) | la fonction OK ; mais anon peut sonder « tel UUID est-il admin ? » (énumération) | **F-RPC-7 · P3 · confirmed** |
| `merge_anon_cart_to_user(p_anon_id)` | `api/cart/merge/route.ts:23` (SS, cookie httpOnly) | `p_anon_id` | SS | anon_id = cookie de l'appelant | ✅ `v_user_id:=auth.uid()` ; ⚠️ mais `p_anon_id` non lié au caller (`mig 20260523095131:17,25-27`) | authenticated (GRANT explicite) | vol d'un panier anon **connu** (UUID secret requis) | **F-RPC-8 · P2 · suspected** |
| `create_reservation(p_cart_id)` | `api/cart/reserve/route.ts:74` (SS) | `p_cart_id` | SS | `auth.uid()` + propriété cart | ✅ `auth.uid()` interne + `WHERE id=p_cart_id AND user_id=v_user_id` (`mig …183407:25,75-81`) | **non** (`REVOKE … FROM PUBLIC,anon` :130) | — | **OK · confirmed** |
| `check_rate_limit(p_key,p_max,p_window)` | `lib/rateLimit.ts:26` (SR) | clé (dérivée IP serveur) | SR | service-role only | n/a | **non** (`REVOKE …` :58, `GRANT service_role` :59) | — (fail-open documenté) | **OK · confirmed** |
| `expire_stale_reservations()` | pg_cron (`mig …184500`) | — | cron | service-role only | filtre `expires_at < now` | **non** (`REVOKE …` :34, `GRANT service_role` :35) | — | **OK · confirmed** |
| `reorder_banners(banner_id,old,new)` | `api/admin/banners/route.ts:132` (SR, requireAdmin) | positions | SR | admin-only | ⚠️ **SECURITY INVOKER** (pas DEFINER) → UPDATE soumis à RLS banners | oui (baseline) mais inoffensif | appel direct anon ⇒ 0 ligne (RLS « Admin manage banners ») | **OK (RLS) · confirmed** |
| `cleanup_banner_positions()` | aucun dans `src/` | — | — | admin-only | ⚠️ INVOKER → RLS banners | oui mais inoffensif | idem reorder | **OK (RLS) · confirmed** |
| `update_updated_at_column()` | triggers BEFORE UPDATE | — | trigger | — | n/a | n/a | — | **OK · confirmed** |
| `handle_new_user()` | trigger `auth.users` INSERT | — | trigger | — | `NEW.id` | n/a | — | **OK · confirmed** |

### Routes

| Route | Méthodes | Garde auth | Canal | Identité dérivée de… | Risque | Statut |
|---|---|---|---|---|---|---|
| `api/cart` | GET/POST/DELETE | aucune (publique) | SR | `getUser()` + cookie httpOnly `cart_id` (`route.ts:13-34`) | route OK ; **exposition via RPC directe** (F-RPC-1/2/3) | route OK · RPC KO |
| `api/cart/reserve` | POST | session | SS | `getSession()` + `auth.uid()` côté RPC | ✅ | OK |
| `api/cart/merge` | POST | `getUser` + cookie | SS | cookie httpOnly `cart_id` (`route.ts:8`) | résiduel F-RPC-8 (appel RPC direct) | OK (route) |
| `api/contact` | POST/GET | POST: CSRF+rate-limit ; GET: Bearer+RLS | SR/token | GET: RLS « Users view own » (`baseline:584`) | POST → F-RPC-4 ; GET ✅ | mixte |
| `api/newsletter` | POST/GET/DELETE | POST: CSRF+rate-limit ; GET/DELETE: `getUser` | SR/SS | session pour GET/DELETE | abonner un email tiers (spam, double opt-in atténue) | P3 |
| `api/newsletter/confirm` | GET | rate-limit 10/min | SR | token aléatoire 32o + TTL + UPDATE atomique (`route.ts:25-35`) | ✅ | OK |
| `api/search` | GET | aucune (publique) | SS | n/a (lecture) ; `.ilike` **paramétré** (pas de SQLi) ; RLS products active | ✅ | OK |
| `api/wishlist` | GET/POST | `getUser` | SS | `user.id` + RLS « own » | ✅ (pattern modèle) | OK |
| `api/account/preferences` | PATCH | `getUser` | SS | `.eq('id', user.id)` + RLS | ✅ | OK |
| `api/admin/*` (26 routes) | GET/POST/PATCH/PUT/DELETE | **`requireAdmin()` sur chaque handler** | SR | `getUser()` (JWT validé) + `admin_users` (`requireAdmin.ts:31,59`) | ✅ (gating uniforme) | OK |
| `api/admin/users/[id]` | PATCH | requireAdmin + Zod | SR | garde-fou self-demote (`route.ts:44-46`) | ✅ (pas d'auto-escalade) | OK |
| `api/admin/upload` | POST/DELETE | requireAdmin + Zod | SR | `fileName`/`contentType` client + `upsert:true` | F-ROUTE-2 (admin-only) | P3 |
| `auth/callback` | page client | — | SS | check `is_user_admin` cosmétique ; gate réel = middleware | ✅ | OK |

---

## Findings détaillés

### F-RPC-1 · P1 · `remove_from_cart` : `p_user_id` client écrase l'identité de session — IDOR destructif
**Preuve.**
- Corps (dernière def) `supabase/migrations/20260523111500_remove_from_cart_explicit_user_id.sql:5-26` :
  ```sql
  v_user_id uuid := COALESCE(p_user_id, auth.uid());   -- ligne 16
  DELETE FROM public.cart_items WHERE product_id = p_product_id
    AND cart_id IN (SELECT id FROM public.carts
      WHERE (p_anon_id IS NOT NULL AND anonymous_id = p_anon_id)
         OR (v_user_id IS NOT NULL AND user_id = v_user_id));
  ```
  `SECURITY DEFINER` → bypasse la RLS de `cart_items`/`carts`. L'overload 2-arg a été droppé (`mig 20260523112000:4`) ; seule la 3-arg subsiste.
- Call-site légitime `src/app/api/cart/route.ts:266-270` : la route passe `p_user_id: userId` dérivé de `getUser()` — **la route est correcte**.
- Exposition : l'overload 3-arg a été créé **après** le baseline sans `REVOKE`/`GRANT` explicite → EXECUTE par défaut à `PUBLIC` (comportement Postgres) ; `db/schema.sql:1025` ré-affirme `GRANT EXECUTE ON ALL FUNCTIONS … TO anon`. La clé `NEXT_PUBLIC_SUPABASE_ANON_KEY` est publique → un attaquant appelle directement `POST /rest/v1/rpc/remove_from_cart` avec `{p_product_id, p_user_id:<victime>}`.

**Impact.** `v_user_id = p_user_id` (victime) ⇒ suppression d'un produit du panier de la victime. Pas de PII, pas d'escalade ; impact = altération de données / griefing. Précondition : connaître l'`auth.users.id` (UUID) de la victime — non énuméré par une surface publique (profiles RLS = own), ce qui limite l'exploitation de masse mais reste de la sécurité par obscurité sur une frontière d'autorisation.

**Reco.** `REVOKE EXECUTE ON FUNCTION public.remove_from_cart(uuid,uuid,uuid) FROM PUBLIC, anon;` + `GRANT … TO service_role;` (la route l'appelle en service-role). Supprimer le paramètre `p_user_id` du contrat client n'est pas suffisant tant que `anon` peut exécuter. **Effort : S** (1 migration).

### F-RPC-2 · P1 · `get_or_create_cart` : identité 100 % client, anon-exécutable
**Preuve.** `00000000000000_baseline.sql:331-352` (`db/schema.sql:754-775`) — la fonction `SELECT … WHERE user_id = p_user_id` puis, si absent, `INSERT … VALUES (p_user_id, p_anonymous_id) RETURNING id`. Aucune référence à `auth.uid()`. `SECURITY DEFINER`. GRANT baseline `TO anon, authenticated` (`baseline:614`). Call-sites légitimes `api/cart/route.ts:56,202` (params dérivés serveur — OK).

**Impact.** Appel direct `get_or_create_cart(p_user_id:<victime>)` → retourne le `cart_id` existant de la victime (fuite) **et** débloque F-RPC-3 (on connaît alors le `cart_id` cible). Variante : appels en boucle avec UUID aléatoires → insertion de lignes `carts` junk (pollution / DoS léger).

**Reco.** `REVOKE … FROM PUBLIC, anon` + `GRANT … TO service_role`. **Effort : S.**

### F-RPC-3 · P2 · `add_to_cart` : check de propriété optionnel (sauté si `p_anon_id` NULL)
**Preuve.** `supabase/migrations/20260519092026_fix_add_to_cart_increment.sql:17-22` :
```sql
IF p_anon_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.carts WHERE id = p_cart_id AND anonymous_id = p_anon_id
) THEN RAISE EXCEPTION 'Panier non autorisé'; END IF;
```
Le check ne s'exécute **que** si `p_anon_id` est non-null. `SECURITY DEFINER`, GRANT anon (baseline). En appel direct avec `p_anon_id:null` + `p_cart_id:<victime>`, l'INSERT passe sans vérification.

**Impact.** Écriture dans un panier arbitraire (ajout/incrément d'items) → griefing. Précondition : connaître le `carts.id` cible (fourni par F-RPC-2). Write-only, pas de lecture de données d'autrui.

**Reco.** `REVOKE … FROM PUBLIC, anon` + `GRANT … TO service_role` ; idéalement rendre le check de propriété inconditionnel. **Effort : S.**

### F-RPC-4 · P2 · `create_contact_message` : route by-passable → énumération de comptes + messages usurpés
**Preuve.** Corps `baseline.sql:425-447` : `SELECT id INTO v_user_id FROM auth.users WHERE email = p_email; IF v_user_id IS NULL THEN RETURN … 'Email non trouvé. Vous devez avoir un compte' …`. `SECURITY DEFINER`, GRANT anon (baseline). La route `api/contact/route.ts` enveloppe l'appel de `checkOrigin` (`:12`) + `checkRateLimit(5/60)` (`:17`) + regex email (`:53`) **et renvoie le message d'erreur de la RPC au client** (`:95`). Mais ces protections vivent dans la route ; l'appel direct `POST /rest/v1/rpc/create_contact_message` les contourne entièrement.

**Impact.** (1) **Énumération de comptes** : réponse différenciée existe/n'existe pas, sans rate-limit en direct. (2) **Injection de messages usurpés** : `p_email` arbitraire ⇒ message attribué à n'importe quel email enregistré (l'admin voit un message « de » la victime). (3) write-amplification sur `contact_messages`.
Note : `checkOrigin` (`lib/csrf.ts:20-31`) renvoie `null` (passe) en l'absence de header `Origin` → ne protège que le cross-site navigateur, pas les scripts.

**Reco.** `REVOKE … FROM PUBLIC, anon` + `GRANT … TO service_role` (la route l'appelle déjà en service-role). Optionnel : ne pas renvoyer la distinction « email non trouvé » au client. **Effort : S.**

### F-RPC-5 · P2 · `mark_message_as_read` : RPC morte, anon-exécutable, sans contrôle
**Preuve.** Corps `baseline.sql:450-458` : `UPDATE public.contact_messages SET status='read' … WHERE id = p_message_id;` — aucun check admin/propriété. `SECURITY DEFINER`, GRANT anon (baseline). **Aucun call-site** dans `src/` (uniquement `database.types.ts:969`) — l'admin marque « lu » via `.update()` service-role (`api/admin/messages/route.ts:88`).

**Impact.** Tout `anon` peut marquer « read » n'importe quel `contact_message` (UUID) → sabotage du triage admin (messages non lus masqués). Pas de fuite de contenu.

**Reco.** Comme elle est inutilisée : `DROP FUNCTION public.mark_message_as_read(uuid);` (ou à défaut `REVOKE … FROM PUBLIC, anon`). **Effort : S.**

### F-RPC-6 · P3 · `get_messages_stats` : fuite de compteurs
**Preuve.** `baseline.sql:461-478`, agrégat global sur `contact_messages`. `SECURITY DEFINER`, GRANT anon. Call-site admin gardé (`api/admin/messages/route.ts:38`) mais RPC directe ouverte à anon.
**Impact.** Divulgation des volumes de messages (total/unread/today/this_week). Faible.
**Reco.** `REVOKE … FROM PUBLIC, anon` + `GRANT … TO service_role`. **Effort : S.**

### F-RPC-7 · P3 · `is_user_admin` : sonde d'admin (gating par ailleurs sain)
**Preuve.** `baseline.sql:277-282` : `SELECT EXISTS(SELECT 1 FROM admin_users WHERE user_id = check_user_id)`. GRANT anon (baseline). **Tous les call-sites de gating passent un id dérivé de session** : `middleware.ts:106` (`user.id` de `getUser()` `:88`), `auth/callback:66`, `login:85`, `useIsAdmin:56` (checks client = cosmétiques ; le gate serveur middleware/`requireAdmin` est autoritatif). Un attaquant ne peut pas se faire passer pour un autre `user.id` (il faudrait la session de la cible).
**Impact.** Énumération : `anon` peut tester « tel UUID est-il admin ? ». Aucune escalade.
**Reco.** `REVOKE anon` + `GRANT authenticated` (le middleware tourne en rôle authenticated quand un user est connecté). **Effort : S.**

### F-RPC-8 · P2 · `merge_anon_cart_to_user` : `p_anon_id` non lié à l'appelant — vol de panier anon
**Preuve.** `supabase/migrations/20260523095131_merge_anon_cart_to_user_rpc.sql:10-54` : `v_user_id := auth.uid()` (`:17`, bon) mais `SELECT id … FROM carts WHERE anonymous_id = p_anon_id AND user_id IS NULL` (`:25-27`) puis merge dans le cart du caller + `DELETE` du cart anon. `p_anon_id` est arbitraire. GRANT `authenticated`. Call-site `api/cart/merge/route.ts:23` lit `p_anon_id` du cookie httpOnly **côté serveur** (`:8`) — la route est correcte, mais un attaquant authentifié appelle la RPC directement (grant authenticated) avec un `p_anon_id` choisi, ou forge le cookie `cart_id` (httpOnly n'empêche pas la fabrication d'une requête).
**Impact.** Un utilisateur connecté absorbe (et détruit) le panier anonyme d'une victime **dont il connaît l'`anonymous_id`** (UUID secret en cookie). Précondition forte ⇒ exploitation étroite. Inhérent au merge cross-session (impossible de lier un anon_id au caller). 
**Reco.** Accepter le modèle « secret de l'anon_id » mais le documenter ; éventuellement exiger que le cart anon ait été créé récemment / limiter le merge à un anon_id transmis par le serveur. Pas de fix DB simple. **Effort : M (design).**

### F-ROUTE-1 · P3 · RLS `contact_messages` « Insert valid email » trop large
**Preuve.** `baseline.sql:588-590` : `FOR INSERT WITH CHECK (user_email IN (SELECT email FROM auth.users))`. Le rôle `authenticated` a `GRANT ALL ON ALL TABLES` (`baseline:612`) → un user connecté peut `INSERT` directement un `contact_message` avec **n'importe quel** email enregistré (pas forcément le sien) → usurpation parallèle à F-RPC-4. (`anon` n'a que `GRANT SELECT` → bloqué côté grant.)
**Reco.** Resserrer : `WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))`. **Effort : S.**

### F-ROUTE-2 · P3 · `/api/admin/upload` : `fileName`/`contentType` client + `upsert:true` (admin-only)
**Preuve.** `api/admin/upload/route.ts:21-26` — `uploadBody` (`lib/schemas.ts:148-152`) valide la présence mais **pas** le charset du `fileName` ni un allowlist de `contentType` ; `.upload(fileName, …, { upsert:true })`. Bucket `product-image` est en lecture publique (`baseline:600`).
**Impact.** Un admin (compromis ou malveillant) peut écraser des objets existants (path arbitraire) ou stocker un fichier au `contentType` trompeur servi depuis une URL publique (XSS stocké potentiel via SVG/HTML). Admin-gated ⇒ faible.
**Reco.** Générer le nom serveur (uuid + ext validée), allowlist `contentType` (`image/png|jpeg|webp`), `upsert:false` sauf besoin. **Effort : S.**

### Observation systémique (cause racine)
`baseline.sql:610-615` ouvre largement à `anon`/`authenticated` : `GRANT SELECT ON ALL TABLES … TO anon` (`:611`), `GRANT ALL ON ALL TABLES … TO authenticated` (`:612`), `GRANT EXECUTE ON ALL FUNCTIONS … TO anon, authenticated` (`:614`). La RLS rattrape l'accès **table** (toutes les tables ont RLS activée — vérifié : `carts:156`, `cart_items:167`, `contact_messages:241`, + tables tardives `reservations`/`reservation_items`/`wishlists`/`shop_settings`/`posts`/`newsletter_subscribers`/`rate_limit_buckets` ; `newsletter_subscribers` & `rate_limit_buckets` = RLS ON sans policy = service-role only ✅). **Mais la RLS ne rattrape PAS l'accès fonction** : une RPC `SECURITY DEFINER` bypasse la RLS, donc tout ce qui compte est (a) le GRANT EXECUTE et (b) les checks internes. Le projet a correctement durci 3 RPC (`create_reservation`, `check_rate_limit`, `expire_stale_reservations`) mais a laissé les RPC panier + messages sur le GRANT large + checks faibles. **Le durcissement doit être étendu** aux 6 RPC listées (F-RPC-1→6).

---

## À confirmer en DB live (corps / GRANT / SECURITY DEFINER ambigus depuis le code)

1. **GRANT EXECUTE réel sur `remove_from_cart(uuid,uuid,uuid)`** (overload 3-arg, `mig 20260523111500`) : aucun `GRANT`/`REVOKE` explicite dans la migration → repose sur le default Postgres `EXECUTE TO PUBLIC`. `db/schema.sql:1025` (snapshot) ré-affirme `… TO anon`. Confirmer `SELECT proname, proacl FROM pg_proc WHERE proname='remove_from_cart'` qu'`anon`/`PUBLIC` a bien EXECUTE et qu'aucun `REVOKE` hors-repo n'existe.
2. **`merge_anon_cart_to_user`** : `GRANT … TO authenticated` explicite (`mig …095131:56`) mais pas de `REVOKE … FROM PUBLIC` → vérifier si `PUBLIC` conserve aussi le default EXECUTE (sans impact réel car corps exige `auth.uid()`, mais à clarifier).
3. **Persistance du GRANT baseline** sur `is_user_admin`, `get_or_create_cart`, `add_to_cart`, `create_contact_message`, `mark_message_as_read`, `get_messages_stats` : confirmer que `anon` détient toujours EXECUTE en prod (provable depuis baseline + schema.sql, mais un `REVOKE` manuel hors-repo invaliderait F-RPC-2→7).
4. **`ALTER DEFAULT PRIVILEGES`** éventuel en prod (non présent dans `supabase/migrations/`) qui modifierait les grants par défaut des fonctions.
5. **Buckets storage** : `db`/migrations montrent `product-image` & `brand-fiche` en `FOR SELECT TO public` (`baseline:600,604`) ; confirmer le flag `public` des buckets et l'absence de policy d'écriture trop large (flag advisor mentionné dans CLAUDE.md).
6. **`reorder_banners`/`cleanup_banner_positions`** : confirmées `SECURITY INVOKER` depuis le code (pas de `SECURITY DEFINER` au baseline:391-422) → protégées par RLS banners. Vérifier qu'aucune migration ne les a passées en DEFINER.
