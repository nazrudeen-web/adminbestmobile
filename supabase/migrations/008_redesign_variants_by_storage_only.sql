-- Migration: Redesign variants to be storage-only, colors as product-level options

-- 0. DROP ALL DEPENDENT VIEWS FIRST (required before dropping columns)
DROP VIEW IF EXISTS product_complete_view CASCADE;
DROP VIEW IF EXISTS variant_prices_view CASCADE;
DROP VIEW IF EXISTS variant_with_colors_view CASCADE;

-- 1. Create product_colors table for product-level color options WITH image_url
CREATE TABLE IF NOT EXISTS product_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  color_name VARCHAR(50) NOT NULL,
  color_hex VARCHAR(7),
  color_image VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, color_name)
);

-- Add color_image column if table already exists but doesn't have it
ALTER TABLE product_colors
ADD COLUMN IF NOT EXISTS color_image VARCHAR(500);

-- 2. Create variant_color_mapping to link colors to specific storage variants
-- (optional: if some colors only available for certain storages)
CREATE TABLE IF NOT EXISTS variant_color_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  color_id UUID REFERENCES product_colors(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(variant_id, color_id)
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_color_mapping_variant_id ON variant_color_mapping(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_color_mapping_color_id ON variant_color_mapping(color_id);

-- 4. Handle duplicate (product_id, storage) combinations from old design
-- In the old design, you could have: 256GB-Deep Blue, 256GB-Silver (same storage, different colors)
-- We need to consolidate these into single storage variants before adding the UNIQUE constraint

-- Delete duplicate variants, keeping only the first one per (product_id, storage)
-- Use window function to identify duplicates
DELETE FROM product_variants pv
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY product_id, storage ORDER BY created_at ASC, id ASC) as rn
    FROM product_variants
  ) t
  WHERE rn = 1
);

-- Now update product_variants table: remove color AND variant_image (moved to colors), keep only storage
ALTER TABLE product_variants
DROP COLUMN IF EXISTS color;

ALTER TABLE product_variants
DROP COLUMN IF EXISTS variant_image;

-- Drop constraint if it exists, then add it
ALTER TABLE product_variants
DROP CONSTRAINT IF EXISTS unique_storage_per_product;

-- Add unique constraint on (product_id, storage)
ALTER TABLE product_variants
ADD CONSTRAINT unique_storage_per_product UNIQUE (product_id, storage);

-- Note: variant_image moves to the variant itself (storage-based image)
-- if multiple colors have different images, we can extend later

-- 5. Recreate views without color column references
-- Product details view: updated for storage-only variants
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
        'storage', pv.storage
      ) ORDER BY pv.storage
    )
    FROM product_variants pv
    WHERE pv.product_id = p.id
  ) as variants,
  (
    SELECT json_agg(
      json_build_object(
        'id', pc.id,
        'color_name', pc.color_name,
        'color_hex', pc.color_hex,
        'color_image', pc.color_image,
        'sort_order', pc.sort_order
      ) ORDER BY pc.sort_order
    )
    FROM product_colors pc
    WHERE pc.product_id = p.id AND pc.is_available = true
  ) as colors,
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

-- Prices view: updated for storage-only variants (no color in variant_prices)
CREATE OR REPLACE VIEW variant_prices_view AS
SELECT 
  pr.id,
  pr.product_id,
  pr.variant_id,
  pv.storage,
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

-- 6. Create view to show variants with available colors (including color images)
CREATE OR REPLACE VIEW variant_with_colors_view AS
SELECT 
  pv.id as variant_id,
  pv.product_id,
  pv.storage,
  pv.created_at,
  json_agg(
    json_build_object(
      'id', pc.id,
      'color_name', pc.color_name,
      'color_hex', pc.color_hex,
      'color_image', pc.color_image
    ) ORDER BY pc.sort_order
  ) as available_colors
FROM product_variants pv
LEFT JOIN product_colors pc ON pv.product_id = pc.product_id AND pc.is_available = true
GROUP BY pv.id, pv.product_id, pv.storage, pv.created_at;
