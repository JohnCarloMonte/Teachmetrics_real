-- First, let's add missing columns to the evaluations table to match current localStorage structure
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS student_usn TEXT;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS teacher_position TEXT;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS strand_course TEXT;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS evaluation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS answers JSONB;

-- Create an index on student_usn for better performance
CREATE INDEX IF NOT EXISTS idx_evaluations_student_usn ON public.evaluations(student_usn);

-- Create an index on teacher_id for better performance  
CREATE INDEX IF NOT EXISTS idx_evaluations_teacher_id ON public.evaluations(teacher_id);

-- Update the evaluations table to use profile ids instead of raw user ids
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_student_id_fkey;
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_teacher_id_fkey;

-- Add foreign key constraints that reference the correct tables
ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Update RLS policies to work with the new structure
DROP POLICY IF EXISTS "Students can view their own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Students can create evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Admins can view all evaluations" ON public.evaluations;

-- Create updated RLS policies
CREATE POLICY "Students can view their own evaluations" 
ON public.evaluations 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can create evaluations" 
ON public.evaluations 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all evaluations" 
ON public.evaluations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin' 
  AND profiles.is_approved = true
));

CREATE POLICY "Admins can manage evaluations" 
ON public.evaluations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin' 
  AND profiles.is_approved = true
));