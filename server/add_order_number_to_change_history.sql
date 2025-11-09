
-- Add order_number column to order_change_history table
ALTER TABLE order_change_history 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);

-- Create index for better performance when searching by order number
CREATE INDEX IF NOT EXISTS idx_order_change_history_order_number 
ON order_change_history(order_number);

-- Update existing records with order numbers from orders table
UPDATE order_change_history och
SET order_number = o.order_number
FROM orders o
WHERE och.order_id = o.id
AND och.order_number IS NULL;
