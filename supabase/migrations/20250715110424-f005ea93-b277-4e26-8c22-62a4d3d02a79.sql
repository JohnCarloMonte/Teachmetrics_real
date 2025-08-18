-- Fix infinite recursion in RLS policies by creating a security definer function
-- This function bypasses RLS when checking user roles

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Admins can manage evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;

-- Create a security definer function to check user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = $1 LIMIT 1;
$$;

-- Create a security definer function to check if user is approved admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 
    AND profiles.role = 'admin' 
    AND profiles.is_approved = true
  );
$$;

-- Recreate policies using the security definer functions
CREATE POLICY "Admins can view all evaluations" 
ON public.evaluations 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage evaluations" 
ON public.evaluations 
FOR ALL 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage teachers" 
ON public.teachers 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add teacher assignment tables for strands/courses and sections
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('shs', 'college')),
  strand_course text NOT NULL,
  section text NOT NULL,
  subject text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(teacher_id, level, strand_course, section, subject)
);

-- Enable RLS on teacher_assignments
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher_assignments
CREATE POLICY "Everyone can view teacher assignments" 
ON public.teacher_assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage teacher assignments" 
ON public.teacher_assignments 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Create trigger for teacher_assignments updated_at
CREATE TRIGGER update_teacher_assignments_updated_at
BEFORE UPDATE ON public.teacher_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample teacher assignments
INSERT INTO public.teacher_assignments (teacher_id, level, strand_course, section, subject) VALUES
-- Dr. Maria Santos (Computer Science - College)
((SELECT id FROM public.teachers WHERE name = 'Dr. Maria Santos'), 'college', 'BSIT', '1-1', 'Programming Fundamentals'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Maria Santos'), 'college', 'BSIT', '2-1', 'Data Structures'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Maria Santos'), 'college', 'BSIT', '3-1', 'Database Systems'),

-- Prof. John Reyes (Mathematics - Both)
((SELECT id FROM public.teachers WHERE name = 'Prof. John Reyes'), 'college', 'BSIT', '1-1', 'Calculus'),
((SELECT id FROM public.teachers WHERE name = 'Prof. John Reyes'), 'shs', 'ABM', '9-1', 'General Mathematics'),
((SELECT id FROM public.teachers WHERE name = 'Prof. John Reyes'), 'shs', 'GAS', '9-1', 'Statistics'),

-- Ms. Ana Garcia (English - SHS)
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'shs', 'HUMSS', '9-1', 'English for Academic Purposes'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'shs', 'HUMSS', '9-2', 'Creative Writing'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'shs', 'ABM', '9-1', 'Reading and Writing'),

-- Dr. Roberto Cruz (Science - Both)
((SELECT id FROM public.teachers WHERE name = 'Dr. Roberto Cruz'), 'college', 'BSE', '1-1', 'Physics'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Roberto Cruz'), 'shs', 'GAS', '9-1', 'Chemistry'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Roberto Cruz'), 'shs', 'TVL', '9-1', 'General Science'),

-- Prof. Elena Mendoza (Business - College)
((SELECT id FROM public.teachers WHERE name = 'Prof. Elena Mendoza'), 'college', 'ACT', '1-1', 'Business Management'),
((SELECT id FROM public.teachers WHERE name = 'Prof. Elena Mendoza'), 'college', 'ACT', '2-1', 'Entrepreneurship'),

-- Mr. Carlos Villanueva (Social Studies - SHS)
((SELECT id FROM public.teachers WHERE name = 'Mr. Carlos Villanueva'), 'shs', 'HUMSS', '9-1', 'Philippine History'),
((SELECT id FROM public.teachers WHERE name = 'Mr. Carlos Villanueva'), 'shs', 'HUMSS', '9-2', 'World History'),
((SELECT id FROM public.teachers WHERE name = 'Mr. Carlos Villanueva'), 'shs', 'ABM', '9-1', 'Economics'),

-- Dr. Lisa Fernandez (Psychology - College)
((SELECT id FROM public.teachers WHERE name = 'Dr. Lisa Fernandez'), 'college', 'BSE', '1-1', 'General Psychology'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Lisa Fernandez'), 'college', 'BSE', '2-1', 'Developmental Psychology'),

-- Ms. Grace Morales (Arts - SHS)
((SELECT id FROM public.teachers WHERE name = 'Ms. Grace Morales'), 'shs', 'HUMSS', '9-3', 'Visual Arts'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Grace Morales'), 'shs', 'HUMSS', '9-4', 'Music'),

-- Prof. Miguel Torres (Engineering - College)
((SELECT id FROM public.teachers WHERE name = 'Prof. Miguel Torres'), 'college', 'BSIT', '3-1', 'Engineering Mathematics'),
((SELECT id FROM public.teachers WHERE name = 'Prof. Miguel Torres'), 'college', 'BSIT', '4-1', 'Engineering Design'),

-- Ms. Patricia Aquino (Physical Education - Both)
((SELECT id FROM public.teachers WHERE name = 'Ms. Patricia Aquino'), 'shs', 'ABM', '8-1', 'Physical Education'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Patricia Aquino'), 'shs', 'GAS', '8-1', 'Health Education'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Patricia Aquino'), 'college', 'BSIT', '1-1', 'Physical Education'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Patricia Aquino'), 'college', 'ACT', '1-1', 'Wellness');