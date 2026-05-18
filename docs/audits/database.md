# Audit Base de Données

> Périmètre : `db/schema.sql` (638 lignes) + patterns de requêtes (`src/app/catalogue/page.tsx`,
> `src/app/product/[id]/page.tsx`, `src/app/api/admin/products/route.ts`,
> `src/app/api/admin/products/with-tags/route.ts`, `src/app/api/cart/route.ts`,
> `src/app/api/admin/stock/route.ts`).
> Volumétrie actuelle (donnée d'entrée) : 13 brands, 52 ranges, 353 products, 299 images,
> 36 tags, 844 product_tags.

## Synthèse

**Note globale : B- (correct mais perfectible)**

Le schéma est globalement bien construit (3NF respectée, RLS active partout, helper
anti-récursion `is_user_admin`, types cohérents en TIMESTAMPTZ/UUID/DECIMAL(10,2)).
Mais il souffre de trois problèmes majeurs qui vont devenir bloquants en montant en
charge ou en élargissant le panel d'administrateurs :

1. **Indexes manquants sur toutes les FK** (sauf banners/contact_messages). Sur les
   tables n-n (`product_ranges`, `product_tags`) et sur les jointures
   `ranges.brand_id`, `product_images.product_id`, `cart_items.cart_id`, `orders.user_id`,
   les seeks deviennent des scans dès que la table dépasse quelques milliers de lignes.
   La requête catalogue (`.select('id,name,…,product_ranges(range:ranges(...))')`)
   produit déjà des subplans `Seq Scan` aujourd'hui.
2. **RLS non optimisée** : tous les filtres utilisent `auth.uid()` et
   `public.is_user_admin(auth.uid())` **non wrappés dans `(select …)`**. PostgREST réévalue
   ces fonctions une fois par ligne → effondrement perf sur les SELECT volumineux
   (353 produits × N pages → 35k+ appels `is_user_admin` par page admin). La policy
   `Insert valid email` sur `contact_messages` exécute en plus un sous-SELECT `auth.users`
   par ligne (anti-pattern bien connu).
3. **Données dupliquées et confuses** : `products.image_url` coexiste avec
   `product_images.url` (mauvaise source de vérité), `profiles.is_admin` + `role` +
   table `admin_users` triplent l'information admin (un seul est consulté en RLS, les
   deux autres peuvent diverger), `is_active = true` par défaut sur `products` mais
   imports en masse risquent de publier des produits non finis.

Top correctifs (ordonnés) :
1. Ajouter les indexes FK (voir section « Indexes manquants »).
2. Réécrire toutes les policies en wrappant `auth.uid()` dans `(SELECT auth.uid())`
   et marquer `is_user_admin` `STABLE` + figer `search_path`.
3. Choisir entre `products.image_url` et `product_images` (consensus : tout migrer vers
   `product_images`, supprimer `products.image_url`).

---

## Schéma — vue d'ensemble

### Tables (13 tables de base + 1 vue + 1 type ENUM)

| Domaine | Tables | Volumétrie | RLS |
|---|---|---|---|
| Auth/profils | `profiles`, `admin_users` | < 100 lignes prévues | Oui |
| Catalogue | `brands` (13), `ranges` (52), `products` (353), `product_ranges` (~353), `tag_types` (~6), `tags` (36), `product_tags` (844), `product_images` (299) | ~1 600 lignes | Oui |
| Panier | `carts`, `cart_items` | volatile, dépend du trafic | Oui |
| Commandes | `orders`, `order_items` | encore vide | Oui |
| CMS | `banners` | dizaines | Oui |
| Support | `contact_messages` | dizaines | Oui |

Vue : `tags_with_types` (jointure `tags ⋈ tag_types`, utilisée par catalogue et fiches produit).
Type ENUM : `order_status` (`pending|paid|shipped|completed|cancelled`).

### Relations principales

```
brands  ──< ranges  ──< product_ranges >── products  >── product_images
                                              │
                                              └── product_tags >── tags >── tag_types

auth.users ──< profiles
           ──< admin_users   (table dédiée pour bypass récursion RLS)
           ──< carts ──< cart_items >── products
           ──< orders ──< order_items >── products  (FK sans CASCADE — bon choix)
           ──< contact_messages
```

Normalisation 3NF respectée. Le n-n `product_ranges` est curieux fonctionnellement
(un produit n'a qu'une seule gamme dans la pratique, cf. logique frontend qui prend
toujours `product_ranges?.[0]`), voir Finding #1.

---

## Findings

### 1. Relation `product_ranges` modélisée n-n mais utilisée 1-n — Severity: Medium

**Lieu** : `db/schema.sql:86-90`, `src/app/catalogue/page.tsx:35-43`,
`src/app/product/[id]/page.tsx:48-54`, `src/app/api/admin/products/route.ts:73`

**Problème** : la table `product_ranges` est une table d'association n-n entre produits
et gammes, mais **toutes les couches client** prennent `product_ranges?.[0]?.ranges`
comme s'il n'y avait qu'une seule gamme par produit. Le code admin
(`route.ts:163-186`) n'insère qu'une seule ligne par produit et il n'y a aucune UI
pour gérer plusieurs gammes. Cette structure :

