-- Sample data for testing the admin panel and frontend
-- This file contains examples based on the product images you provided

-- Insert Brands
INSERT INTO brands (name, slug, logo, is_active) VALUES
('APPLE', 'apple', 'https://example.com/logos/apple.png', true),
('GOOGLE', 'google', 'https://example.com/logos/google.png', true),
('SAMSUNG', 'samsung', 'https://example.com/logos/samsung.png', true),
('OPPO', 'oppo', 'https://example.com/logos/oppo.png', true),
('vivo', 'vivo', 'https://example.com/logos/vivo.png', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  logo = EXCLUDED.logo,
  is_active = EXCLUDED.is_active;

-- Insert Stores
INSERT INTO stores (id, name, logo, website_url, is_official, is_authorized_seller, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Amazon.ae', 'https://example.com/stores/amazon.png', 'https://amazon.ae', true, true, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Noon', 'https://example.com/stores/noon.png', 'https://noon.com', false, true, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Sharaf DG', 'https://example.com/stores/sharaf.png', 'https://sharafdg.com', false, true, true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Jumbo Electronics', 'https://example.com/stores/jumbo.png', 'https://jumbo.ae', false, true, true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Virgin Megastore', 'https://example.com/stores/virgin.png', 'https://virginmegastore.ae', false, true, true)
ON CONFLICT DO NOTHING;

-- iPhone 16 Pro
INSERT INTO products (brand_id, name, slug, description, launch_year, main_image, badge, is_active) VALUES
((SELECT id FROM brands WHERE slug = 'apple' LIMIT 1), 'iPhone 16 Pro', 'iphone-16-pro', 'Latest iPhone with A18 Pro chip and advanced camera system', 2024, 'https://example.com/products/iphone-16-pro.jpg', 'Best Choice', true)
ON CONFLICT (slug) DO UPDATE SET 
  brand_id = EXCLUDED.brand_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  launch_year = EXCLUDED.launch_year,
  main_image = EXCLUDED.main_image,
  badge = EXCLUDED.badge,
  is_active = EXCLUDED.is_active;

-- iPhone 16 Pro Variants
INSERT INTO product_variants (product_id, storage, color, color_hex, sku, is_available) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), '256GB', 'Natural Titanium', '#E8E3D9', 'IP16P-256-NT', true),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), '256GB', 'Blue Titanium', '#5B7C99', 'IP16P-256-BT', true),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), '256GB', 'Black Titanium', '#2C2C2E', 'IP16P-256-BK', true),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), '512GB', 'Natural Titanium', '#E8E3D9', 'IP16P-512-NT', true),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), '512GB', 'Blue Titanium', '#5B7C99', 'IP16P-512-BT', true),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), '1TB', 'Natural Titanium', '#E8E3D9', 'IP16P-1TB-NT', true),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), '1TB', 'Black Titanium', '#2C2C2E', 'IP16P-1TB-BK', true)
ON CONFLICT DO NOTHING;

-- iPhone 16 Pro Expert Ratings
INSERT INTO expert_ratings (product_id, overall_score, camera_score, battery_score, performance_score, display_score, camera_details, battery_details, performance_details, display_details, pros, cons) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 8.3, 8.0, 6.5, 9.5, 9.4, 
  '{"details": ["Solid cameras for the price", "Extra lens options (ultrawide/telephony)", "No OIS listed"]}',
  '{"details": ["Smaller battery capacity"]}',
  '{"details": ["High-end performance", "Smooth multitasking"]}',
  '{"details": ["OLED/AMOLED display", "High refresh rate"]}',
  ARRAY['Solid cameras for the price', 'Extra lens options (ultrawide/telephony)'],
  ARRAY['No OIS listed']
)
ON CONFLICT (product_id) DO UPDATE SET
  overall_score = EXCLUDED.overall_score,
  camera_score = EXCLUDED.camera_score,
  battery_score = EXCLUDED.battery_score,
  performance_score = EXCLUDED.performance_score,
  display_score = EXCLUDED.display_score,
  camera_details = EXCLUDED.camera_details,
  battery_details = EXCLUDED.battery_details,
  performance_details = EXCLUDED.performance_details,
  display_details = EXCLUDED.display_details,
  pros = EXCLUDED.pros,
  cons = EXCLUDED.cons;

-- iPhone 16 Pro Key Specifications
INSERT INTO key_specifications (product_id, icon, title, value, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'display', 'Display', '6.3" OLED, 120Hz Super Retina', 0),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'processor', 'Processor', 'Apple A18 Pro', 1),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'storage', 'Storage', '256GB / 512GB / 1TB', 2),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'battery', 'Battery', '3582 mAh, supports 25W fast charging', 3)
ON CONFLICT DO NOTHING;

