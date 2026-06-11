-- ============================================================================
-- RPC get_dashboard_stats() + get_inventory_valuation() — agrégats admin EN SQL.
--
-- POURQUOI (Phase 6 du plan de remédiation 2026-06-10)
-- ----------------------------------------------------
-- Aujourd'hui src/app/admin/_dashboard/data.ts émet ~28 requêtes PostgREST par
-- chargement du tableau de bord : la plupart sont des comptages / sommes /
-- group-by qui ramènent des TABLES ENTIÈRES (products, profiles, carts,
-- cart_items, reservations…) dans le runtime Node juste pour les agréger en JS.
-- src/app/admin/contabilidad/_data.ts charge de surcroît TOUS les produits
-- actifs (.select('stock, price, cost_price')) pour sommer coût×stock et
-- prix×stock en JS — un scan NON BORNÉ qui grossit avec le catalogue.
--
-- Ces deux RPC poussent toute l'agrégation en base : un seul aller-retour
-- renvoie l'intégralité des chiffres du dashboard (get_dashboard_stats), et un
-- second renvoie la valorisation d'inventaire de la compta (get_inventory_-
-- valuation). Le runtime Node ne reçoit plus que des scalaires/objets compacts.
-- Le dashboard passe de ~28 requêtes à 5 (1 RPC + 4 listes ordonnées) ; la
-- compta voit son scan inventaire non borné remplacé par un SUM SQL.
--
-- La sémantique reproduit FIDÈLEMENT le JS remplacé (mêmes filtres, mêmes
-- buckets, mêmes seuils — cf. commentaires inline). Tout calcul de DATE est
-- ancré UTC pour rester cohérent avec startOfDayUTC()/dateKey() côté JS (qui
-- bucketent sur la date ISO = date UTC).
--
-- SÉCURITÉ CRITIQUE
-- -----------------
-- Ces fonctions AGRÈGENT des données de COÛT (products.cost_price) — la
-- valorisation d'inventaire au coût, exposée nulle part au public. Elles sont
-- donc STRICTEMENT service-role :
--   REVOKE ALL    ... FROM PUBLIC, anon, authenticated ;
--   GRANT  EXECUTE ... TO service_role UNIQUEMENT.
-- Elles ne sont appelées que via supabaseAdmin (clé service-role) depuis les
-- pages serveur /admin. Ne JAMAIS les exposer à anon/authenticated : ce serait
-- une fuite directe du coût d'achat (cf. mémoire column-revoke-noop-under-
-- table-grant — ici on verrouille au niveau FONCTION, pas colonne).
--
-- SECURITY INVOKER : inutile d'élever les privilèges (l'appelant service-role
-- voit déjà tout) ; rester INVOKER évite tout contournement de RLS si la
-- fonction venait à être (mal) exposée. SET search_path = public fige la
-- résolution de noms. STABLE : lecture seule, pas d'effet de bord.
-- Idempotent : CREATE OR REPLACE + REVOKE/GRANT rejouables.
-- ============================================================================

-- ───────────────────────── get_inventory_valuation ─────────────────────────
-- Valorisation de l'inventaire courant (snapshot, hors période). Remplace le
-- scan JS non borné de contabilidad/_data.ts : SUM(price·stock) au détail,
-- SUM(cost_price·stock) au coût (lignes sans cost_price EXCLUES du coût mais
-- comptées ailleurs — jamais traitées comme coût 0). Réutilisée par le
-- dashboard (InventoryStats : units, stockValue, distribution par état de
-- stock, produits au prix placeholder).
CREATE OR REPLACE FUNCTION public.get_inventory_valuation()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'productsActive',    count(*),
    'units',             COALESCE(sum(COALESCE(stock, 0)), 0),
    'retailValue',       COALESCE(sum(COALESCE(price, 0) * COALESCE(stock, 0)), 0),
    'costValue',         COALESCE(sum(cost_price * COALESCE(stock, 0)) FILTER (WHERE cost_price IS NOT NULL), 0),
    'productsWithCost',  count(*) FILTER (WHERE cost_price IS NOT NULL),
    'placeholderPriced', count(*) FILTER (WHERE price = 100),
    -- Distribution (seuils IDENTIQUES au JS : s=0 → oos ; 0<s<5 → low ; sinon
    -- inStock). stock NULL = 0 côté JS (p.stock ?? 0) → COALESCE(stock,0).
    'inStock',           count(*) FILTER (WHERE COALESCE(stock, 0) >= 5),
    'low',               count(*) FILTER (WHERE COALESCE(stock, 0) > 0 AND COALESCE(stock, 0) < 5),
    'oos',               count(*) FILTER (WHERE COALESCE(stock, 0) = 0)
  )
  FROM products
  WHERE is_active = true;
