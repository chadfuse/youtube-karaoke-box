-- Fix security vulnerability: Restrict global_settings access to admins only
-- Remove the policy that allows everyone to view global settings
DROP POLICY IF EXISTS "Everyone can view global settings" ON public.global_settings;

-- Create a new policy that only allows admins to view global settings
CREATE POLICY "Only admins can view global settings" 
ON public.global_settings 
FOR SELECT 
USING (is_admin(auth.uid()));