-- Add teacher assignments for ACT 1-1 section only (avoiding duplicates)
INSERT INTO public.teacher_assignments (teacher_id, level, strand_course, section, subject) VALUES
((SELECT id FROM public.teachers WHERE name = 'Prof. John Reyes'), 'college', 'ACT', '1-1', 'Business Mathematics'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Roberto Cruz'), 'college', 'ACT', '1-1', 'Business Statistics'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'college', 'ACT', '1-1', 'Business Communication'),
((SELECT id FROM public.teachers WHERE name = 'Mr. Carlos Villanueva'), 'college', 'ACT', '1-1', 'Business Ethics'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Patricia Aquino'), 'college', 'ACT', '1-1', 'Physical Education')
ON CONFLICT (teacher_id, level, strand_course, section, subject) DO NOTHING;