-- iPhone 16 Pro Specifications (Display Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Display', 'Screen Size', '6.3"', 'screen', false, 0),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Display', 'Resolution', '2622 x 1206 pixels', null, false, 1),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Display', 'Display Type', 'OLED', null, false, 2),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Display', 'Refresh Rate', '120Hz', null, false, 3),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Display', 'Glass', 'Ceramic Shield', null, false, 4)
ON CONFLICT DO NOTHING;

-- iPhone 16 Pro Specifications (Performance Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Performance', 'Processor', 'Apple A18 Pro', 'cpu', false, 0),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Performance', 'RAM', '8GB', null, false, 1),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Performance', 'Storage', '256GB / 512GB / 1TB', null, false, 2),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Performance', 'GPU', 'Apple GPU (6-core)', null, false, 3)
ON CONFLICT DO NOTHING;

-- iPhone 16 Pro Specifications (Camera Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Camera', 'Main Camera', '48MP (f/1.78) + 12MP + 12MP', 'camera', false, 0),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Camera', 'Front Camera', '12MP', null, false, 1),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Camera', 'Video Recording', '4K @ 60fps', null, false, 2)
ON CONFLICT DO NOTHING;

-- iPhone 16 Pro Specifications (Battery Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Battery', 'Battery Capacity', '3582 mAh', 'battery', false, 0),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Battery', 'Charging', '25W fast charging', null, false, 1),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Battery', 'Wireless Charging', '15W', null, false, 2)
ON CONFLICT DO NOTHING;

-- iPhone 16 Pro Specifications (Connectivity Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Connectivity', 'Network', '5G, LTE', 'network', false, 0),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Connectivity', 'SIM', 'Dual SIM (Nano SIM + eSIM)', null, false, 1),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Connectivity', 'Wi-Fi', 'Wi-Fi 6E', null, false, 2),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Connectivity', 'Bluetooth', '5.3', null, false, 3),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Connectivity', 'USB', 'USB-C', null, false, 4)
ON CONFLICT DO NOTHING;

-- iPhone 16 Pro Specifications (Design Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Design', 'Dimensions', '149.6 x 71.5 x 8.25 mm', 'ruler', false, 0),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Design', 'Weight', '199g', null, false, 1),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Design', 'Build', 'Titanium frame, Glass back', null, false, 2),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Design', 'Colors', 'Natural Titanium, Blue Titanium, Black Titanium, White Titanium', null, false, 3),
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), 'Design', 'Water Resistance', 'IP68', null, false, 4)
ON CONFLICT DO NOTHING;

-- Sample prices for iPhone 16 Pro (256GB Natural Titanium variant - get the first one)
-- Note: In production, you'd get the actual variant IDs from the database
-- For now, this is a template showing the structure
-- You'll need to update variant_id with actual IDs after running the above inserts

/*
Example price insertions (update variant_id with actual IDs):

INSERT INTO prices (product_id, variant_id, store_id, price, old_price, affiliate_url) VALUES
((SELECT id FROM products WHERE slug = 'iphone-16-pro' LIMIT 1), '[VARIANT_ID]', (SELECT id FROM stores WHERE name = 'Amazon.ae' LIMIT 1), 80741, 84990, 'https://amazon.ae/...');

*/

-- Google Pixel 9 Pro
INSERT INTO products (brand_id, name, slug, description, launch_year, main_image, is_active) VALUES
((SELECT id FROM brands WHERE slug = 'google' LIMIT 1), 'Google Pixel 9 Pro', 'google-pixel-9-pro', 'Google flagship with Tensor G4 and advanced AI features', 2024, 'https://example.com/products/pixel-9-pro.jpg', true)
ON CONFLICT (slug) DO UPDATE SET 
  brand_id = EXCLUDED.brand_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  launch_year = EXCLUDED.launch_year,
  main_image = EXCLUDED.main_image,
  is_active = EXCLUDED.is_active;

-- Google Pixel 9 Pro Variants
INSERT INTO product_variants (product_id, storage, color, color_hex, sku, is_available) VALUES
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), '256GB', 'Porcelain', '#F4F1EB', 'GP9P-256-POR', true),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), '256GB', 'Hazel', '#C8B8A0', 'GP9P-256-HAZ', true),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), '512GB', 'Porcelain', '#F4F1EB', 'GP9P-512-POR', true),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), '1TB', 'Porcelain', '#F4F1EB', 'GP9P-1TB-POR', true)
ON CONFLICT DO NOTHING;

