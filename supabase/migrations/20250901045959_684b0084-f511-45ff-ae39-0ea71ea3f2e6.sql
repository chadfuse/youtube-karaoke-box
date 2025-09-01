-- Ensure unique key for upserts on global_settings
DO $$ BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'global_settings_key_unique'
  ) THEN
    ALTER TABLE public.global_settings
    ADD CONSTRAINT global_settings_key_unique UNIQUE (key);
  END IF;
END $$;

-- Add/update trigger to maintain updated_at on updates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_global_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_global_settings_updated_at
    BEFORE UPDATE ON public.global_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;