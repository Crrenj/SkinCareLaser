-- ============================================================================
-- RPC get_catalogue_page — pagination/filtrage/facettes du catalogue EN SQL.
--
-- POURQUOI (Phase 3 du plan de remédiation 2026-06-10)
-- ----------------------------------------------------
-- Aujourd'hui src/app/[locale]/catalogue/page.tsx charge jusqu'à 500 produits
-- (.limit(500)) puis filtre / facette / trie / pagine côté JS dans
-- src/lib/catalogueFilters.ts. À mesure que le catalogue grossit (objectif
-- ~10k références), le .limit(500) DROPPE silencieusement tout le reste : les
-- compteurs, le total et les pages deviennent faux. Cette RPC déplace toute la
-- logique en base : un seul aller-retour renvoie la page demandée + le total +
-- les facettes, calculés sur l'INTÉGRALITÉ des produits actifs.
--
-- La sémantique reproduit FIDÈLEMENT catalogueFilters.ts (contrat figé par
-- src/__tests__/catalogueFilters.test.ts) :
--   * marque : OR entre marques sélectionnées ;
--   * gamme  : OR entre gammes ;
--   * tags   : OR intra-type / AND inter-types ;
--   * q      : sous-chaîne ILIKE (AMÉLIORATION D-4 voulue : accent-insensible
--              via products.name_search = immutable_unaccent(lower(name))) ;
--   * facettes : chaque famille EXCLUT son propre filtre mais applique tous les
--                autres (y compris q) — modèle « faceted search ».
--
-- IMPLÉMENTATION : une SEULE requête CTE (pas de TEMP TABLE — interdit dans une
-- fonction STABLE, et collision de nom en cas d'appels multiples par
-- transaction). Les CTE référencées plusieurs fois (base, filtered) sont
-- matérialisées automatiquement par Postgres → calculées une fois.
--
-- SÉCURITÉ
-- --------
-- SECURITY INVOKER (PAS DEFINER) : la fonction tourne avec les droits de
-- l'appelant ; la base products WHERE is_active = true est ré-affirmée
-- EXPLICITEMENT ici (on ne se repose pas sur la RLS). AUCUNE colonne de coût
-- (cost_price / unit_cost) ne transite : on ne sélectionne que des colonnes
-- publiques + effective_price() (qui n'expose jamais le coût). Les valeurs de
-- p_tags non-array sont ignorées (jsonb_typeof) — un appel anon direct mal
-- formé ne lève pas d'erreur.
--
-- CONTRAT
-- -------
-- get_catalogue_page(
--   p_brands    text[]  -- NOMS de marques canoniques (résolus par parseFilters)
--   p_ranges    text[]  -- NOMS de gammes
--   p_tags      jsonb   -- { "<tag_type.slug>": ["Nom Du Tag", ...], ... }
--   p_q         text    -- requête déjà normalisée (lower + sans accent) côté JS
--   p_sort      text    -- bestsellers|az|za|price-asc|price-desc (sinon bestsellers)
--   p_page      int
--   p_page_size int
-- ) RETURNS jsonb :
-- { total, total_all, page, items: [...], facets: { brands, ranges, tags } }
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_catalogue_page(text[], text[], jsonb, text, text, int, int);

CREATE OR REPLACE FUNCTION public.get_catalogue_page(
  p_brands    text[]  DEFAULT '{}',
  p_ranges    text[]  DEFAULT '{}',
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
BEGIN
  -- Normalisation des entrées (la fonction est exposée à anon : tout doit
  -- être défensif).
  p_brands := COALESCE(p_brands, '{}');
  p_ranges := COALESCE(p_ranges, '{}');
  p_tags   := CASE WHEN jsonb_typeof(COALESCE(p_tags, '{}'::jsonb)) = 'object'
                   THEN p_tags ELSE '{}'::jsonb END;

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
    -- filtered : base + marque (OR) + gamme (OR) + tags (OR intra-type /
    -- AND inter-types via double NOT EXISTS).
    -- ------------------------------------------------------------------
    filtered AS (
      SELECT cb.*
      FROM base cb
      WHERE (cardinality(p_brands) = 0 OR cb.brand_name = ANY(p_brands))
        AND (cardinality(p_ranges) = 0 OR cb.range_name = ANY(p_ranges))
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
    -- FACETTES — sémantique computeFacetedCounts : chaque famille exclut
    -- SON propre filtre, applique tous les autres (q déjà dans base).
    -- Vocabulaires complets → les entrées sans match obtiennent 0.
    -- ------------------------------------------------------------------
    -- 1) Marques : vocabulaire = marques avec ≥1 produit actif.
    brand_vocab AS (
      SELECT DISTINCT b.name AS brand_name
      FROM brands b
      JOIN ranges r   ON r.brand_id = b.id
      JOIN products p ON p.range_id = r.id AND p.is_active = true
    ),
    brand_pool AS (  -- [ranges + tags + q], SANS le filtre brand.
      SELECT cb.brand_name
      FROM base cb
      WHERE (cardinality(p_ranges) = 0 OR cb.range_name = ANY(p_ranges))
        AND NOT EXISTS (
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
        SELECT brand_name, count(*) AS n FROM brand_pool GROUP BY brand_name
      ) bp ON bp.brand_name = bv.brand_name
    ),
    -- 2) Gammes : vocabulaire = gammes avec ≥1 produit actif.
    range_vocab AS (
      SELECT DISTINCT r.name AS range_name
      FROM ranges r
      JOIN products p ON p.range_id = r.id AND p.is_active = true
    ),
    range_pool AS (  -- [brands + tags + q], SANS le filtre range.
      SELECT cb.range_name
      FROM base cb
      WHERE (cardinality(p_brands) = 0 OR cb.brand_name = ANY(p_brands))
        AND NOT EXISTS (
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
    ranges_facet AS (
      SELECT COALESCE(jsonb_object_agg(rv.range_name, COALESCE(rp.n, 0)), '{}'::jsonb) AS j
      FROM range_vocab rv
      LEFT JOIN (
        SELECT range_name, count(*) AS n FROM range_pool GROUP BY range_name
      ) rp ON rp.range_name = rv.range_name
    ),
    -- 3) Tags : vocabulaire = TOUS les tags (même non utilisés → 0), groupés
    --    par tag_types.slug. Count d'un tag du type X = produits matchant
    --    [brands + ranges + q + les AUTRES types] ET portant ce tag.
    tag_vocab AS (
      SELECT tt.slug AS type_slug, t.id AS tag_id, t.name AS tag_name
      FROM tags t JOIN tag_types tt ON tt.id = t.tag_type_id
    ),
    tag_base_pool AS (  -- base + brands + ranges (+ q via base).
      SELECT cb.id
      FROM base cb
      WHERE (cardinality(p_brands) = 0 OR cb.brand_name = ANY(p_brands))
        AND (cardinality(p_ranges) = 0 OR cb.range_name = ANY(p_ranges))
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

COMMENT ON FUNCTION public.get_catalogue_page(text[], text[], jsonb, text, text, int, int) IS
  'Catalogue server-side : filtrage (marque OR / gamme OR / tags OR-intra AND-inter / q accent-insensible) + tri + pagination + total + facettes (chaque famille exclut son propre filtre). SECURITY INVOKER, is_active reaffirme, aucun cout expose. Phase 3 remediation 2026-06-10.';

GRANT EXECUTE ON FUNCTION public.get_catalogue_page(text[], text[], jsonb, text, text, int, int)
  TO anon, authenticated, service_role;
