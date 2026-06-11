-- ============================================================================
-- get_catalogue_page v2 — paires marque:gamme + facettes du groupe marque·gamme.
--
-- POURQUOI (redesign catalogue « Rail editorial », 2026-06-11)
-- ------------------------------------------------------------
-- Le nouveau rail de filtres est un ARBRE Marque → Gammes : une gamme se
-- coche indépendamment de sa marque, et cocher une marque + une gamme d'une
-- AUTRE marque doit produire l'UNION (pas l'intersection vide qu'imposait le
-- AND brand×range historique). Deux changements :
--
-- 1) Nouveau paramètre p_pairs jsonb — { "Marque": ["Gamme", ...], ... } :
--    sélections de gammes QUALIFIÉES par marque. Les noms de gammes ne sont
--    PAS uniques entre marques (« Protectores Solares » existe chez Avène ET
--    Babe) : filtrer par nom nu fuirait les homonymes. Quand p_pairs est non
--    vide (mode arbre), le groupe marque·gamme devient un OR :
--      brand ∈ p_brands  OR  (brand, range) ∈ p_pairs  OR  range ∈ p_ranges.
--    Quand p_pairs est vide, la sémantique HÉRITÉE est inchangée à
--    l'identique (AND entre familles) — aucun deep-link existant ne change.
--
-- 2) Facettes marques/gammes : l'arbre fait du groupe marque·gamme UN seul
--    groupe à sémantique OR → ses deux facettes excluent le groupe ENTIER
--    (brand + range + pairs) et n'appliquent que tags + q. Sinon, déplier
--    une marque non cochée montrerait des gammes à 0 alors que les cocher
--    ramènerait des produits. tag_base_pool, lui, applique VOLONTAIREMENT le
--    groupe complet (les tags sont une autre famille → AND) — ne pas
--    « corriger » ce CTE.
--
-- SÉCURITÉ : inchangée — SECURITY INVOKER, is_active réaffirmé, aucune
-- colonne de coût ne transite, p_pairs mal formé est neutralisé.
--
-- ⚠️ La signature passe de 7 à 8 arguments → DROP de l'ancienne (sinon
-- surcharge ambiguë pour PostgREST) + GRANT explicite sur la nouvelle.
-- L'ancien code (7 args nommés) reste compatible : p_pairs a un défaut.
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_catalogue_page(text[], text[], jsonb, text, text, int, int);
DROP FUNCTION IF EXISTS public.get_catalogue_page(text[], text[], jsonb, jsonb, text, text, int, int);

