-- Create password reset requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  usn TEXT NOT NULL,
  full_name TEXT NOT NULL,
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for password reset requests
CREATE POLICY "Anyone can create password reset requests" 
ON public.password_reset_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all password reset requests" 
ON public.password_reset_requests 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update password reset requests" 
ON public.password_reset_requests 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete password reset requests" 
ON public.password_reset_requests 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Add trigger for timestamp updates
CREATE TRIGGER update_password_reset_requests_updated_at
BEFORE UPDATE ON public.password_reset_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to store plain text passwords
ALTER TABLE public.profiles 
ALTER COLUMN password_hash TYPE TEXT;

-- Update admin_credentials table to store plain text passwords  
ALTER TABLE public.admin_credentials 
ALTER COLUMN password_hash TYPE TEXT;