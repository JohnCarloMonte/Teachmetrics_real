-- Update evaluation results computation to calculate percentages up to 100%
-- Create new view for teacher rankings and enhanced evaluation system

-- Create function to update teacher evaluation results with percentages and rankings
CREATE OR REPLACE FUNCTION public.compute_teacher_rankings()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    teacher_record RECORD;
    rank_counter INTEGER;
BEGIN
    -- First update all teacher evaluation results with percentage calculations
    FOR teacher_record IN 
        SELECT ter.id, ter.overall_rating, ter.average_scores, ter.total_evaluations
        FROM teacher_evaluation_results ter
    LOOP
        -- Update with percentage calculations (convert 1-5 scale to 1-100%)
        UPDATE teacher_evaluation_results 
        SET 
            overall_rating = (teacher_record.overall_rating / 5.0) * 100,
            average_scores = jsonb_build_object(
                'teaching_effectiveness', ROUND(((COALESCE((teacher_record.average_scores->>'teaching_effectiveness')::numeric, 0) / 5.0) * 100), 2),
                'classroom_management', ROUND(((COALESCE((teacher_record.average_scores->>'classroom_management')::numeric, 0) / 5.0) * 100), 2),
                'course_content', ROUND(((COALESCE((teacher_record.average_scores->>'course_content')::numeric, 0) / 5.0) * 100), 2),
                'responsiveness', ROUND(((COALESCE((teacher_record.average_scores->>'responsiveness')::numeric, 0) / 5.0) * 100), 2)
            )
        WHERE id = teacher_record.id;
    END LOOP;
    
    -- Add ranking columns if they don't exist
    ALTER TABLE teacher_evaluation_results 
    ADD COLUMN IF NOT EXISTS overall_rank INTEGER,
    ADD COLUMN IF NOT EXISTS category_ranks JSONB;
    
    -- Calculate overall rankings
    rank_counter := 1;
    FOR teacher_record IN 
        SELECT id FROM teacher_evaluation_results 
        ORDER BY overall_rating DESC, total_evaluations DESC
    LOOP
        UPDATE teacher_evaluation_results 
        SET overall_rank = rank_counter
        WHERE id = teacher_record.id;
        rank_counter := rank_counter + 1;
    END LOOP;
    
    -- Calculate category rankings
    UPDATE teacher_evaluation_results 
    SET category_ranks = jsonb_build_object(
        'teaching_effectiveness_rank', (
            SELECT COUNT(*) + 1 
            FROM teacher_evaluation_results ter2 
            WHERE (ter2.average_scores->>'teaching_effectiveness')::numeric > (teacher_evaluation_results.average_scores->>'teaching_effectiveness')::numeric
        ),
        'classroom_management_rank', (
            SELECT COUNT(*) + 1 
            FROM teacher_evaluation_results ter2 
            WHERE (ter2.average_scores->>'classroom_management')::numeric > (teacher_evaluation_results.average_scores->>'classroom_management')::numeric
        ),
        'course_content_rank', (
            SELECT COUNT(*) + 1 
            FROM teacher_evaluation_results ter2 
            WHERE (ter2.average_scores->>'course_content')::numeric > (teacher_evaluation_results.average_scores->>'course_content')::numeric
        ),
        'responsiveness_rank', (
            SELECT COUNT(*) + 1 
            FROM teacher_evaluation_results ter2 
            WHERE (ter2.average_scores->>'responsiveness')::numeric > (teacher_evaluation_results.average_scores->>'responsiveness')::numeric
        )
    );
END;
$$;