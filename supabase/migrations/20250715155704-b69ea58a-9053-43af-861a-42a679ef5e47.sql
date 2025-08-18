-- Fix RLS policies for admin_credentials table
DROP POLICY IF EXISTS "Only admins can update admin credentials" ON public.admin_credentials;
DROP POLICY IF EXISTS "Public can read admin credentials for login" ON public.admin_credentials;

-- Create more permissive policies for admin_credentials
CREATE POLICY "Anyone can read admin credentials for login verification" 
ON public.admin_credentials 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update admin credentials" 
ON public.admin_credentials 
FOR UPDATE 
USING (true);

-- Ensure profiles table has proper status column and default value
ALTER TABLE public.profiles 
ALTER COLUMN status SET DEFAULT 'pending';

-- Update any existing NULL status values to 'pending'
UPDATE public.profiles 
SET status = 'pending' 
WHERE status IS NULL;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);

-- Create a simple function to update profile status
CREATE OR REPLACE FUNCTION public.update_profile_status(
    profile_id UUID,
    new_status TEXT,
    new_is_approved BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        status = new_status,
        is_approved = new_is_approved,
        updated_at = NOW()
    WHERE id = profile_id;
END;
$$;

-- Ensure admin_credentials table has proper structure
-- If there's no admin record, create one
INSERT INTO public.admin_credentials (email, password_hash)
VALUES ('jerome.samante@aclc.edu.ph', 'admin123')
ON CONFLICT (email) DO NOTHING;

-- Drop and recreate trigger if it exists
DROP TRIGGER IF EXISTS update_admin_credentials_updated_at ON public.admin_credentials;
CREATE TRIGGER update_admin_credentials_updated_at
    BEFORE UPDATE ON public.admin_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();