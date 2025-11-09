
-- Migration to increase price precision in products table
-- Change from DECIMAL(10,2) to DECIMAL(18,2) to support larger prices

ALTER TABLE products 
  ALTER COLUMN price TYPE DECIMAL(18, 2),
  ALTER COLUMN after_tax_price TYPE DECIMAL(18, 2),
  ALTER COLUMN before_tax_price TYPE DECIMAL(18, 2);

-- Add comment
COMMENT ON COLUMN products.price IS 'Product price - supports up to 999,999,999,999,999.99';
COMMENT ON COLUMN products.after_tax_price IS 'Price after tax - supports up to 999,999,999,999,999.99';
COMMENT ON COLUMN products.before_tax_price IS 'Price before tax - supports up to 999,999,999,999,999.99';
