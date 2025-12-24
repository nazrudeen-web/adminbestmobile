-- Enhancement Migration: Add all fields needed for complete product page

-- Add missing fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS best_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS best_store_id UUID REFERENCES stores(id),
ADD COLUMN IF NOT EXISTS expert_score DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS main_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS badge VARCHAR(50),
ADD COLUMN IF NOT EXISTS price_last_updated TIMESTAMP;

-- Add delivery and authorization info to stores
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(100),
ADD COLUMN IF NOT EXISTS return_policy VARCHAR(200),
ADD COLUMN IF NOT EXISTS is_authorized_seller BOOLEAN DEFAULT false;

-- Add color hex code and SKU to variants
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7),
ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS price_modifier DECIMAL(10,2) DEFAULT 0;

-- Add detailed rating information to expert_ratings
ALTER TABLE expert_ratings
ADD COLUMN IF NOT EXISTS camera_details JSONB,
ADD COLUMN IF NOT EXISTS battery_details JSONB,
ADD COLUMN IF NOT EXISTS performance_details JSONB,
ADD COLUMN IF NOT EXISTS display_details JSONB;

-- Update specifications table to include icon reference
ALTER TABLE specifications
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_key_spec BOOLEAN DEFAULT false;

-- Create a table for key specifications highlight (shown at top of product page)
CREATE TABLE IF NOT EXISTS key_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  icon VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for key specs
CREATE INDEX IF NOT EXISTS idx_key_specifications_product_id ON key_specifications(product_id);

-- Create comprehensive view for product details (for frontend API)
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
        'variant_image', pv.variant_image,
        'sku', pv.sku,
        'is_available', pv.is_available,
        'price_modifier', pv.price_modifier
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

-- Create view for variant prices across stores
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
  st.delivery_time,
  st.return_policy,
  pr.price,
  pr.old_price,
  pr.stock_status,
  pr.delivery_info,
  pr.affiliate_url,
  pr.updated_at,
  p.name as product_name,
  p.slug as product_slug
FROM prices pr
LEFT JOIN product_variants pv ON pr.variant_id = pv.id
LEFT JOIN stores st ON pr.store_id = st.id
LEFT JOIN products p ON pr.product_id = p.id
ORDER BY pr.price ASC;

-- Function to update best_price when prices change
CREATE OR REPLACE FUNCTION update_product_best_price()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  -- Determine the product_id based on the operation
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  -- Update the best price and store for the product
  UPDATE products
  SET 
    best_price = (
      SELECT MIN(price) 
      FROM prices 
      WHERE product_id = target_product_id
      AND stock_status != 'out_of_stock'
    ),
    best_store_id = (
      SELECT store_id 
      FROM prices 
      WHERE product_id = target_product_id 
      AND stock_status != 'out_of_stock'
      ORDER BY price ASC 
      LIMIT 1
    ),
    price_last_updated = NOW()
  WHERE id = target_product_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update best_price
DROP TRIGGER IF EXISTS trigger_update_best_price ON prices;
CREATE TRIGGER trigger_update_best_price
AFTER INSERT OR UPDATE OR DELETE ON prices
FOR EACH ROW
EXECUTE FUNCTION update_product_best_price();

-- Function to update expert_score when ratings change
CREATE OR REPLACE FUNCTION update_product_expert_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET expert_score = NEW.overall_score
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update expert_score
DROP TRIGGER IF EXISTS trigger_update_expert_score ON expert_ratings;
CREATE TRIGGER trigger_update_expert_score
AFTER INSERT OR UPDATE ON expert_ratings
FOR EACH ROW
EXECUTE FUNCTION update_product_expert_score();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_storage ON product_variants(storage);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_specifications_spec_group ON specifications(spec_group);
CREATE INDEX IF NOT EXISTS idx_specifications_is_key_spec ON specifications(is_key_spec);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_prices_stock_status ON prices(stock_status);

-- Grant access to views (adjust based on your RLS policies)
GRANT SELECT ON product_complete_view TO anon, authenticated;
GRANT SELECT ON variant_prices_view TO anon, authenticated;

-- Comment on tables and columns for documentation
COMMENT ON COLUMN products.badge IS 'Badge text like "Best Choice", "Editor Pick", etc.';
COMMENT ON COLUMN products.expert_score IS 'Overall expert rating score (auto-updated from expert_ratings)';
COMMENT ON COLUMN product_variants.color_hex IS 'Hex color code for UI display (e.g., #000000)';
COMMENT ON COLUMN product_variants.price_modifier IS 'Price difference from base variant (can be negative or positive)';
COMMENT ON COLUMN expert_ratings.camera_details IS 'JSON: {details: ["detail1", "detail2"]}';
COMMENT ON COLUMN expert_ratings.battery_details IS 'JSON: {details: ["detail1", "detail2"]}';
COMMENT ON COLUMN expert_ratings.performance_details IS 'JSON: {details: ["detail1", "detail2"]}';
COMMENT ON COLUMN expert_ratings.display_details IS 'JSON: {details: ["detail1", "detail2"]}';
COMMENT ON COLUMN specifications.is_key_spec IS 'Whether to show this spec in the key specifications section';
COMMENT ON TABLE key_specifications IS 'Top 4-6 key specs shown with icons at the top of product page';
