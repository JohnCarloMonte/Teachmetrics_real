-- Drop the existing policy that requires authentication
DROP POLICY IF EXISTS "Only admins can manage admin credentials" ON public.admin_credentials;

-- Create a new policy that allows public read access for login
CREATE POLICY "Public can read admin credentials for login" 
ON public.admin_credentials 
FOR SELECT 
USING (true);

-- Create a policy that only allows admins to update admin credentials
CREATE POLICY "Only admins can update admin credentials" 
ON public.admin_credentials 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Create a policy that only allows admins to insert admin credentials
CREATE POLICY "Only admins can insert admin credentials" 
ON public.admin_credentials 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Create a policy that only allows admins to delete admin credentials
CREATE POLICY "Only admins can delete admin credentials" 
ON public.admin_credentials 
FOR DELETE 
USING (is_admin(auth.uid()));