$$;

COMMENT ON FUNCTION public.get_inventory_valuation() IS
  'Valorisation inventaire courant (détail + coût + distribution stock). SERVICE-ROLE ONLY (expose cost_price). Phase 6 remediation 2026-06-10.';

-- ───────────────────────── get_dashboard_stats ─────────────────────────────
-- Tous les agrégats du dashboard en UN appel → jsonb. Les LISTES de lignes
-- (stock critique, top produits, réservations/messages récents) restent des
-- requêtes PostgREST séparées côté data.ts (elles ont besoin d'embeds marque
-- ou de lignes ordonnées — peu de valeur à les pousser ici).
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_today_utc date := (now() AT TIME ZONE 'UTC')::date;
  v_start_utc date := v_today_utc - 13;  -- fenêtre 14 j (current + previous), inclusif
BEGIN
  RETURN jsonb_build_object(

    -- ── Revenue : chart 14 j (previous = 7 d'avant, current = 7 derniers) ──
    -- Reproduit fetchRevenue : buckets par jour UTC, status ≠ cancelled.
    -- reserved = total_price ; confirmed = total_price si status ∈ (confirmed,
    -- collected). On matérialise les 14 jours (même vides) pour un chart
    -- continu, puis previous=[idx 0..6] / current=[idx 7..13].
    'revenue', (
      WITH days AS (
        SELECT g::date AS d, (row_number() OVER (ORDER BY g)) - 1 AS idx
        FROM generate_series(v_start_utc, v_today_utc, interval '1 day') g
      ),
      agg AS (
        SELECT (created_at AT TIME ZONE 'UTC')::date AS d,
               sum(COALESCE(total_price, 0)) AS reserved,
               sum(COALESCE(total_price, 0)) FILTER (WHERE status IN ('confirmed', 'collected')) AS confirmed
        FROM reservations
        WHERE status <> 'cancelled'
          AND (created_at AT TIME ZONE 'UTC')::date >= v_start_utc
        GROUP BY 1
      ),
      points AS (
        SELECT days.idx,
               jsonb_build_object(
                 'date',      to_char(days.d, 'YYYY-MM-DD'),
                 'reserved',  COALESCE(agg.reserved, 0),
                 'confirmed', COALESCE(agg.confirmed, 0)
               ) AS pt
        FROM days LEFT JOIN agg ON agg.d = days.d
      )
      SELECT jsonb_build_object(
        'previous', COALESCE((SELECT jsonb_agg(pt ORDER BY idx) FROM points WHERE idx < 7),  '[]'::jsonb),
        'current',  COALESCE((SELECT jsonb_agg(pt ORDER BY idx) FROM points WHERE idx >= 7), '[]'::jsonb)
      )
    ),

    -- ── Inventaire : source unique = get_inventory_valuation() ──
    'inventory', public.get_inventory_valuation(),

    -- ── Catálogo : readiness (complétude) ──
    'readiness', (
      WITH active AS (
        SELECT id, range_id, is_featured, is_new, old_price, volume, inci,
               pharmacist_advice, technical_pdf_url, benefits, price
        FROM products WHERE is_active = true
      ),
      counts AS (
        SELECT
          count(*) AS active_count,
          count(*) FILTER (WHERE is_featured) AS featured,
          count(*) FILTER (WHERE is_new) AS is_new,
          count(*) FILTER (WHERE old_price IS NOT NULL) AS promo,
          count(*) FILTER (WHERE price = 100) AS placeholder,
          count(*) FILTER (WHERE volume IS NOT NULL) AS with_volume,
          count(*) FILTER (WHERE inci IS NOT NULL) AS with_inci,
          count(*) FILTER (WHERE pharmacist_advice IS NOT NULL) AS with_advice,
          count(*) FILTER (WHERE technical_pdf_url IS NOT NULL) AS with_pdf,
          count(*) FILTER (WHERE benefits IS NOT NULL) AS with_benefits,
          count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM product_images pi WHERE pi.product_id = active.id
          )) AS with_image
        FROM active
      ),
      -- nb de marques distinctes ayant ≥1 produit actif (= brandBars.length).
      brand_count AS (
        SELECT count(DISTINCT r.brand_id) AS n
        FROM active a JOIN ranges r ON r.id = a.range_id
        WHERE r.brand_id IS NOT NULL
      ),
      -- 7 métriques de couverture, MÊME ORDRE que le JS (score identique).
      metrics AS (
        SELECT jsonb_build_array(
          jsonb_build_object('label', 'Imagen',               'covered', c.with_image,                  'total', c.active_count),
          jsonb_build_object('label', 'Precio configurado',   'covered', c.active_count - c.placeholder, 'total', c.active_count),
          jsonb_build_object('label', 'Volumen',              'covered', c.with_volume,                 'total', c.active_count),
          jsonb_build_object('label', 'Beneficios',           'covered', c.with_benefits,               'total', c.active_count),
          jsonb_build_object('label', 'Consejo farmacéutico', 'covered', c.with_advice,                 'total', c.active_count),
          jsonb_build_object('label', 'INCI',                 'covered', c.with_inci,                   'total', c.active_count),
          jsonb_build_object('label', 'Ficha técnica PDF',    'covered', c.with_pdf,                    'total', c.active_count)
        ) AS arr,
        -- score = round( moyenne(covered/total sur 7 métriques) × 100 ).
        -- total = active_count partout → si 0 produit, score = 0.
        CASE WHEN c.active_count = 0 THEN 0 ELSE round((
            (c.with_image::numeric / c.active_count)
          + ((c.active_count - c.placeholder)::numeric / c.active_count)
          + (c.with_volume::numeric / c.active_count)
          + (c.with_benefits::numeric / c.active_count)
          + (c.with_advice::numeric / c.active_count)
          + (c.with_inci::numeric / c.active_count)
          + (c.with_pdf::numeric / c.active_count)
        ) / 7 * 100) END AS score
        FROM counts c
      )
      SELECT jsonb_build_object(
        'score',          (SELECT score FROM metrics),
        'activeProducts', (SELECT active_count FROM counts),
        'brands',         (SELECT n FROM brand_count),
        'ranges',         (SELECT count(*) FROM ranges),
        'featured',       (SELECT featured FROM counts),
        'isNew',          (SELECT is_new FROM counts),
        'promo',          (SELECT promo FROM counts),
        'metrics',        (SELECT arr FROM metrics)
      )
    ),

    -- ── Marcas : barres par marque (produits actifs + unités), produits>0, desc ──
    'brandBars', (
      SELECT COALESCE(jsonb_agg(
               jsonb_build_object('name', name, 'products', products, 'units', units)
               ORDER BY products DESC, name ASC
             ), '[]'::jsonb)
      FROM (
        SELECT b.name, count(p.id) AS products, COALESCE(sum(p.stock), 0) AS units
        FROM brands b
        JOIN ranges r   ON r.brand_id = b.id
        JOIN products p ON p.range_id = r.id AND p.is_active = true
        GROUP BY b.id, b.name
        HAVING count(p.id) > 0
      ) t
    ),

    -- ── Reservas por estado ──
    -- byStatus garde TOUJOURS les 5 clés (vocabulaire fixe → 0 si absent).
    'reservationStatus', (
      WITH agg AS (
        SELECT status::text AS st,
               count(*) AS n,
               sum(COALESCE(total_price, 0)) AS revenue,
               sum(COALESCE(total_items, 0)) AS items
        FROM reservations GROUP BY status
      ),
      buckets AS (
        SELECT s.st,
               COALESCE(a.n, 0)        AS n,
               COALESCE(a.revenue, 0)  AS revenue,
               COALESCE(a.items, 0)    AS items
        FROM (VALUES ('pending'),('confirmed'),('collected'),('expired'),('cancelled')) s(st)
        LEFT JOIN agg a ON a.st = s.st
      ),
      tot AS (
        SELECT
          COALESCE(sum(n), 0) AS total,
          COALESCE(sum(n)       FILTER (WHERE st IN ('pending','confirmed')),   0) AS active_count,
          COALESCE(sum(revenue) FILTER (WHERE st IN ('confirmed','collected')), 0) AS confirmed_revenue,
          COALESCE(sum(revenue) FILTER (WHERE st <> 'cancelled'),               0) AS noncancel_revenue,
          COALESCE(sum(n)       FILTER (WHERE st <> 'cancelled'),               0) AS noncancel_count
        FROM buckets
      )
      SELECT jsonb_build_object(
        'byStatus', (
          SELECT jsonb_object_agg(st, jsonb_build_object('n', n, 'revenue', revenue, 'items', items))
          FROM buckets
        ),
        'totalReservations', (SELECT total FROM tot),
        'activeCount',       (SELECT active_count FROM tot),
        'confirmedRevenue',  (SELECT confirmed_revenue FROM tot),
        'avgBasket', CASE WHEN (SELECT noncancel_count FROM tot) > 0
                          THEN round((SELECT noncancel_revenue FROM tot)::numeric / (SELECT noncancel_count FROM tot))
                          ELSE 0 END
      )
    ),

    -- ── Clientes ──
    'customers', (
      SELECT jsonb_build_object(
        'total',     count(*),
        'withPhone', count(*) FILTER (WHERE phone IS NOT NULL AND length(trim(phone)) > 0),
        'new7d',     count(*) FILTER (WHERE created_at >= now() - interval '7 days'),
        'new30d',    count(*) FILTER (WHERE created_at >= now() - interval '30 days'),
        'byLocale',  COALESCE((
          SELECT jsonb_agg(jsonb_build_object('locale', loc, 'n', n) ORDER BY n DESC, loc ASC)
          FROM (
            SELECT COALESCE(preferred_locale, '—') AS loc, count(*) AS n
            FROM profiles GROUP BY 1
          ) bl
        ), '[]'::jsonb)
      )
      FROM profiles
    ),

    -- ── Engagement (carritos, wishlist, newsletter) ──
    'engagement', jsonb_build_object(
      'totalCarts',          (SELECT count(*) FROM carts),
      'userCarts',           (SELECT count(*) FROM carts WHERE user_id IS NOT NULL),
      'activeCarts',         (SELECT count(DISTINCT cart_id) FROM cart_items),
      'cartUnits',           (SELECT COALESCE(sum(COALESCE(quantity, 0)), 0) FROM cart_items),
      'wishlists',           (SELECT count(*) FROM wishlists),
      'wishlistProducts',    (SELECT count(DISTINCT product_id) FROM wishlists),
      'newsletter',          (SELECT count(*) FROM newsletter_subscribers),
      'newsletterConfirmed', (SELECT count(*) FROM newsletter_subscribers WHERE confirmed_at IS NOT NULL)
    ),

    -- ── Contenido y taxonomía ──
    'content', jsonb_build_object(
      'posts',          (SELECT count(*) FROM posts),
      'postsPublished', (SELECT count(*) FROM posts WHERE is_published),
      'banners',        (SELECT count(*) FROM banners),
      'bannersActive',  (SELECT count(*) FROM banners WHERE is_active),
      'tags',           (SELECT count(*) FROM tags),
      'tagTypes',       (SELECT count(*) FROM tag_types),
      'productTags',    (SELECT count(*) FROM product_tags)
    ),

    -- ── Bandeja (mensajes) ──
    'inbox', jsonb_build_object(
      'total',  (SELECT count(*) FROM contact_messages),
      'unread', (SELECT count(*) FROM contact_messages WHERE status = 'open')
    )
  );
END;
$$;

COMMENT ON FUNCTION public.get_dashboard_stats() IS
  'Tous les agrégats du tableau de bord admin en 1 appel (revenue chart, readiness, inventario, marcas, reservas por estado, clientes, engagement, contenido, bandeja). SERVICE-ROLE ONLY (agrège cost_price via get_inventory_valuation). Phase 6 remediation 2026-06-10.';

-- ───────────────────────── Verrouillage des EXECUTE ─────────────────────────
-- 🔒 Ces fonctions exposent des agrégats de COÛT → JAMAIS anon/authenticated.
REVOKE ALL     ON FUNCTION public.get_inventory_valuation() FROM PUBLIC, anon, authenticated;
REVOKE ALL     ON FUNCTION public.get_dashboard_stats()     FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_inventory_valuation() TO service_role;
GRANT  EXECUTE ON FUNCTION public.get_dashboard_stats()     TO service_role;
