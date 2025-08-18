import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Computing evaluation results...');

    // Get current semester/evaluation period
    const { data: settings } = await supabase
      .from('evaluation_settings')
      .select('current_semester, school_year')
      .single();
    
    const evaluationPeriod = `${settings?.current_semester} ${settings?.school_year}`;

    // Get all teachers with evaluations
    const { data: teachers } = await supabase
      .from('teachers')
      .select(`
        id,
        name,
        evaluations!evaluations_teacher_id_fkey(
          id,
          overall_rating,
          teaching_effectiveness,
          classroom_management,
          course_content,
          responsiveness,
          positive_feedback,
          negative_feedback,
          suggestions
        )
      `);

    for (const teacher of teachers || []) {
      const evaluations = teacher.evaluations || [];
      
      if (evaluations.length === 0) continue;

      // Calculate averages
      const totalEvaluations = evaluations.length;
      const overallRating = evaluations.reduce((sum, eval) => sum + eval.overall_rating, 0) / totalEvaluations;
      const teachingEffectiveness = evaluations.reduce((sum, eval) => sum + eval.teaching_effectiveness, 0) / totalEvaluations;
      const classroomManagement = evaluations.reduce((sum, eval) => sum + eval.classroom_management, 0) / totalEvaluations;
      const courseContent = evaluations.reduce((sum, eval) => sum + eval.course_content, 0) / totalEvaluations;
      const responsiveness = evaluations.reduce((sum, eval) => sum + eval.responsiveness, 0) / totalEvaluations;

      // Collect comments
      const positiveComments = evaluations
        .filter(eval => eval.positive_feedback)
        .map(eval => eval.positive_feedback);
      
      const negativeComments = evaluations
        .filter(eval => eval.negative_feedback)
        .map(eval => eval.negative_feedback);
      
      const suggestions = evaluations
        .filter(eval => eval.suggestions)
        .map(eval => eval.suggestions);

      // Get flagged comments for this teacher
      const { data: flaggedComments } = await supabase
        .from('comment_analysis')
        .select('comment_text')
        .in('evaluation_id', evaluations.map(e => e.id))
        .eq('is_flagged', true);

      const averageScores = {
        teaching_effectiveness: Number((teachingEffectiveness * 20).toFixed(2)), // Convert to percentage (1-5 to 20-100)
        classroom_management: Number((classroomManagement * 20).toFixed(2)),
        course_content: Number((courseContent * 20).toFixed(2)),
        responsiveness: Number((responsiveness * 20).toFixed(2))
      };

      // Insert or update teacher evaluation results
      const { error } = await supabase
        .from('teacher_evaluation_results')
        .upsert({
          teacher_id: teacher.id,
          evaluation_period: evaluationPeriod,
          overall_rating: Number((overallRating * 20).toFixed(2)), // Convert to percentage (1-5 to 20-100)
          total_evaluations: totalEvaluations,
          average_scores: averageScores,
          positive_comments: positiveComments,
          negative_comments: negativeComments,
          suggestions: suggestions,
          flagged_comments: flaggedComments?.map(fc => fc.comment_text) || []
        }, {
          onConflict: 'teacher_id,evaluation_period'
        });

      if (error) {
        console.error('Error upserting teacher results:', error);
      } else {
        console.log(`Updated results for teacher: ${teacher.name}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Evaluation results computed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error computing evaluation results:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});