import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  question_order: number;
  is_active: boolean;
}

export const QuestionnaireManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_questions')
        .select('*')
        .order('question_order');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      const { error } = await supabase
        .from('evaluation_questions')
        .insert({
          question_text: newQuestion,
          question_order: questions.length + 1,
          question_type: 'rating'
        });

      if (error) throw error;

      setNewQuestion('');
      loadQuestions();
      toast({
        title: "Success",
        description: "Question added successfully",
      });
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive",
      });
    }
  };

  const updateQuestion = async (id: string, newText: string) => {
    try {
      const { error } = await supabase
        .from('evaluation_questions')
        .update({ question_text: newText })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditText('');
      loadQuestions();
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('evaluation_questions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      loadQuestions();
      toast({
        title: "Success",
        description: "Question deactivated successfully",
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const startEdit = (question: Question) => {
    setEditingId(question.id);
    setEditText(question.question_text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  if (loading) {
    return <div>Loading questions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Questionnaire Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Question */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter new evaluation question..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
          />
          <Button onClick={addQuestion} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.filter(q => q.is_active).map((question) => (
            <div key={question.id} className="flex items-center gap-2 p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground min-w-8">
                {question.question_order}.
              </span>
              
              {editingId === question.id ? (
                <>
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        updateQuestion(question.id, editText);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => updateQuestion(question.id, editText)}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{question.question_text}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(question)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteQuestion(question.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {questions.filter(q => q.is_active).length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No active questions found. Add your first evaluation question above.
          </div>
        )}
      </CardContent>
    </Card>
  );
};