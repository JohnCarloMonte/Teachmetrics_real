-- Add comprehensive teacher assignments for all sections to enable testing
INSERT INTO public.teacher_assignments (teacher_id, level, strand_course, section, subject) VALUES
-- Missing sections and comprehensive assignments
-- College sections
((SELECT id FROM public.teachers WHERE name = 'Dr. Maria Santos'), 'college', 'ACT', '2-1', 'Advanced Programming'),
((SELECT id FROM public.teachers WHERE name = 'Prof. Miguel Torres'), 'college', 'ACT', '2-1', 'Database Management'),

-- Additional BSE assignments
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'college', 'BSE', '2-1', 'English Methodology'),
((SELECT id FROM public.teachers WHERE name = 'Prof. John Reyes'), 'college', 'BSE', '2-1', 'Mathematics Pedagogy'),

-- Comprehensive SHS assignments for TVL sections
((SELECT id FROM public.teachers WHERE name = 'Prof. Miguel Torres'), 'shs', 'TVL', '9-1', 'Technical Skills'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Patricia Aquino'), 'shs', 'TVL', '9-1', 'Work Ethics'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Roberto Cruz'), 'shs', 'TVL', '8-1', 'Applied Science'),

-- Add more GAS assignments  
((SELECT id FROM public.teachers WHERE name = 'Prof. John Reyes'), 'shs', 'GAS', '8-1', 'Pre-Calculus'),
((SELECT id FROM public.teachers WHERE name = 'Mr. Carlos Villanueva'), 'shs', 'GAS', '9-1', 'Contemporary Philippine Arts'),

-- Add more ABM assignments
((SELECT id FROM public.teachers WHERE name = 'Prof. Elena Mendoza'), 'shs', 'ABM', '9-1', 'Business Ethics'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Roberto Cruz'), 'shs', 'ABM', '8-1', 'Applied Economics'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'shs', 'ABM', '8-1', 'Business Communication'),

-- Additional HUMSS assignments to ensure all sections covered
((SELECT id FROM public.teachers WHERE name = 'Prof. Elena Mendoza'), 'shs', 'HUMSS', '9-1', 'Introduction to World Religions'),
((SELECT id FROM public.teachers WHERE name = 'Prof. John Reyes'), 'shs', 'HUMSS', '9-2', 'Statistics and Probability'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Roberto Cruz'), 'shs', 'HUMSS', '9-3', 'Earth and Life Science'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Patricia Aquino'), 'shs', 'HUMSS', '9-4', 'Personal Development')

ON CONFLICT (teacher_id, level, strand_course, section, subject) DO NOTHING;

-- Add additional profile fields for better user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS strand_course text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level text;