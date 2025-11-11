
-- Add is_active column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Update existing products to set is_active to true if null
UPDATE products SET is_active = true WHERE is_active IS NULL;