CREATE OR REPLACE FUNCTION public.get_catalogue_page(
  p_brands    text[]  DEFAULT '{}',
  p_ranges    text[]  DEFAULT '{}',
  p_pairs     jsonb   DEFAULT '{}'::jsonb,
  p_tags      jsonb   DEFAULT '{}'::jsonb,
  p_q         text    DEFAULT '',
  p_sort      text    DEFAULT 'bestsellers',
  p_page      int     DEFAULT 1,
  p_page_size int     DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_q_like    text;   -- motif ILIKE échappé (NULL si q vide → pas de filtre)
  v_sort      text;
  v_page_size int;
  v_tree      boolean; -- mode arbre : au moins une paire (marque, gammes[]) valide
BEGIN
  -- Normalisation des entrées (la fonction est exposée à anon : tout doit
  -- être défensif).
  p_brands := COALESCE(p_brands, '{}');
  p_ranges := COALESCE(p_ranges, '{}');
  p_pairs  := CASE WHEN jsonb_typeof(COALESCE(p_pairs, '{}'::jsonb)) = 'object'
                   THEN p_pairs ELSE '{}'::jsonb END;
  p_tags   := CASE WHEN jsonb_typeof(COALESCE(p_tags, '{}'::jsonb)) = 'object'
                   THEN p_tags ELSE '{}'::jsonb END;

  v_tree := EXISTS (
    SELECT 1 FROM jsonb_each(p_pairs) AS f(brand_name, ranges)
    WHERE jsonb_typeof(f.ranges) = 'array' AND jsonb_array_length(f.ranges) > 0
  );

  v_sort := CASE
    WHEN p_sort IN ('bestsellers', 'az', 'za', 'price-asc', 'price-desc') THEN p_sort
    ELSE 'bestsellers'
  END;

  v_page_size := GREATEST(1, COALESCE(p_page_size, 24));

  -- q : échappe les métacaractères LIKE (\ d'abord, puis % et _) sur la valeur
  -- DÉJÀ normalisée par le JS, puis %…% pour la recherche en sous-chaîne.
  IF p_q IS NOT NULL AND length(trim(p_q)) > 0 THEN
    v_q_like := '%' ||
      replace(replace(replace(p_q, '\', '\\'), '%', '\%'), '_', '\_') ||
      '%';
  END IF;

  RETURN (
    WITH
    -- ------------------------------------------------------------------
    -- base : produits actifs + noms marque/gamme dénormalisés, q appliqué
    -- (q est commun à TOUT : items, total ET facettes).
    -- ------------------------------------------------------------------
    base AS (
      SELECT
        p.id, p.slug, p.name, p.price, p.old_price, p.currency, p.stock,
        p.is_new, p.is_featured, p.volume,
        COALESCE(b.name, '') AS brand_name,
        COALESCE(r.name, '') AS range_name
      FROM products p
      LEFT JOIN ranges r ON r.id = p.range_id
      LEFT JOIN brands b ON b.id = r.brand_id
      WHERE p.is_active = true
        AND (v_q_like IS NULL OR p.name_search ILIKE v_q_like ESCAPE '\')
    ),
    -- ------------------------------------------------------------------
    -- filtered : base + groupe marque·gamme + tags (OR intra-type /
    -- AND inter-types via double NOT EXISTS).
    -- Groupe marque·gamme :
    --   mode arbre (v_tree)  → OR : marque pleine OU gamme nue OU paire ;
    --   mode hérité          → AND brand×range, à l'identique de la v1.
    -- ------------------------------------------------------------------
    filtered AS (
      SELECT cb.*
      FROM base cb
      WHERE (
          CASE WHEN v_tree THEN
            cb.brand_name = ANY(p_brands)
            OR (cardinality(p_ranges) > 0 AND cb.range_name = ANY(p_ranges))
            OR EXISTS (
              SELECT 1 FROM jsonb_each(p_pairs) AS pr(pair_brand, pair_ranges)
              WHERE pr.pair_brand = cb.brand_name
                AND jsonb_typeof(pr.pair_ranges) = 'array'
                AND cb.range_name IN (SELECT jsonb_array_elements_text(pr.pair_ranges))
            )
          ELSE
            (cardinality(p_brands) = 0 OR cb.brand_name = ANY(p_brands))
            AND (cardinality(p_ranges) = 0 OR cb.range_name = ANY(p_ranges))
          END
        )
        AND NOT EXISTS (
          -- Un type sélectionné (tableau non vide) que le produit ne
          -- satisfait PAS → produit exclu.
          SELECT 1
          FROM jsonb_each(p_tags) AS f(type_slug, names)
          WHERE jsonb_typeof(f.names) = 'array'
            AND jsonb_array_length(f.names) > 0
            AND NOT EXISTS (
              SELECT 1
              FROM product_tags pt
              JOIN tags t       ON t.id = pt.tag_id
              JOIN tag_types tt ON tt.id = t.tag_type_id
              WHERE pt.product_id = cb.id
                AND tt.slug = f.type_slug
                AND t.name IN (SELECT jsonb_array_elements_text(f.names))
            )
        )
    ),
    totals AS (
      SELECT count(*)::int AS total FROM filtered
    ),
    -- page effective clampée : LEAST(GREATEST(p_page,1), total_pages).
    paging AS (
      SELECT t.total,
             LEAST(
               GREATEST(COALESCE(p_page, 1), 1),
               GREATEST(1, CEIL(t.total::numeric / v_page_size))::int
             ) AS page
      FROM totals t
    ),
    -- ------------------------------------------------------------------
    -- Tri (fidèle à catalogueFilters.ts) + ordinal stable :
    --   bestsellers → featured d'abord, puis nom ASC ; az/za → nom ;
    --   price-asc/desc → PRIX EFFECTIF (le JS trie le prix promo-ajusté).
    -- Tiebreak final déterministe sur id.
    -- ------------------------------------------------------------------
    ordered AS (
      SELECT cf.*,
             row_number() OVER (ORDER BY
               CASE WHEN v_sort = 'bestsellers'
                    THEN (cf.is_featured IS NOT TRUE) END ASC,
               CASE WHEN v_sort = 'price-asc'
                    THEN public.effective_price(cf.id) END ASC NULLS LAST,
               CASE WHEN v_sort = 'price-desc'
                    THEN public.effective_price(cf.id) END DESC NULLS LAST,
               CASE WHEN v_sort = 'za' THEN cf.name END DESC,
               CASE WHEN v_sort IN ('bestsellers', 'az', 'price-asc', 'price-desc')
                    THEN cf.name END ASC,
               cf.id ASC
             ) AS ord
      FROM filtered cf
    ),
    page_slice AS (
      SELECT o.*
      FROM ordered o, paging pg
      WHERE o.ord >  (pg.page - 1) * v_page_size
        AND o.ord <= pg.page * v_page_size
    ),
    items AS (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'id',              ps.id,
               'slug',            ps.slug,
               'name',            ps.name,
               'price',           ps.price,
               'old_price',       ps.old_price,
               'currency',        ps.currency,
               'stock',           ps.stock,
               'is_new',          ps.is_new,
               'is_featured',     ps.is_featured,
               'volume',          ps.volume,
               'effective_price', public.effective_price(ps.id),
               'brand',           ps.brand_name,
               'range',           ps.range_name,
               'images', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object('url', pi.url, 'alt', pi.alt)
                                  ORDER BY pi.id)
                 FROM product_images pi
                 WHERE pi.product_id = ps.id
               ), '[]'::jsonb),
               'tags', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object('label', t.name, 'category', tt.slug))
                 FROM product_tags pt
                 JOIN tags t       ON t.id = pt.tag_id
                 JOIN tag_types tt ON tt.id = t.tag_type_id
                 WHERE pt.product_id = ps.id
               ), '[]'::jsonb)
             ) ORDER BY ps.ord), '[]'::jsonb) AS j
      FROM page_slice ps
    ),
    -- ------------------------------------------------------------------
    -- FACETTES.
    -- Marques & gammes = facettes du groupe marque·gamme → excluent le
    -- groupe ENTIER (brand + range + pairs), n'appliquent que tags (+ q,
    -- déjà dans base). Vocabulaires complets → entrées sans match = 0.
    -- ------------------------------------------------------------------
    -- 1) Marques : vocabulaire = marques avec ≥1 produit actif.
    brand_vocab AS (
      SELECT DISTINCT b.name AS brand_name
      FROM brands b
      JOIN ranges r   ON r.brand_id = b.id
      JOIN products p ON p.range_id = r.id AND p.is_active = true
    ),
    group_pool AS (  -- [tags + q], SANS le groupe marque·gamme — partagé
      SELECT cb.brand_name, cb.range_name
      FROM base cb
      WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_each(p_tags) AS f(type_slug, names)
          WHERE jsonb_typeof(f.names) = 'array'
            AND jsonb_array_length(f.names) > 0
            AND NOT EXISTS (
              SELECT 1 FROM product_tags pt
              JOIN tags t       ON t.id = pt.tag_id
              JOIN tag_types tt ON tt.id = t.tag_type_id
              WHERE pt.product_id = cb.id AND tt.slug = f.type_slug
                AND t.name IN (SELECT jsonb_array_elements_text(f.names))
            )
        )
    ),
    brands_facet AS (
      SELECT COALESCE(jsonb_object_agg(bv.brand_name, COALESCE(bp.n, 0)), '{}'::jsonb) AS j
      FROM brand_vocab bv
      LEFT JOIN (
        SELECT brand_name, count(*) AS n FROM group_pool GROUP BY brand_name
      ) bp ON bp.brand_name = bv.brand_name
    ),
    -- 2) Gammes : vocabulaire = gammes avec ≥1 produit actif.
    range_vocab AS (
      SELECT DISTINCT r.name AS range_name
      FROM ranges r
      JOIN products p ON p.range_id = r.id AND p.is_active = true
    ),
    ranges_facet AS (
      SELECT COALESCE(jsonb_object_agg(rv.range_name, COALESCE(rp.n, 0)), '{}'::jsonb) AS j
      FROM range_vocab rv
      LEFT JOIN (
        SELECT range_name, count(*) AS n FROM group_pool GROUP BY range_name
      ) rp ON rp.range_name = rv.range_name
    ),
    -- 3) Tags : vocabulaire = TOUS les tags (même non utilisés → 0), groupés
    --    par tag_types.slug. Count d'un tag du type X = produits matchant
    --    [groupe marque·gamme + q + les AUTRES types] ET portant ce tag.
    --    ⚠️ tag_base_pool applique le groupe marque·gamme EN ENTIER (mode
    --    arbre compris) : les tags sont une autre famille → AND voulu.
    tag_vocab AS (
      SELECT tt.slug AS type_slug, t.id AS tag_id, t.name AS tag_name
      FROM tags t JOIN tag_types tt ON tt.id = t.tag_type_id
    ),
    tag_base_pool AS (  -- base + groupe marque·gamme (+ q via base).
      SELECT cb.id
      FROM base cb
      WHERE (
        CASE WHEN v_tree THEN
          cb.brand_name = ANY(p_brands)
          OR (cardinality(p_ranges) > 0 AND cb.range_name = ANY(p_ranges))
          OR EXISTS (
            SELECT 1 FROM jsonb_each(p_pairs) AS pr(pair_brand, pair_ranges)
            WHERE pr.pair_brand = cb.brand_name
              AND jsonb_typeof(pr.pair_ranges) = 'array'
              AND cb.range_name IN (SELECT jsonb_array_elements_text(pr.pair_ranges))
          )
        ELSE
          (cardinality(p_brands) = 0 OR cb.brand_name = ANY(p_brands))
          AND (cardinality(p_ranges) = 0 OR cb.range_name = ANY(p_ranges))
        END
      )
    ),
    tag_counts AS (
      SELECT tv.type_slug, tv.tag_name, count(*) AS n
      FROM tag_vocab tv
      JOIN product_tags pt  ON pt.tag_id = tv.tag_id
      JOIN tag_base_pool bp ON bp.id = pt.product_id
      WHERE NOT EXISTS (
        -- un AUTRE type sélectionné (≠ type courant) non satisfait → exclu.
        SELECT 1 FROM jsonb_each(p_tags) AS f(type_slug, names)
        WHERE f.type_slug <> tv.type_slug
          AND jsonb_typeof(f.names) = 'array'
          AND jsonb_array_length(f.names) > 0
          AND NOT EXISTS (
            SELECT 1 FROM product_tags pt2
            JOIN tags t2       ON t2.id = pt2.tag_id
            JOIN tag_types tt2 ON tt2.id = t2.tag_type_id
            WHERE pt2.product_id = pt.product_id AND tt2.slug = f.type_slug
              AND t2.name IN (SELECT jsonb_array_elements_text(f.names))
          )
      )
      GROUP BY tv.type_slug, tv.tag_name
    ),
    tags_facet AS (
      SELECT COALESCE(jsonb_object_agg(per_type.type_slug, per_type.names), '{}'::jsonb) AS j
      FROM (
        SELECT tv.type_slug,
               jsonb_object_agg(tv.tag_name, COALESCE(c.n, 0)) AS names
        FROM tag_vocab tv
        LEFT JOIN tag_counts c
          ON c.type_slug = tv.type_slug AND c.tag_name = tv.tag_name
        GROUP BY tv.type_slug
      ) per_type
    )
    SELECT jsonb_build_object(
      'total',     (SELECT total FROM totals),
      'total_all', (SELECT count(*)::int FROM products WHERE is_active = true),
      'page',      (SELECT page FROM paging),
      'items',     (SELECT j FROM items),
      'facets',    jsonb_build_object(
        'brands', (SELECT j FROM brands_facet),
        'ranges', (SELECT j FROM ranges_facet),
        'tags',   (SELECT j FROM tags_facet)
      )
    )
  );
END;
$$;

COMMENT ON FUNCTION public.get_catalogue_page(text[], text[], jsonb, jsonb, text, text, int, int) IS
  'Catalogue server-side v2 : groupe marque·gamme en OR quand p_pairs (paires marque:gamme qualifiees) est non vide, sinon AND herite ; tags OR-intra AND-inter ; q accent-insensible ; tri ; pagination ; facettes (marques/gammes excluent le groupe entier, tags excluent leur type). SECURITY INVOKER, is_active reaffirme, aucun cout expose. Redesign rail editorial 2026-06-11.';

GRANT EXECUTE ON FUNCTION public.get_catalogue_page(text[], text[], jsonb, jsonb, text, text, int, int)
  TO anon, authenticated, service_role;
