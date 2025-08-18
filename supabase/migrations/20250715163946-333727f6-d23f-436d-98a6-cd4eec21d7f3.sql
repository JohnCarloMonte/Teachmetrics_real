-- Add a password column to profiles table for plain text storage
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Update existing profiles to use their password_hash as password (migration fix)
UPDATE public.profiles SET password = COALESCE(password_hash, 'student123') WHERE password IS NULL;

-- Update the handle_new_user function to also store password from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    phone_number,
    usn,
    full_name,
    password,
    role, 
    level,
    strand_course,
    section,
    year_level,
    semester,
    is_approved
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'usn',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'password',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    NEW.raw_user_meta_data ->> 'level',
    NEW.raw_user_meta_data ->> 'strand_course',
    NEW.raw_user_meta_data ->> 'section',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'year_level' IS NOT NULL 
      THEN CAST(NEW.raw_user_meta_data ->> 'year_level' AS INTEGER)
      ELSE NULL
    END,
    NEW.raw_user_meta_data ->> 'semester',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'role', 'student') = 'admin' THEN true
      ELSE false
    END
  );
  RETURN NEW;
END;
$function$;