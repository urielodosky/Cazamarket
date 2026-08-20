-- ==========================================
-- SCRIPT: Corrección de search_products para filtrar por precios (parseando strings de texto)
-- ==========================================
DROP FUNCTION IF EXISTS search_products;

CREATE OR REPLACE FUNCTION search_products(
  p_search_term TEXT DEFAULT '',
  p_category TEXT DEFAULT '',
  p_subcategories TEXT[] DEFAULT '{}',
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_target_currency TEXT DEFAULT 'USD',
  p_exchange_rate NUMERIC DEFAULT 1400,
  p_business_type TEXT DEFAULT '',
  p_condition TEXT DEFAULT '',
  p_ofrece TEXT DEFAULT '',
  p_province TEXT DEFAULT '',
  p_locality TEXT DEFAULT '',
  p_rating TEXT DEFAULT '',
  p_vendor_user_id UUID DEFAULT NULL,
  p_page_number INT DEFAULT 1,
  p_items_per_page INT DEFAULT 24
)
RETURNS TABLE (
  id BIGINT,
  created_at TIMESTAMPTZ,
  user_id UUID,
  name TEXT,
  price TEXT,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  condition TEXT,
  media JSONB,
  image TEXT,
  shipping_mode TEXT,
  shipping_cost TEXT,
  pickup_available TEXT,
  pickup_branches JSONB,
  features JSONB,
  has_discount BOOLEAN,
  discount_name TEXT,
  discount_type TEXT,
  discount_value TEXT,
  volume_discounts JSONB,
  stock_mode TEXT,
  stock NUMERIC,
  virtual_advisor TEXT,
  has_min_order BOOLEAN,
  min_order_qty NUMERIC,
  calc_rating NUMERIC,
  profiles_obj JSONB,
  total_count BIGINT
) AS $$
DECLARE
  v_offset INT;
BEGIN
  v_offset := (p_page_number - 1) * p_items_per_page;

  RETURN QUERY
  WITH filtered_products AS (
    SELECT 
      p.*,
      CASE WHEN p.price ILIKE '%USD%' THEN 'USD' ELSE 'ARS' END as parsed_currency,
      COALESCE(NULLIF(REGEXP_REPLACE(p.price, '[^0-9\.]', '', 'g'), ''), '0')::NUMERIC as parsed_numeric_price,
      (SELECT COALESCE(AVG(r.product_rating), 0)
       FROM reviews r 
       JOIN interactions i ON r.interaction_id = i.id
       WHERE i.product_id = p.id::TEXT AND i.status = 'published'
      ) as calc_rating,
      jsonb_build_object(
        'store_name', pr.store_name,
        'full_name', pr.full_name,
        'first_name', pr.first_name,
        'last_name', pr.last_name,
        'avatar_url', pr.avatar_url,
        'business_type', pr.business_type,
        'branches', pr.branches,
        'verified', pr.verified
      ) as profiles_obj,
      pr.business_type as pr_business_type,
      pr.branches as pr_branches
    FROM products p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE 
      (p_vendor_user_id IS NULL OR p.user_id = p_vendor_user_id)
      AND
      (p_search_term = '' OR 
       p.name ILIKE '%' || p_search_term || '%' OR 
       p.description ILIKE '%' || p_search_term || '%'
      )
      AND
      (p_category = '' OR p.category ILIKE p_category)
      AND
      (array_length(p_subcategories, 1) IS NULL OR p.subcategory ILIKE ANY(p_subcategories))
      AND
      (p_condition = '' OR p.condition ILIKE p_condition)
      AND
      (p_business_type = '' OR pr.business_type ILIKE p_business_type)
      AND
      (p_province = '' OR 
         EXISTS (
           SELECT 1 FROM jsonb_array_elements(pr.branches) as b
           WHERE b->>'provincia' = p_province OR b->>'province' = p_province
         )
      )
      AND
      (p_locality = '' OR 
         EXISTS (
           SELECT 1 FROM jsonb_array_elements(pr.branches) as b
           WHERE b->>'localidad' = p_locality OR b->>'city' = p_locality
         )
      )
  ),
  products_with_price_filtered AS (
    SELECT fp.*
    FROM filtered_products fp
    WHERE 
      (p_min_price IS NULL OR 
         (CASE 
            WHEN fp.parsed_currency = 'ARS' AND p_target_currency = 'USD' THEN fp.parsed_numeric_price / p_exchange_rate
            WHEN fp.parsed_currency = 'USD' AND p_target_currency = 'ARS' THEN fp.parsed_numeric_price * p_exchange_rate
            ELSE fp.parsed_numeric_price
          END) >= p_min_price
      )
      AND
      (p_max_price IS NULL OR 
         (CASE 
            WHEN fp.parsed_currency = 'ARS' AND p_target_currency = 'USD' THEN fp.parsed_numeric_price / p_exchange_rate
            WHEN fp.parsed_currency = 'USD' AND p_target_currency = 'ARS' THEN fp.parsed_numeric_price * p_exchange_rate
            ELSE fp.parsed_numeric_price
          END) <= p_max_price
      )
  ),
  products_with_rating_filtered AS (
    SELECT pf.*
    FROM products_with_price_filtered pf
    WHERE 
      p_rating = '' OR
      (p_rating = '5' AND pf.calc_rating >= 5) OR
      (p_rating = '4' AND pf.calc_rating >= 4) OR
      (p_rating = '3' AND pf.calc_rating >= 3) OR
      (p_rating = 'menos_3' AND pf.calc_rating > 0 AND pf.calc_rating < 3) OR
      (p_rating = 'nuevo' AND pf.calc_rating = 0)
  ),
  total_count_query AS (
    SELECT count(*) as total_count FROM products_with_rating_filtered
  )
  SELECT 
    prf.id,
    prf.created_at,
    prf.user_id,
    prf.name,
    prf.price,
    prf.category,
    prf.subcategory,
    prf.description,
    prf.condition,
    prf.media,
    prf.image,
    prf.shipping_mode,
    prf.shipping_cost,
    prf.pickup_available,
    prf.pickup_branches,
    prf.features,
    prf.has_discount,
    prf.discount_name,
    prf.discount_type,
    prf.discount_value,
    prf.volume_discounts,
    prf.stock_mode,
    prf.stock,
    prf.virtual_advisor,
    prf.has_min_order,
    prf.min_order_qty,
    prf.calc_rating,
    prf.profiles_obj,
    tc.total_count
  FROM products_with_rating_filtered prf
  CROSS JOIN total_count_query tc
  ORDER BY prf.created_at DESC
  LIMIT p_items_per_page
  OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;
