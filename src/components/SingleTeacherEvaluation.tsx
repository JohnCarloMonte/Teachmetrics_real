import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star } from "lucide-react";

interface Question {
  id: string;
  text: string;
  category: string;
}

interface Teacher {
  id: string;
  name: string;
  position: string;
  department?: string;
  category: 'SHS' | 'College';
}

interface EvaluationData {
  teacherId: string;
  overallRating: number;
  positiveComments: string;
  suggestions: string;
  answers: Record<string, number>;
}

interface SingleTeacherEvaluationProps {
  teacher: Teacher;
  currentUser: {
    id: string;
    usn: string;
    fullName: string;
    strandCourse: string;
    section: string;
    level: 'shs' | 'college';
  };
  onSaveEvaluation: (evaluation: EvaluationData) => void;
  isCompleted: boolean;
  onNextTeacher?: () => void;
  isLastTeacher?: boolean;
  isSubmitting?: boolean;
  onFinalSubmit?: () => void;
}

const SingleTeacherEvaluation = ({
  teacher,
  currentUser,
  onSaveEvaluation,
  isCompleted,
  onNextTeacher,
  isLastTeacher = false,
  isSubmitting = false,
  onFinalSubmit
}: SingleTeacherEvaluationProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [evaluationData, setEvaluationData] = useState<EvaluationData>({
    teacherId: teacher.id,
    overallRating: 5,
    positiveComments: '',
    suggestions: '',
    answers: {}
  });

  useEffect(() => {
    // Load evaluation questions
    const storedQuestions = localStorage.getItem('adminQuestions');
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
    }
    // Reset form when teacher changes
    setEvaluationData({
      teacherId: teacher.id,
      overallRating: 5,
      positiveComments: '',
      suggestions: '',
      answers: {}
    });
  }, [teacher.id]);

  const filterInappropriateWords = (text: string): string => {
    const badWords = JSON.parse(localStorage.getItem('filterWords') || '[]');
    let filteredText = text;
    badWords.forEach((word: string) => {
      const regex = new RegExp(word, 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    return filteredText;
  };

  const handleRatingChange = (questionId: string, rating: number) => {
    setEvaluationData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: rating
      }
    }));
  };

  const handleSave = () => {
    if (!evaluationData.positiveComments.trim()) {
      toast.error("Please provide positive feedback");
      return;
    }
    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q =>
      !evaluationData.answers[q.id] || evaluationData.answers[q.id] === 0
    );
    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all evaluation questions (${unansweredQuestions.length} remaining)`);
      return;
    }
    // Pass up the evaluation data
    onSaveEvaluation({
      ...evaluationData,
      teacherId: teacher.id,
      answers: evaluationData.answers,
      positiveComments: filterInappropriateWords(evaluationData.positiveComments),
      suggestions: filterInappropriateWords(evaluationData.suggestions),
    });
    // Move to next teacher if not last
    if (onNextTeacher && !isLastTeacher) {
      onNextTeacher();
    }
    // On last teacher, call onFinalSubmit if provided
    if (isLastTeacher && onFinalSubmit) {
      onFinalSubmit();
    }
  };

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 mb-4">
          <Star className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-green-700 mb-2">
          Evaluation Completed!
        </h3>
      
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Questions - Compact Grid */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Teacher Evaluation</h3>
          <div className="grid gap-4">
            {questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4">
                <Label className="text-sm font-medium">{question.text}</Label>
                <p className="text-xs text-muted-foreground mb-3">Category: {question.category}</p>
                <RadioGroup
                  value={evaluationData.answers[question.id]?.toString() || ''}
                  onValueChange={(value) => handleRatingChange(question.id, parseInt(value))}
                  className="flex gap-3"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-1">
                      <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                      <Label htmlFor={`${question.id}-${rating}`} className="text-sm">
                        {rating}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="positive">Positive Feedback *</Label>
          <Textarea
            id="positive"
            placeholder="What did you appreciate about this teacher?"
            value={evaluationData.positiveComments}
            onChange={(e) => setEvaluationData(prev => ({
              ...prev,
              positiveComments: e.target.value
            }))}
            rows={3}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="suggestions">Suggestions for Improvement</Label>
          <Textarea
            id="suggestions"
            placeholder="What suggestions do you have for improvement?"
            value={evaluationData.suggestions}
            onChange={(e) => setEvaluationData(prev => ({
              ...prev,
              suggestions: e.target.value
            }))}
            rows={3}
            className="mt-2"
          />
        </div>
      </div>

      {/* Save/Next/Submit Button */}
      <div className="flex justify-end gap-3">
        
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="min-w-[150px]"
        >
          {isSubmitting
            ? "Saving..."
            : isLastTeacher
              ? "Submit Final Evaluation"
              : "Save & Next Teacher"}
        </Button>
      </div>
    </div>
  );
};

export default SingleTeacherEvaluation;