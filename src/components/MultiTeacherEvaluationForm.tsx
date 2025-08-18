import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, User, Star, BookOpen, Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SingleTeacherEvaluation from "./SingleTeacherEvaluation";
import AddTeacherModal from "./AddTeacherModal";

interface Teacher {
  id: string;
  name: string;
  level: string;
  is_active: boolean;
  subjects: string[];
  department: string;
}

interface TeacherWithSubjects {
  teacher: Teacher;
  subjects: string[];
}

interface MultiTeacherEvaluationFormProps {
  currentUser: {
    id: string;
    usn: string;
    fullName: string;
    strandCourse: string;
    section: string;
    level: 'shs' | 'college';
  };
}

interface Evaluation {
  teacherId: string;
  teacherName?: string;
  teacherPosition?: string;
  positiveComments?: string;
  suggestions?: string;
  answers: { [key: string]: number };
}

const MultiTeacherEvaluationForm = ({ currentUser }: MultiTeacherEvaluationFormProps) => {
  const [availableTeachers, setAvailableTeachers] = useState<TeacherWithSubjects[]>([]);
  const [currentTeacherIndex, setCurrentTeacherIndex] = useState(0);
  const [allAssignedTeachers, setAllAssignedTeachers] = useState<TeacherWithSubjects[]>([]);
  const [loading, setLoading] = useState(true);

  // Collect all pending evaluations before submitting
  const [pendingEvaluations, setPendingEvaluations] = useState<{ [teacherId: string]: any }>({});
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [currentUser]);

  const fetchPersonalList = async () => {
    const { data: personalList } = await supabase
      .from('student_evaluation_lists')
      .select('teacher_id, subject')
      .eq('student_id', currentUser.id);
    console.log('student_evaluation_lists:', personalList);

    const teacherMap = new Map<string, { teacher: Teacher, subjects: string[] }>();
    if (personalList && personalList.length > 0) {
      for (const item of personalList) {
        // Fetch teacher details from teachers table
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', item.teacher_id)
          .single();
        console.log('teacherData for', item.teacher_id, teacherData);
        if (teacherData && teacherData.is_active) {
          const teacherId = teacherData.id;
          if (!teacherMap.has(teacherId)) {
            teacherMap.set(teacherId, {
              teacher: teacherData,
              subjects: []
            });
          }
          teacherMap.get(teacherId)!.subjects.push(item.subject);
        }
      }
    }
    const result = Array.from(teacherMap.values());
    console.log('fetchPersonalList result:', result);
    return result;
  };

