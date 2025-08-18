-- Add status field to profiles table to track approval status
ALTER TABLE public.profiles 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined'));

-- Update existing records based on is_approved field
UPDATE public.profiles 
SET status = CASE 
  WHEN is_approved = true THEN 'approved'
  ELSE 'pending'
END;

-- Create index on status for better query performance
CREATE INDEX idx_profiles_status ON public.profiles(status);