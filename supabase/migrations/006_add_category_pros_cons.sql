-- Add category-specific pros and cons to expert_ratings table
-- This allows each rating category (camera, battery, performance, display) to have its own pros/cons

-- Add new columns for category-specific pros and cons
ALTER TABLE expert_ratings
ADD COLUMN IF NOT EXISTS camera_pros text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS camera_cons text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS battery_pros text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS battery_cons text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS performance_pros text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS performance_cons text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS display_pros text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS display_cons text[] DEFAULT '{}';

-- Update the product_complete_view to include the new fields
DROP VIEW IF EXISTS product_complete_view CASCADE;

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
  er.camera_details,
  er.battery_details,
  er.performance_details,
  er.display_details,
  er.camera_pros,
  er.camera_cons,
  er.battery_pros,
  er.battery_cons,
  er.performance_pros,
  er.performance_cons,
  er.display_pros,
  er.display_cons,
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

-- Grant access to the updated view
GRANT SELECT ON product_complete_view TO anon, authenticated;

-- Add comment
COMMENT ON COLUMN expert_ratings.camera_pros IS 'Array of positive features for camera category';
COMMENT ON COLUMN expert_ratings.camera_cons IS 'Array of negative features for camera category';
COMMENT ON COLUMN expert_ratings.battery_pros IS 'Array of positive features for battery category';
COMMENT ON COLUMN expert_ratings.battery_cons IS 'Array of negative features for battery category';
COMMENT ON COLUMN expert_ratings.performance_pros IS 'Array of positive features for performance category';
COMMENT ON COLUMN expert_ratings.performance_cons IS 'Array of negative features for performance category';
COMMENT ON COLUMN expert_ratings.display_pros IS 'Array of positive features for display category';
COMMENT ON COLUMN expert_ratings.display_cons IS 'Array of negative features for display category';
