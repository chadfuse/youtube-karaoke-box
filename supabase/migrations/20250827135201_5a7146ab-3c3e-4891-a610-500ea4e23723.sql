-- Fix security issue: Restrict profiles table access to user's own data only
-- Remove the overly permissive policy that allows everyone to view all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a secure policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure other existing policies remain intact (insert and update own profile)
-- The existing policies "Users can insert their own profile" and "Users can update their own profile" are already secure