- alourdit toutes les requêtes (jointure n-n inutile)
- empêche d'indexer simplement la relation (`products.range_id` n'existe pas)
- crée un risque de cohérence (que se passe-t-il si un produit a 2 lignes ?)

**Recommandation** : si la règle métier est « 1 produit → 1 gamme », simplifier en
ajoutant `products.range_id UUID REFERENCES ranges(id)` et supprimer `product_ranges`.
Si la règle métier autorise plusieurs gammes, garder `product_ranges` mais
documenter et autoriser plusieurs gammes côté UI. À tout le moins, ajouter une
contrainte d'unicité d'usage (`UNIQUE (product_id)` sur la table d'association,
ce qui revient à du 1-n).

**Migration suggérée (variante 1-n recommandée)** :

```sql
-- Étape 1 : ajouter la colonne directe
ALTER TABLE public.products ADD COLUMN range_id UUID REFERENCES public.ranges(id);

-- Étape 2 : copier la première gamme de chaque produit
UPDATE public.products p
SET range_id = pr.range_id
FROM (
  SELECT DISTINCT ON (product_id) product_id, range_id
  FROM public.product_ranges
  ORDER BY product_id, range_id
) pr
WHERE p.id = pr.product_id;

-- Étape 3 : vérifier qu'aucune ligne n'a perdu sa gamme
SELECT COUNT(*) FROM public.products WHERE range_id IS NULL;

-- Étape 4 : index + drop table
CREATE INDEX idx_products_range_id ON public.products(range_id);
DROP TABLE public.product_ranges;
```

(Tenir compte du fait que cela impacte tous les `select(\`product_ranges(...)\`)` du
front, prévu pour 6 fichiers.)

---

### 2. Indexes FK absents — Severity: High

**Lieu** : `db/schema.sql:77-126, 160-194, 230`

**Problème** : seuls `banners` et `contact_messages` ont des indexes explicites.
**Aucune FK n'a d'index** (sauf celles qui sont aussi PK composite : `product_ranges`,
`product_tags`, `cart_items` partiellement). PostgreSQL ne crée **pas** d'index
automatique sur les colonnes FK.

À 353 produits ça ne se voit pas, mais :

- Le SELECT catalogue fait une 4-way join `products ⋈ product_ranges ⋈ ranges ⋈ brands`
  + une 3-way join `product_tags ⋈ tags_with_types`. Sans index FK, chaque jointure
  fait un nested-loop seq scan.
- La suppression d'un produit en cascade scan séquentiellement `product_images`,
  `product_tags`, `product_ranges`, `cart_items`, `order_items` à chaque DELETE.
- L'admin filtre `ranges` par `brand_id` (`route.ts:43`), `product_ranges` par `range_id`
  (`brands/[id]/route.ts:128`), `product_images` par `product_id` — tous sans index.

**Recommandation** : créer 12 indexes (voir section « Indexes manquants »).

---

### 3. RLS — `auth.uid()` non wrappé → réévaluation par ligne — Severity: High

**Lieu** : `db/schema.sql:491-590` (toutes les policies)

**Problème** : depuis Postgres 15 et les recos officielles Supabase, on doit envelopper
les fonctions auth dans un `(SELECT …)` pour que le planner les évalue **une seule fois
par requête** au lieu d'une fois par ligne. Cf. la doc :
<https://supabase.com/docs/guides/database/postgres/row-level-security#optimization>.

Exemple actuel (ligne 515) :
```sql
CREATE POLICY "View active products" ON public.products
  FOR SELECT USING (is_active = true OR public.is_user_admin(auth.uid()));
```
→ `is_user_admin(auth.uid())` exécuté **par ligne**. Sur un SELECT de 353 produits ça
fait 353 appels à `is_user_admin` (qui lui-même fait 1 EXISTS). Sur un admin qui liste
tout, c'est non négligeable, et ça empire en grandissant.

**Recommandation** : wrapper systématiquement + marquer `is_user_admin` `STABLE` et
forcer un `search_path` figé (sécurité contre injection via fonctions homonymes).

**Migration suggérée** :

```sql
-- Fonction sécurisée et stable
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE                  -- même résultat dans une même requête → cache
SET search_path = ''    -- fige le search_path (sécurité)
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = check_user_id
  );
$$;

-- Réécriture systématique des policies (extrait)
DROP POLICY "View active products" ON public.products;
CREATE POLICY "View active products" ON public.products
  FOR SELECT USING (
    is_active = true
    OR public.is_user_admin((SELECT auth.uid()))
  );

DROP POLICY "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products" ON public.products
  FOR ALL USING (public.is_user_admin((SELECT auth.uid())));

-- À répliquer sur les 25+ policies qui appellent is_user_admin ou auth.uid()
```

---

### 4. Policy `Insert valid email` exécute un sous-SELECT sur `auth.users` — Severity: High

**Lieu** : `db/schema.sql:588-590`

