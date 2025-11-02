-- Drop the existing restrictive SELECT policy on global_settings
DROP POLICY IF EXISTS "Only admins can view global settings" ON public.global_settings;

-- Create a new policy that allows everyone to read the header_script setting
CREATE POLICY "Anyone can view header_script setting"
ON public.global_settings
FOR SELECT
USING (key = 'header_script');

-- Create a policy for admins to view all other settings
CREATE POLICY "Admins can view all settings"
ON public.global_settings
FOR SELECT
USING (is_admin(auth.uid()));
