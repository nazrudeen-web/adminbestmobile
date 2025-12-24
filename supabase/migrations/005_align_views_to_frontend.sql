-- Align database views to the product-details frontend UI
-- Goal: remove delivery/stock-related fields from the views that power the public API.
-- Note: This does NOT drop underlying table columns (safe).

-- Postgres does not allow CREATE OR REPLACE VIEW to *remove* columns.
-- If the view already exists with more columns, we must drop it first.
DROP VIEW IF EXISTS product_complete_view CASCADE;
DROP VIEW IF EXISTS variant_prices_view CASCADE;

-- Product details view: keep only fields used by the frontend.
CREATE OR REPLACE VIEW product_complete_view AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.description,
  p.launch_year,
  p.best_price,
  p.expert_score,
  p.main_image,
  p.badge,
  p.price_last_updated,
  p.is_active,
  p.created_at,
  p.updated_at,
  b.id as brand_id,
  b.name as brand_name,
  b.logo as brand_logo,
  b.slug as brand_slug,
  s.name as best_store_name,
  s.logo as best_store_logo,
  er.overall_score,
  er.camera_score,
  er.battery_score,
  er.performance_score,
  er.display_score,
  er.pros,
  er.cons,
  er.camera_details,
  er.battery_details,
  er.performance_details,
  er.display_details,
  (
    SELECT json_agg(
      json_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'is_main', pi.is_main,
        'sort_order', pi.sort_order
      ) ORDER BY pi.sort_order
    )
    FROM product_images pi
    WHERE pi.product_id = p.id
  ) as images,
  (
    SELECT json_agg(
      json_build_object(
        'id', pv.id,
        'storage', pv.storage,
        'color', pv.color,
        'color_hex', pv.color_hex,
        'variant_image', pv.variant_image
      ) ORDER BY pv.storage, pv.color
    )
    FROM product_variants pv
    WHERE pv.product_id = p.id
  ) as variants,
  (
    SELECT json_agg(
      json_build_object(
        'id', ks.id,
        'icon', ks.icon,
        'title', ks.title,
        'value', ks.value,
        'sort_order', ks.sort_order
      ) ORDER BY ks.sort_order
    )
    FROM key_specifications ks
    WHERE ks.product_id = p.id
  ) as key_specifications,
  (
    SELECT json_agg(
      json_build_object(
        'id', sp.id,
        'spec_group', sp.spec_group,
        'spec_name', sp.spec_name,
        'spec_value', sp.spec_value,
        'icon', sp.icon,
        'is_key_spec', sp.is_key_spec,
        'sort_order', sp.sort_order
      ) ORDER BY sp.spec_group, sp.sort_order
    )
    FROM specifications sp
    WHERE sp.product_id = p.id
  ) as specifications
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN stores s ON p.best_store_id = s.id
LEFT JOIN expert_ratings er ON p.id = er.product_id;

-- Prices view: only keep what is shown/needed on the compare-prices UI.
CREATE OR REPLACE VIEW variant_prices_view AS
SELECT 
  pr.id,
  pr.product_id,
  pr.variant_id,
  pv.storage,
  pv.color,
  pv.color_hex,
  pr.store_id,
  st.name as store_name,
  st.logo as store_logo,
  st.website_url,
  st.is_official,
  st.is_authorized_seller,
  pr.price,
  pr.old_price,
  pr.affiliate_url,
  pr.updated_at,
  p.name as product_name,
  p.slug as product_slug
FROM prices pr
LEFT JOIN product_variants pv ON pr.variant_id = pv.id
LEFT JOIN stores st ON pr.store_id = st.id
LEFT JOIN products p ON pr.product_id = p.id
ORDER BY pr.price ASC;

-- Best price trigger: align to frontend (no stock-status filtering).
CREATE OR REPLACE FUNCTION update_product_best_price()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  UPDATE products
  SET 
    best_price = (
      SELECT MIN(price)
      FROM prices
      WHERE product_id = target_product_id
    ),
    best_store_id = (
      SELECT store_id
      FROM prices
      WHERE product_id = target_product_id
      ORDER BY price ASC
      LIMIT 1
    ),
    price_last_updated = NOW()
  WHERE id = target_product_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_best_price ON prices;
CREATE TRIGGER trigger_update_best_price
AFTER INSERT OR UPDATE OR DELETE ON prices
FOR EACH ROW
EXECUTE FUNCTION update_product_best_price();

-- Keep view access
GRANT SELECT ON product_complete_view TO anon, authenticated;
GRANT SELECT ON variant_prices_view TO anon, authenticated;
