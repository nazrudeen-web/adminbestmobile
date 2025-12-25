-- Note: The old_price field in prices table is kept for future price history tracking
-- Currently not used in the admin UI as per frontend design requirements
-- 
-- Future implementation plan:
-- 1. Create a price_history table to track all price changes over time
-- 2. Use triggers to automatically log price changes when prices table is updated
-- 3. Display price history chart/timeline in product preview
--
-- For now, only current price is managed through the admin panel

-- Comment on the old_price column for documentation
COMMENT ON COLUMN prices.old_price IS 
'Reserved for future price history feature. Currently not used in admin UI. Will be replaced by price_history table.';

-- Optional: Create price_history table structure (not implemented yet, just documented for future)
/*
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_price_history_product (product_id, recorded_at),
  INDEX idx_price_history_variant (variant_id, recorded_at)
);
*/
