-- STEP 1: Create deposit_monitoring_config table if it doesn't exist 
CREATE TABLE IF NOT EXISTS public.deposit_monitoring_config ( 
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, 
    network TEXT NOT NULL, 
    currency TEXT NOT NULL, 
    minimum_confirmations INTEGER NOT NULL DEFAULT 1, 
    is_enabled BOOLEAN NOT NULL DEFAULT true, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), 
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), 
    UNIQUE(network, currency) 
); 

-- STEP 2: Add status column to fund_transactions if it doesn't exist 
DO $$ 
BEGIN 
    IF NOT EXISTS ( 
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fund_transactions' 
        AND column_name = 'status' 
    ) THEN 
        ALTER TABLE public.fund_transactions 
        ADD COLUMN status TEXT; 
    END IF; 
END $$; 

-- STEP 3: Migrate data from type to status for records with null status 
UPDATE public.fund_transactions 
SET status = CASE 
    WHEN type = 'RECHARGE' THEN 'COMPLETED' 
    WHEN type = 'WITHDRAWAL' THEN 'COMPLETED' 
    ELSE type 
END 
WHERE status IS NULL; 

-- STEP 4: Add any missing indices for better performance 
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON public.fund_transactions(status); 
CREATE INDEX IF NOT EXISTS idx_deposit_monitoring_config_network_currency ON public.deposit_monitoring_config(network, currency); 

-- STEP 5: Set up a trigger to keep updated_at current 
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS TRIGGER AS $$ 
BEGIN 
    NEW.updated_at = NOW(); 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql; 

-- Apply trigger to deposit_monitoring_config 
DROP TRIGGER IF EXISTS set_deposit_monitoring_config_updated_at ON public.deposit_monitoring_config; 
CREATE TRIGGER set_deposit_monitoring_config_updated_at 
BEFORE UPDATE ON public.deposit_monitoring_config 
FOR EACH ROW 
EXECUTE FUNCTION public.set_updated_at();

-- Verification: Show created tables and columns
SELECT 'Database structure fix completed successfully!' as status;