-- Update the trigger function to properly extract phone number from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    phone_number,
    usn,
    full_name,
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
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'usn',
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    NEW.raw_user_meta_data ->> 'level',
    NEW.raw_user_meta_data ->> 'strand_course',
    NEW.raw_user_meta_data ->> 'section',
    CAST(NEW.raw_user_meta_data ->> 'year_level' AS INTEGER),
    NEW.raw_user_meta_data ->> 'semester',
    false
  );
  RETURN NEW;
END;
$function$;