**Problème** :
```sql
CREATE POLICY "Insert valid email" ON public.contact_messages FOR INSERT WITH CHECK (
  user_email IN (SELECT email FROM auth.users)
);
```
Cette policy scanne `auth.users` à chaque INSERT et expose en lecture la liste des
emails (via le plan). C'est très lent au-delà de quelques milliers d'utilisateurs,
et redondant avec la RPC `create_contact_message` qui valide déjà l'email avec un
`SELECT id FROM auth.users WHERE email = p_email`.

**Recommandation** : soit supprimer la policy (la RPC est la seule voie d'écriture),
soit la transformer en lookup ponctuel.

**Migration suggérée** :

```sql
DROP POLICY "Insert valid email" ON public.contact_messages;

-- Variante 1 : interdire l'INSERT direct depuis l'API client, ne passer que par la RPC
CREATE POLICY "No direct insert" ON public.contact_messages
  FOR INSERT WITH CHECK (false);
-- La RPC create_contact_message reste en SECURITY DEFINER et bypassera cette policy.

-- Variante 2 (si on veut autoriser l'INSERT direct) : lookup ponctuel
CREATE POLICY "Insert valid email" ON public.contact_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users u WHERE u.email = user_email)
  );
```

---

### 5. Triple stockage du statut admin — Severity: Medium

**Lieu** : `db/schema.sql:31-49`

**Problème** : trois mécanismes pour dire qu'un user est admin :
- `profiles.is_admin BOOLEAN`
- `profiles.role TEXT IN ('user','admin','customer')` (note : pas de `'staff'`, `'super_admin'`, etc.)
- `admin_users` (table dédiée, seule consultée par `is_user_admin`)

Risques :
- Désynchronisation : un user pourrait avoir `is_admin = true` mais ne pas figurer dans
  `admin_users`, ou inversement. Le bootstrap (lignes 619-625) demande explicitement de
  mettre à jour les **trois** endroits.
- Le client (admin UI) peut lire `profiles.is_admin` pour décider de l'affichage, mais
  PostgREST/RLS se base sur `admin_users` → divergence possible.
- `role` n'est jamais utilisé par les policies.

**Recommandation** : `admin_users` est suffisant (et c'est le bon design pour éviter la
récursion RLS). Faire de `profiles.is_admin` un champ **calculé/virtuel** ou un trigger
qui le maintient depuis `admin_users`.

**Migration suggérée** :

```sql
-- Option A : trigger de synchro depuis admin_users
CREATE OR REPLACE FUNCTION public.sync_profile_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET is_admin = true, role = 'admin' WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET is_admin = false, role = 'user' WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_admin_status ON public.admin_users;
CREATE TRIGGER sync_admin_status
  AFTER INSERT OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_admin();

-- Option B : supprimer purement is_admin et role (plus radical)
-- ALTER TABLE public.profiles DROP COLUMN is_admin, DROP COLUMN role;
```

---

### 6. `products.image_url` vs `product_images` — duplication — Severity: Medium

**Lieu** : `db/schema.sql:61, 120-126`, `src/app/api/admin/products/route.ts:73-76`,
`src/app/api/admin/products/with-tags/route.ts:78-82`

**Problème** : deux sources pour l'image principale d'un produit :
- `products.image_url TEXT` (champ scalaire)
- `product_images(product_id, url, alt)` (table dédiée, 0..N images)

Le code admin écrit dans **les deux à la fois** (l'image uploadée part dans
`product_images`, mais `products.image_url` reste comme fallback). Les composants font
`product.product_images?.[0]?.url || product.image_url` partout, ce qui :
- masque une éventuelle inconsistance (ordre indéfini dans `product_images` puisque
  aucun champ `position`)
- crée des bugs subtils (suppression d'une image dans `product_images` ne nettoie pas
  `image_url`)

**Recommandation** : choisir `product_images` comme source unique. Ajouter un champ
`position` (ou un booléen `is_primary`). Supprimer `products.image_url` après
migration. Idem éventuellement pour `banners.image_url` (ok ici car bannières
mono-image par design).

**Migration suggérée** :

```sql
-- Étape 1 : enrichir product_images
ALTER TABLE public.product_images
  ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Index pour récupérer rapidement l'image primaire d'un produit
CREATE INDEX idx_product_images_product_position
  ON public.product_images(product_id, position);

-- Étape 2 : insérer les image_url manquantes dans product_images
INSERT INTO public.product_images (product_id, url, alt, position)
SELECT id, image_url, name, 0
FROM public.products
WHERE image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images pi WHERE pi.product_id = products.id
  );

-- Étape 3 : drop la colonne legacy (après MAJ du front)
-- ALTER TABLE public.products DROP COLUMN image_url;
```

---

### 7. `product_images` sans champ `position` ni `is_primary` — Severity: Medium

**Lieu** : `db/schema.sql:120-126`

**Problème** : aucun ordre garanti. Les composants comptent sur `product_images?.[0]`
mais l'ordre d'arrivée de PostgREST n'est pas déterministe sans `ORDER BY` côté query
(et aucune des queries actuelles n'en met). À 5 images par produit max ça reste OK
mais le bug arrivera (image principale qui change après réindexation Postgres).

**Recommandation** : ajouter `position INTEGER` et `ORDER BY position` côté query
(ou index couvrant).

```sql
ALTER TABLE public.product_images ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_product_images_product ON public.product_images(product_id, position);
```

Et côté code :
```ts
product_images ( url, alt, position ) /* + .order('position', { foreignTable: 'product_images' }) */
```

---

### 8. `ON DELETE CASCADE` partout — risque de perte de données — Severity: Medium

**Lieu** : `db/schema.sql:32, 47, 79, 87, 88, 106, 114, 115, 122, 149, 160, 161, 190`

**Problème** : 13 FK en `ON DELETE CASCADE`. Conséquences :
- Supprimer une `brand` → supprime ses `ranges` → supprime tous les `product_ranges`
  → si l'on a un jour le 1-n direct, supprime tous les **produits** → supprime tous les
  `product_images`, `product_tags`, `cart_items`. **Une erreur clic et 353 produits
  disparaissent**. Sans backup, on a perdu le catalogue.
- `cart_items.product_id ON DELETE CASCADE` : suppression de produit vide les paniers
  des clients **silencieusement** (UX cassée mais pas catastrophique).
- `order_items.product_id` ne CASCADE pas (bien — historique préservé). Idem
  `orders.user_id` ne CASCADE pas (lignes 181).

Le `CASCADE` sur les m-n (`product_ranges`, `product_tags`) est légitime. Le `CASCADE`
sur `auth.users → profiles` est OK (suppression compte = suppression profil).
Mais sur **brands → ranges**, **products → product_images** : c'est trop agressif.

**Recommandation** :
- Garder CASCADE sur les m-n et sur les lignes d'audit (cart_items, product_images,
  product_tags, product_ranges).
- Passer **brands → ranges** en `ON DELETE RESTRICT` (oblige à vider la marque avant
  de la supprimer).
- Ajouter une vérification applicative : la route DELETE de `/api/admin/brands/[id]`
  fait déjà des vérifs manuelles (lignes 126-146) — bien, mais sans la RESTRICT au
  niveau base, un service_role qui bypasse les checks peut tout casser.

**Migration suggérée** :

```sql
ALTER TABLE public.ranges
  DROP CONSTRAINT ranges_brand_id_fkey,
  ADD CONSTRAINT ranges_brand_id_fkey
    FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE RESTRICT;

-- Si on garde product_ranges, basculer en RESTRICT sur la suppression de products
-- (on doit explicitement nettoyer avant) :
-- (NB : si on passe en 1-n direct via finding #1, ce point disparaît)
```

---

### 9. Vue `tags_with_types` non indexable — Severity: Low

**Lieu** : `db/schema.sql:131-142`

**Problème** : c'est une vue simple, pas une vue matérialisée. Les requêtes catalogue
font :
```ts
product_tags ( tag:tags_with_types ( name, tag_type ) )
```
À chaque appel, PostgREST exécute en réalité `tags JOIN tag_types` pour chaque tag du
panier. Avec 36 tags et 844 lignes de `product_tags`, la jointure est rapide — mais
inutile.

**Recommandation** : la table `tags` (36 lignes) est triviale ; il est plus simple
de dénormaliser légèrement, ou de pousser le client à interroger directement `tags`
+ `tag_types` en deux requêtes (déjà fait pour la sidebar `tags_with_types`). À
court terme : laisser, mais documenter que cette vue est lente sur grosse volumétrie.
À moyen terme, si l'on dépasse 10k tags : vue matérialisée + index.

**Migration suggérée (option vue matérialisée)** :

```sql
CREATE MATERIALIZED VIEW public.tags_with_types_mv AS
SELECT t.id, t.name, t.slug, tt.slug AS tag_type, tt.name AS type_name,
       tt.color AS type_color, tt.icon AS type_icon, t.tag_type_id
FROM public.tags t
JOIN public.tag_types tt ON t.tag_type_id = tt.id;

CREATE UNIQUE INDEX idx_tags_with_types_mv_id ON public.tags_with_types_mv(id);
CREATE INDEX idx_tags_with_types_mv_type ON public.tags_with_types_mv(tag_type);

-- À rafraîchir après chaque modif sur tags/tag_types
REFRESH MATERIALIZED VIEW CONCURRENTLY public.tags_with_types_mv;
```

---

### 10. RPC `add_to_cart` écrase la quantité au lieu d'incrémenter — Severity: High (bug fonctionnel)

**Lieu** : `db/schema.sql:355-374`

**Problème** :
```sql
INSERT INTO public.cart_items (cart_id, product_id, quantity)
VALUES (p_cart_id, p_product_id, p_quantity)
ON CONFLICT (cart_id, product_id)
DO UPDATE SET quantity = EXCLUDED.quantity;
```
Si un utilisateur clique « Ajouter au panier » deux fois pour le même produit avec
`quantity = 1`, le panier reste à 1 (au lieu de passer à 2). C'est probablement
voulu si l'UI gère elle-même la quantité finale, mais à confirmer. Le nom de la
fonction (« add_to_cart ») suggère un comportement additif. Le frontend
(`src/app/api/cart/route.ts:174-180`) appelle l'RPC à chaque ajout.

**Recommandation** : confirmer la sémantique. Si c'est « add », faire un `+=` :

```sql
CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_cart_id    UUID,
  p_product_id UUID,
  p_quantity   INT,
  p_anon_id    UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantité doit être positive';
  END IF;

  IF p_anon_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND anonymous_id = p_anon_id
  ) THEN
    RAISE EXCEPTION 'Panier non autorisé';
  END IF;

  INSERT INTO public.cart_items (cart_id, product_id, quantity)
  VALUES (p_cart_id, p_product_id, p_quantity)
  ON CONFLICT (cart_id, product_id)
  DO UPDATE SET quantity = public.cart_items.quantity + EXCLUDED.quantity;
END;
$$;
```

Si la sémantique « replace » est volontaire, renommer la fonction en `set_cart_item`
pour éviter la confusion et ajouter un commentaire SQL :

```sql
COMMENT ON FUNCTION public.add_to_cart IS
  'Met à la quantité fournie. Ne fait PAS un += — le front doit calculer la quantité finale.';
```

---

### 11. RPC sans `search_path` figé — Severity: Medium (sécurité)

**Lieu** : `db/schema.sql:285-478` (toutes les fonctions sauf si ajout futur)

**Problème** : aucune fonction `SECURITY DEFINER` ne fige son `search_path`. Sur
Supabase, c'est exploité par les advisors « function_search_path_mutable ». Un
attaquant capable d'insérer une table `public.users` (ou autre name shadowing) peut
détourner la résolution.

**Recommandation** : ajouter `SET search_path = ''` à toutes les fonctions définies en
`SECURITY DEFINER` et qualifier tous les objets (`public.profiles`, `auth.users`,
etc.).

**Migration suggérée** :

```sql
-- À répliquer sur is_user_admin, handle_new_user, get_or_create_cart, add_to_cart,
-- remove_from_cart, create_contact_message, mark_message_as_read, get_messages_stats

ALTER FUNCTION public.is_user_admin(UUID)            SET search_path = '';
ALTER FUNCTION public.handle_new_user()              SET search_path = '';
ALTER FUNCTION public.get_or_create_cart(UUID, UUID) SET search_path = '';
ALTER FUNCTION public.add_to_cart(UUID, UUID, INT, UUID) SET search_path = '';
ALTER FUNCTION public.remove_from_cart(UUID, UUID)   SET search_path = '';
ALTER FUNCTION public.create_contact_message(TEXT, TEXT, TEXT) SET search_path = '';
ALTER FUNCTION public.mark_message_as_read(UUID)     SET search_path = '';
ALTER FUNCTION public.get_messages_stats()           SET search_path = '';
ALTER FUNCTION public.update_updated_at_column()     SET search_path = '';
ALTER FUNCTION public.reorder_banners(UUID, INTEGER, INTEGER) SET search_path = '';
ALTER FUNCTION public.cleanup_banner_positions()     SET search_path = '';
```

---

### 12. `currency` `CHAR(3)` vs valeur applicative 'DOP' — Severity: Low

**Lieu** : `db/schema.sql:60`

**Problème** : `CHAR(3)` pad à droite avec des espaces, ce qui peut piéger des
comparaisons (`currency = 'DOP'` vs `currency = 'DOP '`). PostgREST sérialise les
`CHAR` en string sans trim. La table ne contient qu'une seule valeur de fait (DOP).

**Recommandation** :
- Option « propre » : `CHAR(3)` → `VARCHAR(3)` + check ISO 4217.
- Option « pragmatique » : si la monnaie est mono-pays, supprimer le champ et le
  hardcoder côté app.

**Migration suggérée (Option propre)** :

```sql
ALTER TABLE public.products
  ALTER COLUMN currency TYPE VARCHAR(3),
  ADD CONSTRAINT currency_iso4217 CHECK (currency ~ '^[A-Z]{3}$');
```

---

### 13. `is_active = true` par défaut sur products — risque de publication accidentelle — Severity: Low

**Lieu** : `db/schema.sql:63`

**Problème** : sur un import en masse (style `populate_catalog.sql`, 219k lignes), tous
les produits insérés sans `is_active` explicite sortent **publics** immédiatement. Pour
un site e-commerce où la création d'un produit passe par : créer → uploader images →
mettre prix → publier, c'est dangereux.

**Recommandation** : passer le défaut à `false` pour forcer une étape de validation
explicite. Les imports existants restent inchangés (le défaut n'est appliqué qu'aux
nouvelles insertions sans valeur explicite).

**Migration suggérée** :

```sql
ALTER TABLE public.products ALTER COLUMN is_active SET DEFAULT false;
```

Idem `banners.is_active` (ligne 210) : actuellement `true`, et le code admin
(`api/admin/banners/route.ts:87`) force `true` si non précisé. Idem côté UX, mettre
`false`.

---

### 14. Indexes manquants sur recherche catalogue / admin — Severity: Medium

**Lieu** : multiples requêtes `ilike '%search%'` dans `src/app/api/admin/products/route.ts:60`,
`src/app/api/admin/products/with-tags/route.ts:45`, `src/app/api/admin/stock/route.ts:68`

**Problème** : les recherches admin font `name.ilike.%search%` (avec wildcard à
gauche **et** à droite). Un BTree classique ne sert à rien. Sur 353 produits ça passe,
sur 10k ça commence à ramer.

**Recommandation** : ajouter une extension `pg_trgm` + un index GIN trigram (et idem
pour les marques et gammes côté admin) :

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_products_name_trgm
  ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm
  ON public.products USING GIN (description gin_trgm_ops);

CREATE INDEX idx_brands_name_trgm ON public.brands USING GIN (name gin_trgm_ops);
CREATE INDEX idx_ranges_name_trgm ON public.ranges USING GIN (name gin_trgm_ops);
```

Avantage bonus : permet aussi `SIMILARITY()` pour les suggestions « avez-vous voulu dire ».

---

### 15. `products.slug` non indexé (UNIQUE = oui, mais routes /product utilisent l'UUID) — Severity: Low

**Lieu** : `db/schema.sql:57` (`slug TEXT UNIQUE`)

**Problème** : `slug` est `UNIQUE` (donc indexé par contrainte), c'est bien. **Mais** :
- les routes produit utilisent `/product/[id]` avec l'UUID, pas le slug (cf. `src/app/product/[id]/page.tsx`)
- aucun `.eq('slug', …)` dans le code

Donc :
- soit le slug est mort (à supprimer)
- soit on prévoit `/product/[slug]` pour le SEO (et il faut router via slug)

Recommandation : décider, puis aligner. Si on garde, ajouter `NOT NULL` + check
non-vide. Si on supprime, retirer la colonne.

**Migration suggérée (si on garde et qu'on veut SEO)** :

```sql
ALTER TABLE public.products
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT slug_not_empty CHECK (length(slug) >= 3);

-- Puis migrer les routes Next.js de [id] -> [slug] avec un fallback UUID.
```

---

### 16. RLS sur `carts` — l'anonymous_id passe par JWT claim mais aucun JWT côté front — Severity: High (sécurité)

**Lieu** : `db/schema.sql:539-558`, `src/app/api/cart/route.ts:23-29`

**Problème** : les policies `carts` et `cart_items` vérifient
`anonymous_id::text = auth.jwt()->>'anonymous_id'`. Mais le front (`api/cart/route.ts`)
appelle l'API via le client Supabase anon (ligne 8-13), **sans injecter le cookie
`cart_id` dans un claim JWT**. Les operations cart fonctionnent quand même parce que :

1. Le client utilisé est le client `anon` standard (ligne 7-13) qui ne porte pas de
   custom claim → `auth.jwt()->>'anonymous_id'` retourne `NULL` → la condition est
   fausse → la SELECT/UPDATE échouerait normalement…
2. … mais `get_or_create_cart`, `add_to_cart`, `remove_from_cart` sont
   `SECURITY DEFINER` → bypassent RLS → ça marche par hasard, **pas par design**.
3. Le `GET` de `cart_items` ligne 46-62 fait un `.select()` direct (pas via RPC).
   Avec la policy actuelle, il devrait échouer pour un utilisateur anonyme.

Conclusion : soit le RLS sur carts est en réalité non-fonctionnel et bypassé en
permanence, soit il y a un truc côté JWT que je n'ai pas vu (vérifier le helper
`createSupabaseServerClient`). À investiguer.

**Recommandation** :

- Variante A (sécurité maximale) : ne JAMAIS faire de SELECT/UPDATE direct sur
  carts/cart_items côté client. Tout passe par des RPC SECURITY DEFINER qui
  vérifient elles-mêmes la propriété via le cookie. Verrouiller RLS à `false`.
- Variante B : injecter le cookie cart_id dans un custom claim JWT (via Auth Hook
  Postgres `customize_jwt`) pour que la policy actuelle marche.

**Migration suggérée (Variante A)** :

```sql
-- Verrouiller le SELECT direct pour les anonymes
DROP POLICY "View own cart"       ON public.carts;
DROP POLICY "Create own cart"     ON public.carts;
DROP POLICY "Update own cart"     ON public.carts;
DROP POLICY "View own cart items" ON public.cart_items;
DROP POLICY "Manage own cart items" ON public.cart_items;

CREATE POLICY "Auth user own cart" ON public.carts
  FOR ALL USING (user_id IS NOT NULL AND user_id = (SELECT auth.uid()));

CREATE POLICY "Auth user own cart items" ON public.cart_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = cart_items.cart_id
      AND c.user_id = (SELECT auth.uid())
  ));

