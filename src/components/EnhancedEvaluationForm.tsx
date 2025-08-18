
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Star, CheckCircle, AlertCircle, User, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AddTeacherModal from "./AddTeacherModal";

interface Question {
  id: string;
  text: string;
  category: string;
}

interface Teacher {
  id: string;
  name: string;
  department: string;
  is_active: boolean;
}

interface EvaluationData {
  teacherId: string;
  overallRating: number;
  positiveComments: string;
  suggestions: string;
  answers: Record<string, number>;
}

interface EnhancedEvaluationFormProps {
  currentUser: {
    id: string;
    usn: string;
    fullName: string;
    strandCourse: string;
    section: string;
    level: 'shs' | 'college';
  };
}

const EnhancedEvaluationForm = ({ currentUser }: EnhancedEvaluationFormProps) => {
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [evaluationData, setEvaluationData] = useState<EvaluationData>({
    teacherId: '',
    overallRating: 0,
    positiveComments: '',
    suggestions: '',
    answers: {}
  });
  const [evaluationStatus, setEvaluationStatus] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [evaluatedTeachers, setEvaluatedTeachers] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      // Load active teachers from Supabase
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true);

      if (teachersError) {
        console.error('Error loading teachers:', teachersError);
        toast.error('Failed to load teachers');
        return;
      }

      setAvailableTeachers(teachers || []);

      // Load evaluation questions from localStorage for now
      const storedQuestions = localStorage.getItem('adminQuestions');
      if (storedQuestions) {
        setQuestions(JSON.parse(storedQuestions));
      }

      // Load user's evaluation status from Supabase
      const { data: evaluations, error: evaluationsError } = await supabase
        .from('evaluations')
        .select('teacher_id')
        .eq('student_id', currentUser.id);

      if (evaluationsError) {
        console.error('Error loading evaluations:', evaluationsError);
        toast.error('Failed to load evaluation status');
        return;
      }

      const evaluatedTeacherIds = evaluations?.map(e => e.teacher_id) || [];
      setEvaluatedTeachers(evaluatedTeacherIds);

      setEvaluationStatus({
        totalEvaluations: evaluations?.length || 0,
        evaluatedTeachers: evaluatedTeacherIds
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const filterInappropriateWords = (text: string): string => {
    const badWords = JSON.parse(localStorage.getItem('filteredWords') || '[]');
    let filteredText = text;
    
    badWords.forEach((word: string) => {
      const regex = new RegExp(word, 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    
    return filteredText;
  };

  const addTeacherToList = (teacher: Teacher) => {
    if (evaluatedTeachers.includes(teacher.id)) {
      toast.error("You have already evaluated this teacher.");
      return;
    }
    
    if (selectedTeachers.find(t => t.id === teacher.id)) {
      toast.error("This teacher is already in your evaluation list.");
      return;
    }
    
    const updatedList = [...selectedTeachers, teacher];
    setSelectedTeachers(updatedList);
    toast.success(`${teacher.name} added to your evaluation list.`);
  };

  const removeTeacherFromList = (teacherId: string) => {
    setSelectedTeachers(prev => prev.filter(t => t.id !== teacherId));
    // If we're currently evaluating this teacher, reset the form
    if (selectedTeacher?.id === teacherId) {
      setSelectedTeacher(null);
      setCurrentStep(0);
    }
    toast.success("Teacher removed from evaluation list.");
  };

  const startEvaluation = (teacher: Teacher) => {
    // Only allow evaluation of the first teacher in the queue
    if (selectedTeachers.length === 0 || selectedTeachers[0].id !== teacher.id) {
      toast.error("Please evaluate teachers in order. You can only evaluate the first teacher in your queue.");
      return;
    }
    
    setSelectedTeacher(teacher);
    setCurrentStep(1);
    setEvaluationData({
      teacherId: teacher.id,
      overallRating: 0,
      positiveComments: '',
      suggestions: '',
      answers: {}
    });
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

  const handleOverallRatingChange = (rating: number) => {
    setEvaluationData(prev => ({
      ...prev,
      overallRating: rating
    }));
  };

  const handleSubmit = async () => {
    if (!selectedTeacher) {
      toast.error("Please select a teacher to evaluate");
      return;
    }

    if (evaluationData.overallRating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    if (!evaluationData.positiveComments.trim()) {
      toast.error("Please provide positive feedback");
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter inappropriate words from comments
      const filteredPositive = filterInappropriateWords(evaluationData.positiveComments);
      const filteredSuggestions = filterInappropriateWords(evaluationData.suggestions);

      // Submit evaluation to Supabase
      const { error } = await supabase
        .from('evaluations')
        .insert({
          student_id: currentUser.id,
          teacher_id: selectedTeacher.id,
          overall_rating: evaluationData.overallRating,
          teaching_effectiveness: evaluationData.answers['teaching_effectiveness'] || 0,
          course_content: evaluationData.answers['course_content'] || 0,
          classroom_management: evaluationData.answers['classroom_management'] || 0,
          responsiveness: evaluationData.answers['responsiveness'] || 0,
          positive_feedback: filteredPositive,
          negative_feedback: '',
          suggestions: filteredSuggestions,
          student_usn: currentUser.usn,
          student_name: currentUser.fullName,
          teacher_name: selectedTeacher.name,
          teacher_position: selectedTeacher.department,
          strand_course: currentUser.strandCourse,
          section: currentUser.section,
          level: currentUser.level,
          semester: "1st Semester",
          evaluation_date: new Date().toISOString(),
          answers: evaluationData.answers
        });

      if (error) {
        console.error('Error submitting evaluation:', error);
        toast.error('Failed to submit evaluation. Please try again.');
        return;
      }

      toast.success(`Evaluation for ${selectedTeacher.name} submitted successfully!`);
      
      // Remove evaluated teacher from list and reset form
      setSelectedTeachers(prev => prev.filter(t => t.id !== selectedTeacher.id));
      setEvaluatedTeachers(prev => [...prev, selectedTeacher.id]);
      setSelectedTeacher(null);
      setCurrentStep(0);
      setEvaluationData({
        teacherId: '',
        overallRating: 0,
        positiveComments: '',
        suggestions: '',
        answers: {}
      });
      
      // Reload data to update status
      loadData();

    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast.error("Failed to submit evaluation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRemainingTeachers = () => {
    return availableTeachers.filter(teacher => 
      !evaluatedTeachers.includes(teacher.id) && 
      !selectedTeachers.find(st => st.id === teacher.id)
    );
  };

  const getProgressPercentage = () => {
    if (!evaluationStatus) return 0;
    const totalToEvaluate = selectedTeachers.length + evaluationStatus.totalEvaluations;
    const completed = evaluationStatus.totalEvaluations;
    return totalToEvaluate > 0 ? (completed / totalToEvaluate) * 100 : 0;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Teacher Evaluation System
          </CardTitle>
          <CardDescription>
            Evaluate your assigned teachers for {currentUser.strandCourse} {currentUser.section}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evaluationStatus && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Evaluation Progress</span>
                <span className="text-sm text-muted-foreground">
                  {evaluationStatus.totalEvaluations} completed, {selectedTeachers.length} in queue
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
              {selectedTeachers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Complete {selectedTeachers.length} more evaluation{selectedTeachers.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {currentStep === 0 ? (
        <>
          {/* Step 1: Add Teachers to Evaluation List */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Add Teachers to Evaluate</CardTitle>
              <CardDescription>Select teachers from your assigned list to add to your evaluation queue</CardDescription>
              <div className="flex justify-end">
                <AddTeacherModal onTeacherAdded={loadData} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTeachers.length > 0 ? (
                  availableTeachers.map((teacher) => {
                    const alreadyEvaluated = evaluatedTeachers.includes(teacher.id);
                    const inQueue = selectedTeachers.find(t => t.id === teacher.id);
                    const canEvaluate = !alreadyEvaluated && !inQueue;
                    
                    return (
                      <Card 
                        key={teacher.id} 
                        className={`transition-all ${
                          inQueue 
                            ? 'border-2 border-green-500 bg-green-50' 
                            : canEvaluate
                              ? 'hover:shadow-md border-2 hover:border-primary' 
                              : 'opacity-50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{teacher.name}</h3>
                              <p className="text-sm text-muted-foreground">{teacher.department}</p>
                              <Badge variant="outline" className="mt-2">
                                {teacher.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              {inQueue ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-xs">In Queue</span>
                                </div>
                              ) : alreadyEvaluated ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-xs">Completed</span>
                                </div>
                               ) : canEvaluate ? (
                                <Button 
                                  size="sm" 
                                  onClick={() => addTeacherToList(teacher)}
                                  className="text-xs"
                                >
                                  Add to Queue
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-400">
                                  <span className="text-xs">Not Available</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No teachers assigned to your section yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Review Selected Teachers */}
          {selectedTeachers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Review Your Evaluation Queue</CardTitle>
                <CardDescription>These teachers are ready for evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3">
                  {selectedTeachers.map((teacher, index) => (
                    <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full w-6 h-6 flex items-center justify-center text-sm ${
                          index === 0 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-medium">{teacher.name}</h4>
                          <p className="text-sm text-muted-foreground">{teacher.department}</p>
                          <p className="text-xs text-muted-foreground">
                            {index === 0 ? 'Ready to evaluate' : 'Waiting in queue'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 ? (
                          <Button 
                            size="sm" 
                            onClick={() => startEvaluation(teacher)}
                          >
                            Start Evaluation
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Waiting in Queue
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeTeacherFromList(teacher.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Step 3: Evaluation Form */
        <Card>
          <CardHeader>
            <CardTitle>Evaluating: {selectedTeacher.name}</CardTitle>
            <CardDescription>{selectedTeacher.department}</CardDescription>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedTeacher(null);
                setCurrentStep(0);
              }}
              className="w-fit"
            >
              ← Back to Teacher Selection
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Rating */}
            <div>
              <Label className="text-base font-medium">Overall Rating</Label>
              <p className="text-sm text-muted-foreground mb-4">
                How would you rate this teacher's overall performance?
              </p>
              <RadioGroup
                value={evaluationData.overallRating.toString()}
                onValueChange={(value) => handleOverallRatingChange(parseInt(value))}
                className="flex flex-wrap gap-4"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem value={rating.toString()} id={`overall-${rating}`} />
                    <Label htmlFor={`overall-${rating}`} className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {rating}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Questions */}
            {questions.map((question) => (
              <div key={question.id}>
                <Label className="text-base font-medium">{question.text}</Label>
                <p className="text-sm text-muted-foreground mb-4">Category: {question.category}</p>
                <RadioGroup
                  value={evaluationData.answers[question.id]?.toString() || ''}
                  onValueChange={(value) => handleRatingChange(question.id, parseInt(value))}
                  className="flex flex-wrap gap-4"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                      <Label htmlFor={`${question.id}-${rating}`} className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {rating}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            {/* Comments */}
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
                  rows={4}
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
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => {
                setSelectedTeacher(null);
                setCurrentStep(0);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? "Submitting..." : "Submit Evaluation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedEvaluationForm;
