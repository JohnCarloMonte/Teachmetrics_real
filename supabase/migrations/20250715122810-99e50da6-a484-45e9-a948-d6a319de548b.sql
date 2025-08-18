-- First, let's clean up any potential orphaned users and profiles
-- Check if there are any profiles with the USN you're trying to use
DELETE FROM public.profiles WHERE usn = '21111111111';

-- Let's also check the trigger is working properly
-- Drop and recreate the trigger to ensure it's functioning
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();