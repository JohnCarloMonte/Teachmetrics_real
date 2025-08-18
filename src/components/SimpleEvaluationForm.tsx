
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Star, BookOpen, GraduationCap } from "lucide-react";
import { 
  getTeachersByCategory, 
  canEvaluateTeacher, 
  updateUserEvaluationStatus,
  getUserEvaluationStatus,
  getSemesterConfig
} from "@/utils/teacherAssignments";

interface Teacher {
  id: number;
  name: string;
  position: string;
  category: 'SHS' | 'College';
}

interface SimpleEvaluationFormProps {
  onSubmit?: () => void;
}

const SimpleEvaluationForm = ({ onSubmit }: SimpleEvaluationFormProps) => {
  const [selectedCategory, setSelectedCategory] = useState<'SHS' | 'College' | 'all'>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [overallRating, setOverallRating] = useState<string>("");
  const [positiveComment, setPositiveComment] = useState<string>("");
  const [improvementComment, setImprovementComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEvaluationStatus, setUserEvaluationStatus] = useState({
    totalEvaluations: 0,
    maxEvaluations: 10,
    evaluatedTeachers: [] as number[]
  });

  // Get current user from localStorage
  const getCurrentUser = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const user = getCurrentUser();

  useEffect(() => {
    if (user) {
      const status = getUserEvaluationStatus(user.usn || user.id.toString());
      setUserEvaluationStatus(status);
    }
  }, []);

  // Filter inappropriate words
  const filterInappropriateWords = (text: string): string => {
    const filteredWords = JSON.parse(localStorage.getItem('filteredWords') || '[]');
    let filteredText = text;
    
    filteredWords.forEach((word: string) => {
      const regex = new RegExp(word, 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    
    return filteredText;
  };

  // Get available teachers based on category filter
  const getAvailableTeachers = (): Teacher[] => {
    const teachers = getTeachersByCategory(selectedCategory);
    return teachers.filter(teacher => 
      user && canEvaluateTeacher(user.usn || user.id.toString(), teacher.id)
    );
  };

  // Get subjects for selected teacher (simplified)
  const getSubjectsForTeacher = (): string[] => {
    if (!selectedTeacher) return [];
    
    // For simplification, return common subjects based on category
    if (selectedTeacher.category === 'SHS') {
      return ['Mathematics', 'Science', 'English', 'Filipino', 'Social Studies', 'PE & Health'];
    } else {
      return ['Major Subject', 'Minor Subject', 'General Education', 'Professional Subject'];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to submit evaluations");
      return;
    }

    if (!selectedTeacher || !overallRating || !selectedSubject) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if user can still evaluate this teacher
    if (!canEvaluateTeacher(user.usn || user.id.toString(), selectedTeacher.id)) {
      toast.error("You have already evaluated this teacher or reached your evaluation limit");
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter comments for inappropriate content
      const filteredPositiveComment = filterInappropriateWords(positiveComment);
      const filteredImprovementComment = filterInappropriateWords(improvementComment);

      // Get semester info
      const semesterConfig = getSemesterConfig();

      // Create evaluation record
      const evaluationData = {
        id: `EVL-${Date.now()}`,
        teacher: selectedTeacher.name,
        teacherPosition: selectedTeacher.position,
        teacherCategory: selectedTeacher.category,
        subject: selectedSubject,
        semester: semesterConfig.semester,
        date: new Date().toLocaleDateString(),
        status: "Completed",
        studentId: user.usn || user.id.toString(),
        studentName: user.fullName,
        studentSection: `${user.strandCourse} ${user.section}`,
        overallRating: parseInt(overallRating),
        positiveComment: filteredPositiveComment,
        improvementComment: filteredImprovementComment,
        results: {
          overallRating: overallRating
        }
      };

      // Save evaluation to localStorage
      const existingEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
      existingEvaluations.push(evaluationData);
      localStorage.setItem('evaluations', JSON.stringify(existingEvaluations));

      // Update user evaluation status
      const success = updateUserEvaluationStatus(user.usn || user.id.toString(), selectedTeacher.id);
      
      if (success) {
        toast.success("Evaluation submitted successfully!");
        
        // Reset form
        setSelectedTeacher(null);
        setSelectedSubject("");
        setOverallRating("");
        setPositiveComment("");
        setImprovementComment("");
        
        // Update local status
        const newStatus = getUserEvaluationStatus(user.usn || user.id.toString());
        setUserEvaluationStatus(newStatus);

        if (onSubmit) onSubmit();
      } else {
        toast.error("Failed to submit evaluation. You may have already evaluated this teacher.");
      }

    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast.error("Failed to submit evaluation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTeachers = getAvailableTeachers();
  const subjects = getSubjectsForTeacher();
  const canSubmitMore = userEvaluationStatus.totalEvaluations < userEvaluationStatus.maxEvaluations;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with evaluation status */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Evaluation Form</CardTitle>
          <CardDescription>
            Please provide your honest feedback about your teacher's performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userEvaluationStatus.totalEvaluations}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {userEvaluationStatus.maxEvaluations - userEvaluationStatus.totalEvaluations}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userEvaluationStatus.maxEvaluations}</div>
              <div className="text-sm text-muted-foreground">Total Allowed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {canSubmitMore ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Teacher Category Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Select Teacher Category</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={selectedCategory} 
                onValueChange={(value) => setSelectedCategory(value as 'SHS' | 'College' | 'all')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All Teachers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SHS" id="shs" />
                  <Label htmlFor="shs" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Senior High School
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="College" id="college" />
                  <Label htmlFor="college" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    College
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Teacher Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => {
                const teacher = availableTeachers.find(t => t.id.toString() === value);
                setSelectedTeacher(teacher || null);
                setSelectedSubject(""); // Reset subject when teacher changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher to evaluate" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      <div className="flex items-center gap-2">
                        {teacher.category === 'SHS' ? (
                          <BookOpen className="h-4 w-4" />
                        ) : (
                          <GraduationCap className="h-4 w-4" />
                        )}
                        <span>{teacher.name} - {teacher.position}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableTeachers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No teachers available for evaluation. You may have reached your evaluation limit or already evaluated all available teachers.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Subject Selection */}
          {selectedTeacher && (
            <Card>
              <CardHeader>
                <CardTitle>Select Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose the subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Overall Rating */}
          {selectedTeacher && selectedSubject && (
            <Card>
              <CardHeader>
                <CardTitle>Overall Rating</CardTitle>
                <CardDescription>
                  Rate your teacher's overall performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={overallRating} onValueChange={setOverallRating}>
                  {[
                    { value: "5", label: "Excellent", desc: "Exceeds expectations" },
                    { value: "4", label: "Very Good", desc: "Meets expectations well" },
                    { value: "3", label: "Good", desc: "Meets expectations" },
                    { value: "2", label: "Fair", desc: "Below expectations" },
                    { value: "1", label: "Poor", desc: "Well below expectations" }
                  ].map((rating) => (
                    <div key={rating.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={rating.value} id={rating.value} />
                      <Label htmlFor={rating.value} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: parseInt(rating.value) }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            {Array.from({ length: 5 - parseInt(rating.value) }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-gray-300" />
                            ))}
                          </div>
                          <span className="font-medium">{rating.label}</span>
                          <span className="text-sm text-muted-foreground">- {rating.desc}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          {overallRating && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Positive Feedback</CardTitle>
                  <CardDescription>What do you appreciate about this teacher?</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Share what you liked about this teacher's performance, teaching style, or approach..."
                    value={positiveComment}
                    onChange={(e) => setPositiveComment(e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suggestions for Improvement</CardTitle>
                  <CardDescription>How can this teacher improve?</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Provide constructive suggestions for improvement..."
                    value={improvementComment}
                    onChange={(e) => setImprovementComment(e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submit Button */}
          {overallRating && (
            <Card>
              <CardContent className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedTeacher || !overallRating || !selectedSubject}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Evaluation"}
                </Button>
              </CardContent>
            </Card>
          )}
        </form>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Evaluation Limit Reached</h3>
            <p className="text-muted-foreground">
              You have completed all {userEvaluationStatus.maxEvaluations} allowed evaluations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleEvaluationForm;
