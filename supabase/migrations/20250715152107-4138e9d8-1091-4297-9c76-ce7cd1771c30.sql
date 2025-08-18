-- Create table for admin credentials
CREATE TABLE public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Only admins can manage admin credentials" 
ON public.admin_credentials 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_credentials_updated_at
BEFORE UPDATE ON public.admin_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin credentials (you should change these)
INSERT INTO public.admin_credentials (email, password_hash) 
VALUES ('jerome.samante@aclc.edu.ph', 'admin123');