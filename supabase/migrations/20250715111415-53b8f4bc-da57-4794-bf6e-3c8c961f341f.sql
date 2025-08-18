-- Add more teacher assignments to cover missing sections like ACT 1-1
INSERT INTO public.teacher_assignments (teacher_id, level, strand_course, section, subject) VALUES
-- Add assignments for ACT 1-1 (missing section that user mentioned)
((SELECT id FROM public.teachers WHERE name = 'Prof. Elena Mendoza'), 'college', 'ACT', '1-1', 'Business Management'),
((SELECT id FROM public.teachers WHERE name = 'Prof. Elena Mendoza'), 'college', 'ACT', '1-1', 'Entrepreneurship'),
((SELECT id FROM public.teachers WHERE name = 'Prof. John Reyes'), 'college', 'ACT', '1-1', 'Business Mathematics'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Roberto Cruz'), 'college', 'ACT', '1-1', 'Business Statistics'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'college', 'ACT', '1-1', 'Business Communication'),

-- Add more comprehensive assignments for other sections to ensure all sections have teachers
-- BSE (Bachelor of Secondary Education) sections
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'college', 'BSE', '1-1', 'English Literature'),
((SELECT id FROM public.teachers WHERE name = 'Prof. John Reyes'), 'college', 'BSE', '1-1', 'Mathematics for Educators'),
((SELECT id FROM public.teachers WHERE name = 'Mr. Carlos Villanueva'), 'college', 'BSE', '1-1', 'Social Studies Education'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Lisa Fernandez'), 'college', 'BSE', '2-1', 'Educational Psychology'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Grace Morales'), 'college', 'BSE', '2-1', 'Arts in Education'),

-- Additional BSIT assignments to ensure comprehensive coverage
((SELECT id FROM public.teachers WHERE name = 'Dr. Maria Santos'), 'college', 'BSIT', '1-1', 'Introduction to Computing'),
((SELECT id FROM public.teachers WHERE name = 'Prof. Miguel Torres'), 'college', 'BSIT', '2-1', 'Software Engineering'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Roberto Cruz'), 'college', 'BSIT', '4-1', 'Research Methods'),

-- Additional SHS assignments
-- ABM 8-1 and 9-1 assignments
((SELECT id FROM public.teachers WHERE name = 'Prof. Elena Mendoza'), 'shs', 'ABM', '8-1', 'Business Finance'),
((SELECT id FROM public.teachers WHERE name = 'Mr. Carlos Villanueva'), 'shs', 'ABM', '8-1', 'Business Ethics'),

-- GAS (General Academic Strand) comprehensive assignments
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'shs', 'GAS', '8-1', 'Communication Arts'),
((SELECT id FROM public.teachers WHERE name = 'Dr. Lisa Fernandez'), 'shs', 'GAS', '8-1', 'Personal Development'),

-- TVL assignments
((SELECT id FROM public.teachers WHERE name = 'Prof. Miguel Torres'), 'shs', 'TVL', '8-1', 'Technical Drawing'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Patricia Aquino'), 'shs', 'TVL', '8-1', 'Work Immersion'),

-- HUMSS additional comprehensive assignments
((SELECT id FROM public.teachers WHERE name = 'Dr. Lisa Fernandez'), 'shs', 'HUMSS', '9-1', 'Psychology'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Ana Garcia'), 'shs', 'HUMSS', '9-2', 'Literature'),
((SELECT id FROM public.teachers WHERE name = 'Mr. Carlos Villanueva'), 'shs', 'HUMSS', '9-3', 'Sociology'),
((SELECT id FROM public.teachers WHERE name = 'Ms. Grace Morales'), 'shs', 'HUMSS', '9-4', 'Creative Arts');