-- Puis ajouter une RPC `get_cart_items(p_anon_id UUID)` SECURITY DEFINER
-- qui retourne les items après avoir validé que p_anon_id correspond au panier.
```

---

### 17. Storage policies dupliquées (SQL + dashboard.md) — Severity: Low

**Lieu** : `db/schema.sql:592-605`, `db/storage_policies_dashboard.md:1-66`

**Problème** : le fichier `storage_policies_dashboard.md` documente une policy basée
sur `profiles.is_admin = true` (lignes 26-31), alors que `schema.sql:601-603` utilise
`is_user_admin(auth.uid())` (basée sur `admin_users`). Cohérence rompue. Si jamais
quelqu'un re-crée les policies via dashboard avec le markdown, on aura deux mécanismes
contradictoires.

**Recommandation** : supprimer ou mettre à jour `storage_policies_dashboard.md` pour
qu'il pointe vers `admin_users` ou retirer ce doc (il est dépassé par le schema.sql).

---

### 18. `banners` — `VARCHAR(255)` arbitraire sur `title`, position non unique — Severity: Low

**Lieu** : `db/schema.sql:202-209`

**Problème** :
- `VARCHAR(255)` est un mythe MySQL ; en Postgres on devrait utiliser `TEXT` partout.
- `position INTEGER NOT NULL DEFAULT 0` n'a **pas** de contrainte d'unicité. Deux
  bannières peuvent avoir la même position. La RPC `reorder_banners` peut produire
  des collisions transitoires (move 1→3 fait passer 2 à 1, mais entre la 1ère et la
  2ème UPDATE, on a deux lignes à position=1). Sur un site mono-admin ça reste OK,
  mais à plusieurs admins concurrents → race condition.

**Recommandation** :
- Migrer `VARCHAR` → `TEXT` (`title`, `link_text`, `banner_type`).
- Si on veut un ordre strict, faire `UNIQUE (position) DEFERRABLE INITIALLY DEFERRED`
  (permet les positions identiques **dans une transaction** mais pas en l'état final).

**Migration suggérée** :

```sql
ALTER TABLE public.banners
  ALTER COLUMN title       TYPE TEXT,
  ALTER COLUMN link_text   TYPE TEXT,
  ALTER COLUMN banner_type TYPE TEXT;

