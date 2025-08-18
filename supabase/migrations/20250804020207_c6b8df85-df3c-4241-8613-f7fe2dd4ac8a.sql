-- Create student_evaluation_lists table to store personalized teacher lists for each student
CREATE TABLE IF NOT EXISTS public.student_evaluation_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  level TEXT NOT NULL,
  strand_course TEXT NOT NULL,
  section TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, teacher_id, subject)
);

-- Enable RLS
ALTER TABLE public.student_evaluation_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for student_evaluation_lists
CREATE POLICY "Students can manage their own evaluation lists" 
ON public.student_evaluation_lists 
FOR ALL 
USING (auth.uid()::text = student_id::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_student_evaluation_lists_updated_at
BEFORE UPDATE ON public.student_evaluation_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();