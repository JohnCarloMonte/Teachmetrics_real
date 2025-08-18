-- Create questionnaire table for easy modification
CREATE TABLE public.evaluation_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'rating', -- 'rating', 'text'
  question_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluation settings table
CREATE TABLE public.evaluation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_semester TEXT NOT NULL DEFAULT '1st Semester',
  school_year TEXT NOT NULL DEFAULT '2024-2025',
  is_evaluation_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create section capacity table
CREATE TABLE public.section_capacity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL,
  strand_course TEXT NOT NULL,
  section TEXT NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 40,
  current_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(level, strand_course, section)
);

-- Create teacher evaluation results table
CREATE TABLE public.teacher_evaluation_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  evaluation_period TEXT NOT NULL,
  overall_rating DECIMAL(3,2) NOT NULL,
  total_evaluations INTEGER NOT NULL DEFAULT 0,
  average_scores JSONB, -- Store individual question averages
  positive_comments TEXT[],
  negative_comments TEXT[],
  flagged_comments TEXT[], -- AI-detected inappropriate comments
  suggestions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comment analysis table for AI flagging
CREATE TABLE public.comment_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  comment_type TEXT NOT NULL, -- 'positive', 'negative', 'suggestion'
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT, -- 'offensive', 'inappropriate', 'spam', 'unrelated'
  language_detected TEXT, -- 'english', 'tagalog', 'taglish'
  admin_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default evaluation questions
INSERT INTO public.evaluation_questions (question_text, question_order) VALUES
('How would you rate the teacher''s effectiveness in delivering lessons?', 1),
('How well does the teacher manage the classroom environment?', 2),
('How relevant and up-to-date is the course content presented?', 3),
('How responsive is the teacher to student questions and concerns?', 4);

-- Insert default evaluation settings
INSERT INTO public.evaluation_settings (current_semester, school_year) VALUES
('1st Semester', '2024-2025');

-- Enable RLS on new tables
ALTER TABLE public.evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_evaluation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for evaluation_questions
CREATE POLICY "Everyone can view active questions" ON public.evaluation_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage questions" ON public.evaluation_questions FOR ALL USING (is_admin(auth.uid()));

-- Create policies for evaluation_settings
CREATE POLICY "Everyone can view evaluation settings" ON public.evaluation_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage evaluation settings" ON public.evaluation_settings FOR ALL USING (is_admin(auth.uid()));

-- Create policies for section_capacity
CREATE POLICY "Everyone can view section capacity" ON public.section_capacity FOR SELECT USING (true);
CREATE POLICY "Admins can manage section capacity" ON public.section_capacity FOR ALL USING (is_admin(auth.uid()));

-- Create policies for teacher_evaluation_results
CREATE POLICY "Admins can view all evaluation results" ON public.teacher_evaluation_results FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage evaluation results" ON public.teacher_evaluation_results FOR ALL USING (is_admin(auth.uid()));

-- Create policies for comment_analysis
CREATE POLICY "Admins can view comment analysis" ON public.comment_analysis FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage comment analysis" ON public.comment_analysis FOR ALL USING (is_admin(auth.uid()));

-- Create triggers for updated_at columns
CREATE TRIGGER update_evaluation_questions_updated_at BEFORE UPDATE ON public.evaluation_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_evaluation_settings_updated_at BEFORE UPDATE ON public.evaluation_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_section_capacity_updated_at BEFORE UPDATE ON public.section_capacity FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teacher_evaluation_results_updated_at BEFORE UPDATE ON public.teacher_evaluation_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update section counts
CREATE OR REPLACE FUNCTION public.update_section_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- First, insert missing sections based on existing profiles
  INSERT INTO public.section_capacity (level, strand_course, section)
  SELECT DISTINCT p.level, p.strand_course, p.section
  FROM public.profiles p
  WHERE p.level IS NOT NULL 
    AND p.strand_course IS NOT NULL 
    AND p.section IS NOT NULL
    AND p.role = 'student'
    AND NOT EXISTS (
      SELECT 1 FROM public.section_capacity sc 
      WHERE sc.level = p.level 
        AND sc.strand_course = p.strand_course 
        AND sc.section = p.section
    );

  -- Update current counts
  UPDATE public.section_capacity 
  SET current_count = (
    SELECT COUNT(*)
    FROM public.profiles p
    WHERE p.level = section_capacity.level
      AND p.strand_course = section_capacity.strand_course
      AND p.section = section_capacity.section
      AND p.role = 'student'
      AND p.is_approved = true
  );
END;
$$;

-- Initialize section capacity data
SELECT public.update_section_counts();

-- Assign 4 teachers per section
INSERT INTO public.teacher_assignments (teacher_id, level, strand_course, section, subject)
SELECT 
  t.id,
  sc.level,
  sc.strand_course,
  sc.section,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY sc.level, sc.strand_course, sc.section ORDER BY t.name) = 1 THEN 'Mathematics'
    WHEN ROW_NUMBER() OVER (PARTITION BY sc.level, sc.strand_course, sc.section ORDER BY t.name) = 2 THEN 'English'
    WHEN ROW_NUMBER() OVER (PARTITION BY sc.level, sc.strand_course, sc.section ORDER BY t.name) = 3 THEN 'Science'
    ELSE 'Social Studies'
  END
FROM public.section_capacity sc
CROSS JOIN (
  SELECT id, name, ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM public.teachers 
  WHERE is_active = true
) t
WHERE t.rn <= 4
ON CONFLICT (teacher_id, level, strand_course, section, subject) DO NOTHING;