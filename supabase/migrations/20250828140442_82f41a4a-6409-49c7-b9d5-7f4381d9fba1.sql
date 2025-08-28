-- Create global_settings table for admin-configured settings
CREATE TABLE public.global_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage global settings
CREATE POLICY "Only admins can manage global settings" 
ON public.global_settings 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Everyone can view global settings (for API keys, etc.)
CREATE POLICY "Everyone can view global settings" 
ON public.global_settings 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_global_settings_updated_at
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();