const loadData = async () => {
  setLoading(true);
  try {
    // 1. Get all teacher assignments for this student's section
    const { data: assignments, error: assignmentsError } = await supabase
      .from('teacher_assignments')
      .select(`
        teacher_id,
        subject,
        teachers:teacher_id (
          id,
          name,
          level,
          is_active,
          subjects,
          department
        )
      `)
      .eq('level', currentUser.level)
      .eq('strand_course', currentUser.strandCourse)
      .eq('section', currentUser.section);

    // 2. Get personal evaluation list for college students
    let personalList: TeacherWithSubjects[] = [];
    if (currentUser.level === 'college') {
      personalList = await fetchPersonalList();
    }

    // Group by teacher from assignments
    const teacherMap = new Map<string, { teacher: Teacher, subjects: string[] }>();
    assignments?.forEach((assignment: any) => {
      if (assignment.teachers && assignment.teachers.is_active) {
        const teacherId = assignment.teachers.id;
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            teacher: assignment.teachers,
            subjects: []
          });
        }
        teacherMap.get(teacherId)!.subjects.push(assignment.subject);
      }
    });
    // Add personal list teachers (merge, avoid duplicates)
    personalList.forEach((item) => {
      const teacherId = item.teacher.id;
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, item);
      } else {
        // Merge subjects if teacher exists in both
        teacherMap.get(teacherId)!.subjects = Array.from(new Set([...teacherMap.get(teacherId)!.subjects, ...item.subjects]));
      }
    });
    const teachersWithSubjects = Array.from(teacherMap.values());

    // 3. Get all evaluations by this student
    const { data: previousEvaluations } = await supabase
      .from('evaluations')
      .select('teacher_id')
      .eq('student_id', currentUser.id);

    const evaluatedTeacherIds = new Set(previousEvaluations?.map(e => e.teacher_id) || []);

    // 4. Filter out already evaluated teachers
    const unevaluatedTeachers = teachersWithSubjects.filter(({ teacher }) => {
      return !evaluatedTeacherIds.has(teacher.id);
    });

    setAllAssignedTeachers(teachersWithSubjects);
    setAvailableTeachers(unevaluatedTeachers);

    // Auto-select first teacher if needed
    if (unevaluatedTeachers.length > 0) {
      if (currentTeacherIndex >= unevaluatedTeachers.length || currentTeacherIndex < 0) {
        setCurrentTeacherIndex(0);
      }
    }
  } catch (err) {
    toast.error("Error loading teachers");
    setAvailableTeachers([]);
    setAllAssignedTeachers([]);
  }
  setLoading(false);
};

  // Save each teacher's evaluation to local state
  const handleSaveEvaluation = (evaluation: any) => {
    setPendingEvaluations(prev => ({
      ...prev,
      [evaluation.teacherId]: evaluation
    }));
  };

  // Submit all evaluations at once
  const handleFinalSubmit = async () => {
    setIsSubmittingAll(true);
    try {
      // Verify if the student_id exists in the profiles table
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !studentProfile) {
        console.warn("Student profile not found. Creating a new profile.");
        const { error: createProfileError } = await supabase.from('profiles').insert({
          id: currentUser.id,
          full_name: currentUser.fullName,
          usn: currentUser.usn,
          strand_course: currentUser.strandCourse,
          section: currentUser.section,
          level: currentUser.level,
          role: 'student',
          status: 'active'
        });

        if (createProfileError) {
          console.error("Failed to create student profile:", createProfileError);
          toast.error("Failed to create your profile. Please contact the administrator.");
          setIsSubmittingAll(false);
          return;
        } else {
          console.log("Student profile created successfully.");
        }

        // Re-fetch the profile to ensure it exists before proceeding
        const { data: reFetchedProfile, error: reFetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentUser.id)
          .single();

        if (reFetchError || !reFetchedProfile) {
          console.error("Failed to verify the created profile:", reFetchError);
          toast.error("Profile verification failed. Please try again.");
          setIsSubmittingAll(false);
          return;
        }
      }

      const evaluationsArray = Object.values(pendingEvaluations).map((evaluation: Evaluation) => {
        const overallRating = Math.ceil(
          Object.values(evaluation.answers).reduce((sum, rating) => sum + rating, 0) /
            Object.values(evaluation.answers).length
        ) || 5;

        return {
          student_id: currentUser.id,
          teacher_id: evaluation.teacherId,
          teacher_name: evaluation.teacherName || "",
          student_name: currentUser.fullName,
          student_usn: currentUser.usn,
          level: currentUser.level,
          strand_course: currentUser.strandCourse,
          section: currentUser.section,
          overall_rating: overallRating,
          teaching_effectiveness: overallRating, // FIX: Provide value for NOT NULL column
          positive_feedback: evaluation.positiveComments || "",
          suggestions: evaluation.suggestions || "",
          answers: evaluation.answers || {}
        };
      });

      const { error } = await supabase.from('evaluations').insert(evaluationsArray);

      if (error) {
        console.error("Error submitting evaluations:", error);
        toast.error("Failed to submit evaluations. Please check the data and try again.");
      } else {
        toast.success("All evaluations submitted successfully!");
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Unexpected error during submission:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmittingAll(false);
    }
  };

  // Navigation handlers
  const goToNextTeacher = () => {
    if (currentTeacherIndex < availableTeachers.length - 1) {
      setCurrentTeacherIndex(prev => prev + 1);
    }
  };
  const goToPreviousTeacher = () => {
    if (currentTeacherIndex > 0) {
      setCurrentTeacherIndex(prev => prev - 1);
    }
  };

  // Only allow final submit if all teachers have been evaluated
  const allEvaluated = Object.keys(pendingEvaluations).length === availableTeachers.length;

  // New functions to load submissions and evaluated teachers count
  const loadTeachersEvaluatedCount = useCallback(async () => {
    try {
      const { data: teachersEvaluated, error } = await supabase
        .from('evaluations')
        .select('teacher_id');

      if (error) {
        console.error("Error fetching teachers evaluated count:", error);
        toast.error("Failed to load teachers evaluated count. Please try again.");
        return 0;
      }

      // Use a Set to count unique teacher IDs
      const uniqueTeacherIds = new Set(teachersEvaluated?.map((evaluation) => evaluation.teacher_id));
      return uniqueTeacherIds.size;
    } catch (err) {
      console.error("Unexpected error loading teachers evaluated count:", err);
      toast.error("An unexpected error occurred. Please try again.");
      return 0;
    }
  }, []);

  const loadMySubmissions = useCallback(async () => {
    try {
      const { data: myEvaluations, error } = await supabase
        .from('evaluations')
        .select(`
          teacher_id,
          teacher_name,
          overall_rating,
          positive_feedback,
          suggestions
        `)
        .eq('student_id', currentUser.id);

      if (error) {
        console.error("Error fetching my submissions:", error);
        toast.error("Failed to load your submissions. Please try again.");
        return [];
      }

      return myEvaluations || [];
    } catch (err) {
      console.error("Unexpected error loading submissions:", err);
      toast.error("An unexpected error occurred. Please try again.");
      return [];
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const submissions = await loadMySubmissions();
        const teachersCount = await loadTeachersEvaluatedCount();

        console.log("My Submissions:", submissions);
        console.log("Teachers Evaluated Count:", teachersCount);
      } catch (err) {
        console.error("Error during data fetch:", err);
        toast.error("An error occurred while loading data. Please try again.");
      }
    };

    fetchData();
  }, [currentUser, loadMySubmissions, loadTeachersEvaluatedCount]); // Added missing dependency

  // Add/Remove teacher for college students
  const handleAddTeacher = async (teacher: TeacherWithSubjects) => {
    if (currentUser.level === 'college') {
      const subject = teacher.subjects[0] || '';
      if (!subject) {
        toast.error('Please select a valid subject for this teacher.');
        return;
      }
      const { error } = await supabase
        .from('student_evaluation_lists')
        .insert([{
          student_id: currentUser.id,
          teacher_id: teacher.teacher.id,
          level: currentUser.level,
          strand_course: currentUser.strandCourse,
          section: currentUser.section,
          subject: subject
        }]);
      if (error) {
        toast.error('Error adding teacher to evaluation list: ' + error.message);
        return;
      } else {
        toast.success('Teacher added to evaluation list');
        await loadData(); // Reload teacher list after insert
        return;
      }
    }
    setAvailableTeachers(prev => [...prev, teacher]);
    setAllAssignedTeachers(prev => [...prev, teacher]);
  };
  const handleRemoveTeacher = (teacherId: string) => {
    setAvailableTeachers(prev => prev.filter(t => t.teacher.id !== teacherId));
    setAllAssignedTeachers(prev => prev.filter(t => t.teacher.id !== teacherId));
    setPendingEvaluations(prev => {
      const copy = { ...prev };
      delete copy[teacherId];
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="text-center py-8">
            <p>Loading evaluation data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              🎉 All Evaluations Complete!
            </CardTitle>
            <CardDescription>
              Thank you for submitting your evaluations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Ensure currentTeacherIndex is within bounds
  const safeCurrentIndex = Math.min(currentTeacherIndex, availableTeachers.length - 1);
  const currentTeacherData = availableTeachers[safeCurrentIndex];

  if (!currentTeacherData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="text-center py-8">
            <p>No teachers available for evaluation.</p>
            {currentUser.level === 'college' && (
              <div className="mt-4 flex justify-center">
                <AddTeacherModal
                  onAddTeacher={handleAddTeacher}
                  excludeIds={allAssignedTeachers.map(t => t.teacher.id)}
                  currentUser={currentUser}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentTeacher = currentTeacherData.teacher;
  const isCurrentTeacherEvaluated = !!pendingEvaluations[currentTeacher.id];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* College students: Add/Remove teacher controls */}
      {currentUser.level === 'college' && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Teachers to Evaluate</CardTitle>
            <CardDescription>
              Add or remove teachers you want to evaluate. Only available for college students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {allAssignedTeachers.length === 0 ? (
                <div className="w-full text-center mb-4 text-muted-foreground">No teachers in your list. Add one below.</div>
              ) : null}
              {allAssignedTeachers.length > 0 && allAssignedTeachers.map((t, idx) => (
                <Badge key={t.teacher.id} variant="secondary" className="flex items-center gap-2">
                  {t.teacher.name}
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveTeacher(t.teacher.id)}>
                    Remove
                  </Button>
                </Badge>
              ))}
            </div>
            <AddTeacherModal
              onAddTeacher={handleAddTeacher}
              excludeIds={allAssignedTeachers.map(t => t.teacher.id)}
              currentUser={currentUser}
            />
          </CardContent>
        </Card>
      )}
      {/* Current Teacher Evaluation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Evaluating: {currentTeacher.name}
              </CardTitle>
              <CardDescription>
                {currentTeacher.department} • {currentTeacher.level} • 
                Step {currentTeacherIndex + 1} of {availableTeachers.length}
              </CardDescription>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Teaching subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {currentTeacherData.subjects.map((subject, index) => (
                    <Badge key={index} variant="outline">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {isCurrentTeacherEvaluated && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-4 w-4 mr-1" />
                Saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <SingleTeacherEvaluation
            teacher={{
              ...currentTeacher,
              position: currentTeacher.department,
              category: currentTeacher.level === 'shs' ? 'SHS' : 'College'
            }}
            currentUser={currentUser}
            onSaveEvaluation={handleSaveEvaluation}
            isCompleted={isCurrentTeacherEvaluated}
            onNextTeacher={goToNextTeacher}
            isLastTeacher={currentTeacherIndex === availableTeachers.length - 1}
            isSubmitting={isSubmittingAll}
            onFinalSubmit={allEvaluated ? handleFinalSubmit : undefined}
          />
          <div className="flex justify-between mt-4">
            <Button onClick={goToPreviousTeacher} disabled={currentTeacherIndex === 0}>
              Previous
            </Button>
            {currentTeacherIndex === availableTeachers.length - 1 && (
              <Button
                onClick={handleFinalSubmit}
                disabled={!allEvaluated || isSubmittingAll}
                className="ml-auto"
              >
                {isSubmittingAll ? "Submitting..." : "Submit All Evaluations"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiTeacherEvaluationForm;