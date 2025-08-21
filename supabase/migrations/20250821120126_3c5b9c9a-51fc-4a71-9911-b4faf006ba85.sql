-- Create admin role system
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';

-- Create admin credentials - update the default admin user
-- You'll need to sign up with admin@chado.app first, then this will upgrade that user to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@chado.app' 
  LIMIT 1
);

-- Create a function to check if a user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role = 'admin'
  );
$$;

-- Create trigger to ensure admin emails get admin role
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this is an admin email
  IF NEW.email = 'admin@chado.app' THEN
    UPDATE public.profiles 
    SET role = 'admin'
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for admin signup
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_admin_signup();