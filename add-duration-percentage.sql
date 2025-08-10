-- Add duration_percentage column to trading_orders table
ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS duration_percentage DECIMAL(5,2);

-- Update existing records to have a default duration percentage
UPDATE trading_orders 
SET duration_percentage = 100.0 
WHERE duration_percentage IS NULL AND type = 'binary';

-- Success message
SELECT 'Duration percentage column added successfully!' as status; 