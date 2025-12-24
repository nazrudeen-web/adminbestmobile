-- Make best-price calculation null-safe for stock_status
-- If stock_status is NULL (older rows), treat it as in_stock

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
        AND COALESCE(stock_status, 'in_stock') <> 'out_of_stock'
    ),
    best_store_id = (
      SELECT store_id
      FROM prices
      WHERE product_id = target_product_id
        AND COALESCE(stock_status, 'in_stock') <> 'out_of_stock'
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
