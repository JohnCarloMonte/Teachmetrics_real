-- Update the profiles table RLS policies to allow admin access without authentication
-- First, let's add a temporary policy to allow admin access to profiles

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a more permissive policy for admin access
CREATE POLICY "Admins can view all profiles without auth" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Keep the existing policies for regular users
-- Users can still view their own profile when authenticated