-- Google Pixel 9 Pro Expert Ratings
INSERT INTO expert_ratings (product_id, overall_score, camera_score, battery_score, performance_score, display_score, camera_details, battery_details, performance_details, display_details, pros, cons) VALUES
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 9.0, 8.6, 8.6, 9.0, 9.4,
  '{"details": ["Strong main camera for everyday shots", "Extra lens options (ultrawide/telephoto)"]}',
  '{"details": ["All-day battery for most users"]}',
  '{"details": ["Strong performance", "Smooth multitasking"]}',
  '{"details": ["OLED/AMOLED display", "High refresh rate"]}',
  ARRAY['Strong main camera for everyday shots', 'Extra lens options'],
  ARRAY[]::text[]
)
ON CONFLICT (product_id) DO UPDATE SET
  overall_score = EXCLUDED.overall_score,
  camera_score = EXCLUDED.camera_score,
  battery_score = EXCLUDED.battery_score,
  performance_score = EXCLUDED.performance_score,
  display_score = EXCLUDED.display_score,
  camera_details = EXCLUDED.camera_details,
  battery_details = EXCLUDED.battery_details,
  performance_details = EXCLUDED.performance_details,
  display_details = EXCLUDED.display_details,
  pros = EXCLUDED.pros,
  cons = EXCLUDED.cons;

-- Google Pixel 9 Pro Key Specifications
INSERT INTO key_specifications (product_id, icon, title, value, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'display', 'Display', '6.3" OLED, 120Hz Super Actua', 0),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'processor', 'Processor', 'Google Tensor G4', 1),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'storage', 'Storage', '256GB / 512GB', 2),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'battery', 'Battery', '5000 mAh, 27W fast charging', 3)
ON CONFLICT DO NOTHING;

-- Google Pixel 9 Pro Specifications (Display Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Display', 'Screen Size', '6.3" OLED, 120Hz Super Actua', 'screen', false, 0),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Display', 'Resolution', '2752 x 1290 pixels', null, false, 1),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Display', 'Display Type', 'LTPO OLED', null, false, 2),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Display', 'Glass', 'Gorilla Glass Victus 2', null, false, 3)
ON CONFLICT DO NOTHING;

-- Google Pixel 9 Pro Specifications (Performance Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Performance', 'Processor', 'Google Tensor G4', 'cpu', false, 0),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Performance', 'RAM', '16GB', null, false, 1),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Performance', 'Storage', '256GB / 512GB', null, false, 2),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Performance', 'Integrated GPU', 'Mali-G715', null, false, 3)
ON CONFLICT DO NOTHING;

-- Google Pixel 9 Pro Specifications (Camera Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Camera', 'Main Camera', '50MP + 48MP + 48MP', 'camera', false, 0),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Camera', 'UltraWide Camera', '48MP', null, false, 1),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Camera', 'Video Recording', '4K @ 60fps', null, false, 2)
ON CONFLICT DO NOTHING;

-- Google Pixel 9 Pro Specifications (Battery Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Battery', 'Battery Capacity', '5000 mAh, 27W fast charging', 'battery', false, 0),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Battery', 'Charging', '27W fast charging', null, false, 1),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Battery', 'Wireless Charging', '23W', null, false, 2)
ON CONFLICT DO NOTHING;

-- Google Pixel 9 Pro Specifications (Connectivity Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Connectivity', 'Network', '5G, 4G LTE', 'network', false, 0),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Connectivity', 'SIM', 'Dual SIM (Nano + eSIM)', null, false, 1),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Connectivity', 'Wi-Fi', 'Wi-Fi 7', null, false, 2),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Connectivity', 'Bluetooth', '5.3', null, false, 3),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Connectivity', 'NFC', 'Yes', null, false, 4)
ON CONFLICT DO NOTHING;

-- Google Pixel 9 Pro Specifications (Design Group)
INSERT INTO specifications (product_id, spec_group, spec_name, spec_value, icon, is_key_spec, sort_order) VALUES
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Design', 'Dimensions', '152.8 x 72 x 8.5 mm', 'ruler', false, 0),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Design', 'Weight', '199g', null, false, 1),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Design', 'Build', 'Gorilla Glass Victus 2', null, false, 2),
((SELECT id FROM products WHERE slug = 'google-pixel-9-pro' LIMIT 1), 'Design', 'Colors', 'Porcelain, Hazel, Obsidian, Rose', null, false, 3)
ON CONFLICT DO NOTHING;

-- Note: After running this script, you'll need to:
-- 1. Get the actual variant IDs from product_variants table
-- 2. Insert prices for each variant at different stores
-- 3. The best_price will be auto-calculated by the trigger
