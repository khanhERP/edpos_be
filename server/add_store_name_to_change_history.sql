
-- Add store_name column to order_change_history table
ALTER TABLE order_change_history 
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);

-- Create index for better performance when searching by store name
CREATE INDEX IF NOT EXISTS idx_order_change_history_store_name 
ON order_change_history(store_name);

-- Update existing records with store names from store_settings table
UPDATE order_change_history och
SET store_name = ss.store_name
FROM store_settings ss
WHERE och.store_code = ss.store_code
AND och.store_name IS NULL;