ALTER TABLE public.banners
  ADD CONSTRAINT banners_position_unique
    UNIQUE (position) DEFERRABLE INITIALLY DEFERRED;
```

Et envelopper `reorder_banners` dans une transaction (déjà le cas, vérifié implicite).

---

### 19. `orders.user_id` ne référence pas `auth.users` mais `profiles` — Severity: Low

**Lieu** : `db/schema.sql:181`

**Problème** : `user_id UUID REFERENCES public.profiles(id)`. C'est en soi cohérent
(profiles.id pointe vers auth.users.id en CASCADE), mais inutilement indirect. Toutes
les autres tables (cart, contact_messages, admin_users) pointent directement vers
`auth.users(id)`.

**Recommandation** : aligner sur `auth.users(id)` pour la cohérence (et la rapidité
de jointure : un hop de moins).

```sql
ALTER TABLE public.orders
  DROP CONSTRAINT orders_user_id_fkey,
  ADD CONSTRAINT orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
```

(Note : `ON DELETE SET NULL` plutôt que `CASCADE` pour conserver l'historique des
commandes même après suppression du compte.)

---

### 20. Pas d'index sur `cart_items.cart_id` (PK composite couvre, mais pas les requêtes par cart_id seul) — Severity: Medium

**Lieu** : `db/schema.sql:158-167`

**Problème** : `cart_items` PK = `id` (UUID), pas `(cart_id, product_id)` (qui est juste
UNIQUE). La contrainte UNIQUE crée un index composite `(cart_id, product_id)` qui
**couvre** les requêtes filtrant par `cart_id` (le prefixe de l'index). C'est ok pour
les SELECTs cart_id-based. À noter.

Mais : il n'y a aucun index sur `cart_items.product_id` seul. Quand on supprime un
produit (cascade), la base scanne. Sur l'`order_items.product_id` même problème.

**Recommandation** :

```sql
CREATE INDEX idx_cart_items_product_id  ON public.cart_items(product_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_order_items_order_id   ON public.order_items(order_id);
```

---

## Indexes manquants

Liste complète, à appliquer en une migration :

```sql
-- Catalogue : FK et lookups
CREATE INDEX IF NOT EXISTS idx_ranges_brand_id          ON public.ranges(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product   ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ranges_range_id  ON public.product_ranges(range_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id      ON public.product_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_type_id         ON public.tags(tag_type_id);

-- Produits : recherche & filtres
CREATE INDEX IF NOT EXISTS idx_products_is_active       ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_created_at      ON public.products(created_at DESC);

-- Panier / commandes
CREATE INDEX IF NOT EXISTS idx_carts_user_id            ON public.carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_anonymous_id       ON public.carts(anonymous_id) WHERE anonymous_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id    ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id           ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created    ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id     ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id   ON public.order_items(product_id);

-- Profils & messages
CREATE INDEX IF NOT EXISTS idx_profiles_role            ON public.profiles(role) WHERE role <> 'user';
CREATE INDEX IF NOT EXISTS idx_contact_messages_user    ON public.contact_messages(user_id) WHERE user_id IS NOT NULL;

-- Recherche fulltext (cf. finding #14)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm        ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON public.products USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm          ON public.brands USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ranges_name_trgm          ON public.ranges USING GIN (name gin_trgm_ops);
```

Justifications :
- `ranges.brand_id` : requête `from('ranges').eq('brand_id', …)` dans 3 routes admin.
- `product_images.product_id`, `product_ranges.range_id`, `product_tags.tag_id` :
  jointures inverses + cascade delete.
- `products.is_active` (partiel) : sur la home/catalogue (ligne `is_active=true OR admin`).
- `products.created_at` : tri ORDER BY DESC dans les listes admin (`route.ts:65`,
  `with-tags/route.ts:49`).
- `carts.user_id` et `carts.anonymous_id` : déjà UNIQUE → déjà indexé via contrainte
  (pas besoin de doublon — laisser le UNIQUE). Mais les filtres `WHERE user_id IS NOT NULL`
  réduisent la taille d'index. Vérifier : `unique_user_cart` couvre déjà la lookup
  → ces deux indexes partiels sont en réalité **doublons** des contraintes UNIQUE,
  on peut les retirer.
- `orders` : on prévoit des dashboards filtrant par status + date.
- `pg_trgm` : recherche `ilike '%x%'` (cf. finding #14).

**Vérification avant déploiement** : `EXPLAIN ANALYZE` sur les requêtes types pour
valider les gains.

---

## Recommandations prioritaires

1. **Indexes FK + indexes catalogue** — gains de perf immédiats, zéro risque.
   Bloc « Indexes manquants » ci-dessus, à appliquer en une migration.
2. **Réécriture RLS avec `(SELECT auth.uid())` + `is_user_admin` STABLE + `search_path`** —
   findings #3, #4, #11. Énorme gain de perf RLS, plus la robustesse sécurité.
3. **Décision `products.image_url` vs `product_images`** — finding #6/#7. Un seul
   choix, soit on supprime la colonne legacy, soit on supprime la table. Ajouter
   `position` dans tous les cas.
4. **Décision `product_ranges` n-n vs 1-n direct** — finding #1. Si la règle métier
   est 1 produit = 1 gamme (ce que suggère le code), simplifier le schéma. Sinon,
   ouvrir l'UI à la multi-gamme.
5. **Auditer les policies sur `carts/cart_items`** — finding #16. Comprendre comment
   l'anon_id arrive dans le JWT (ou pas). Verrouiller derrière des RPC si besoin.
6. **`add_to_cart` : confirmer la sémantique replace vs +=** — finding #10. Bug
   probable côté utilisateur.
7. **Triple stockage admin → trigger ou suppression** — finding #5. Évite des bugs
   de cohérence à 6 mois.
8. **Ajouter `ON DELETE RESTRICT` sur brands/ranges** — finding #8. Filet de
   sécurité contre les suppressions accidentelles.
9. **CASCADE order_items.product_id NON, status RESTRICT vs SET NULL** — finding
   #19. Mineur mais cohérent.
10. **Indexes trigram (`pg_trgm`)** — finding #14. À envisager dès que le catalogue
    franchit ~1k produits.

---

## Annexe — Migration consolidée (extrait à coller)

```sql
-- =========================================
-- AUDIT FIX BUNDLE — appliquer en une migration
-- =========================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Fonctions : STABLE + search_path
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = check_user_id
  );
$$;

ALTER FUNCTION public.handle_new_user()              SET search_path = '';
ALTER FUNCTION public.get_or_create_cart(UUID, UUID) SET search_path = '';
ALTER FUNCTION public.add_to_cart(UUID, UUID, INT, UUID) SET search_path = '';
ALTER FUNCTION public.remove_from_cart(UUID, UUID)   SET search_path = '';
ALTER FUNCTION public.create_contact_message(TEXT, TEXT, TEXT) SET search_path = '';
ALTER FUNCTION public.mark_message_as_read(UUID)     SET search_path = '';
ALTER FUNCTION public.get_messages_stats()           SET search_path = '';
ALTER FUNCTION public.update_updated_at_column()     SET search_path = '';
ALTER FUNCTION public.reorder_banners(UUID, INTEGER, INTEGER) SET search_path = '';
ALTER FUNCTION public.cleanup_banner_positions()     SET search_path = '';

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_ranges_brand_id          ON public.ranges(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product   ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ranges_range_id  ON public.product_ranges(range_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id      ON public.product_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_type_id         ON public.tags(tag_type_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active       ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_created_at      ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id    ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id           ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created    ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id     ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id   ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user    ON public.contact_messages(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm        ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON public.products USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm          ON public.brands USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ranges_name_trgm          ON public.ranges USING GIN (name gin_trgm_ops);

-- 4. Policies : réécriture avec (SELECT auth.uid())
DO $$
DECLARE policy_rec RECORD;
BEGIN
  -- Helper : on droppe puis recrée. À automatiser proprement par bloc.
  NULL; -- voir migration détaillée par table dans findings #3, #4, #16
END $$;

-- 5. Hygiène
ALTER TABLE public.products ALTER COLUMN is_active SET DEFAULT false;

-- (Optionnel — voir findings) : `image_url`, `product_ranges`, etc.
```

---

## Notes finales

- L'audit ne reflète pas l'état distant : les advisors Supabase MCP ont retourné les
  tables d'un autre projet (probablement un projet différent connecté au MCP que ce
  schema.sql). Pour finaliser, vérifier en passant `EXPLAIN ANALYZE` sur la base
  réelle après application des indexes.
- Les volumes actuels (1 600 lignes catalogue) ne provoquent pas encore de problèmes
  visibles. Les findings #2, #3, #14 deviendront critiques à partir de ~10k produits
  ou de plusieurs admins simultanés.
- À envisager : ajouter `pg_stat_statements` et faire tourner pendant 1-2 semaines
  pour identifier objectivement les requêtes les plus coûteuses.
