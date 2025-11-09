
-- Add store_code column to price_lists table
ALTER TABLE price_lists 
ADD COLUMN IF NOT EXISTS store_code VARCHAR(50);

-- Add store_code column to price_list_items table
ALTER TABLE price_list_items 
ADD COLUMN IF NOT EXISTS store_code VARCHAR(50);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_price_lists_store_code ON price_lists(store_code);
CREATE INDEX IF NOT EXISTS idx_price_list_items_store_code ON price_list_items(store_code);
