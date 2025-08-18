-- Add columns for level and subjects to teachers table
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'both';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}';

-- Add constraint for level values
ALTER TABLE public.teachers ADD CONSTRAINT teachers_level_check 
CHECK (level IN ('shs', 'college', 'both'));

-- Insert 10 sample teachers with academic subjects and levels
INSERT INTO public.teachers (name, department, is_active, level, subjects) VALUES
('Dr. Maria Santos', 'Computer Science', true, 'college', ARRAY['Programming Fundamentals', 'Data Structures', 'Database Systems', 'Software Engineering']),
('Prof. John Reyes', 'Mathematics', true, 'both', ARRAY['Calculus', 'Statistics', 'General Mathematics', 'Algebra']),
('Ms. Ana Garcia', 'English', true, 'shs', ARRAY['English for Academic Purposes', 'Creative Writing', 'Literature', 'Reading and Writing']),
('Dr. Roberto Cruz', 'Science', true, 'both', ARRAY['Physics', 'Chemistry', 'General Science', 'Research Methods']),
('Prof. Elena Mendoza', 'Business', true, 'college', ARRAY['Business Management', 'Entrepreneurship', 'Marketing', 'Business Ethics']),
('Mr. Carlos Villanueva', 'Social Studies', true, 'shs', ARRAY['Philippine History', 'World History', 'Political Science', 'Economics']),
('Dr. Lisa Fernandez', 'Psychology', true, 'college', ARRAY['General Psychology', 'Developmental Psychology', 'Research Psychology', 'Abnormal Psychology']),
('Ms. Grace Morales', 'Arts', true, 'shs', ARRAY['Visual Arts', 'Music', 'Theater Arts', 'Creative Arts']),
('Prof. Miguel Torres', 'Engineering', true, 'college', ARRAY['Engineering Mathematics', 'Mechanics', 'Thermodynamics', 'Engineering Design']),
('Ms. Patricia Aquino', 'Physical Education', true, 'both', ARRAY['Physical Education', 'Health Education', 'Sports', 'Wellness']);

-- Create index on level for better query performance
CREATE INDEX IF NOT EXISTS idx_teachers_level ON public.teachers(level);

-- Create index on subjects using GIN for array operations
CREATE INDEX IF NOT EXISTS idx_teachers_subjects ON public.teachers USING GIN(subjects);