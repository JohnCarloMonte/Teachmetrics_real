import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CommentAnalysisRequest {
  evaluationId: string
  comments: {
    positive?: string
    negative?: string
    suggestions?: string
  }
}

// Simple AI-like analysis for Tagalog/English/Taglish content
function analyzeComment(text: string) {
  if (!text || text.trim().length === 0) return null;

  const lowercaseText = text.toLowerCase();
  
  // Detect language patterns
  const tagalogPatterns = ['ang', 'mga', 'kay', 'sa', 'ng', 'ni', 'na', 'ko', 'mo', 'siya', 'tayo', 'kami', 'kayo', 'sila'];
  const englishPatterns = ['the', 'and', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should'];
  
  const tagalogCount = tagalogPatterns.filter(pattern => lowercaseText.includes(pattern)).length;
  const englishCount = englishPatterns.filter(pattern => lowercaseText.includes(pattern)).length;
  
  let language = 'english';
  if (tagalogCount > englishCount && tagalogCount > 2) {
    language = 'tagalog';
  } else if (tagalogCount > 0 && englishCount > 0) {
    language = 'taglish';
  }

  // Check for inappropriate content
  const offensiveWords = [
    // English
    'stupid', 'idiot', 'hate', 'sucks', 'terrible', 'worst', 'useless', 'boring',
    // Tagalog
    'bobo', 'tanga', 'walang kwenta', 'pangit', 'ayoko', 'napaka',
    // Common inappropriate patterns
    'wtf', 'damn', 'shit', 'fuck', 'bitch'
  ];

  const spamPatterns = [
    // Random letters
    /^[a-z]{1,3}$/i,
    // Repeated characters
    /(.)\1{4,}/,
    // All caps short text
    /^[A-Z\s]{1,10}$/,
    // Numbers only
    /^\d+$/
  ];

  let isOffensive = offensiveWords.some(word => lowercaseText.includes(word.toLowerCase()));
  let isSpam = spamPatterns.some(pattern => pattern.test(text.trim()));
  let isUnrelated = text.trim().length < 3 || (text.trim().length < 10 && !/teacher|lesson|class|subject/i.test(text));

  const isFlag = isOffensive || isSpam || isUnrelated;
  let flagReason = null;

  if (isOffensive) flagReason = 'offensive';
  else if (isSpam) flagReason = 'spam';
  else if (isUnrelated) flagReason = 'unrelated';

  return {
    language,
    isFlag,
    flagReason
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { evaluationId, comments }: CommentAnalysisRequest = await req.json();

    console.log('Analyzing comments for evaluation:', evaluationId);

    const analysisResults = [];

    // Analyze each comment type
    if (comments.positive) {
      const analysis = analyzeComment(comments.positive);
      if (analysis) {
        analysisResults.push({
          evaluation_id: evaluationId,
          comment_text: comments.positive,
          comment_type: 'positive',
          is_flagged: analysis.isFlag,
          flag_reason: analysis.flagReason,
          language_detected: analysis.language
        });
      }
    }

    if (comments.negative) {
      const analysis = analyzeComment(comments.negative);
      if (analysis) {
        analysisResults.push({
          evaluation_id: evaluationId,
          comment_text: comments.negative,
          comment_type: 'negative',
          is_flagged: analysis.isFlag,
          flag_reason: analysis.flagReason,
          language_detected: analysis.language
        });
      }
    }

    if (comments.suggestions) {
      const analysis = analyzeComment(comments.suggestions);
      if (analysis) {
        analysisResults.push({
          evaluation_id: evaluationId,
          comment_text: comments.suggestions,
          comment_type: 'suggestion',
          is_flagged: analysis.isFlag,
          flag_reason: analysis.flagReason,
          language_detected: analysis.language
        });
      }
    }

    // Store analysis results
    if (analysisResults.length > 0) {
      const { error: insertError } = await supabase
        .from('comment_analysis')
        .insert(analysisResults);

      if (insertError) {
        console.error('Error inserting comment analysis:', insertError);
        throw insertError;
      }

      console.log('Comment analysis completed:', analysisResults.length, 'comments analyzed');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisCount: analysisResults.length,
        flaggedCount: analysisResults.filter(r => r.is_flagged).length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-comments function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});