import React, { useState, useEffect } from "react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, FileCheck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define question array for the 20 questions
const evaluationQuestions = [
  "The instructor demonstrates a thorough understanding of the subject matter.",
  "The instructor communicates the course content clearly and effectively.",
  "The instructor presents lessons in an organized and structured manner.",
  "The instructor encourages active participation and student engagement.",
  "The instructor treats all students with fairness, respect, and professionalism.",
  "The instructor is available and responsive to students' academic needs.",
  "The instructor begins and ends classes punctually.",
  "The instructor manages the classroom environment professionally.",
  "The instructor uses appropriate teaching methods and instructional materials.",
  "The instructor provides clear and timely feedback on assignments and assessments.",
  "The instructor sets clear expectations and grading criteria.",
  "The instructor creates a positive and inclusive learning atmosphere.",
  "The instructor inspires interest and motivation in the subject.",
  "The instructor integrates theoretical knowledge with practical applications.",
  "The instructor regularly checks for understanding and encourages questions.",
  "The instructor adapts teaching strategies to accommodate diverse learning styles.",
  "The instructor promotes critical thinking and independent learning.",
  "The instructor communicates effectively both orally and in writing.",
  "The instructor demonstrates professionalism and ethical behavior.",
  "The instructor is receptive to feedback and continuously seeks improvement."
];

// List of censored words - can be expanded
const censoredWords = [
  "stupid", "idiot", "dumb", "incompetent", "useless", "hate", 
  "awful", "terrible", "horrible", "worthless", "shit", "fuck", "ass", "damn"
];

// Function to check for censored words
const containsCensoredWords = (text: string): boolean => {
  if (!text) return false;
  const lowercaseText = text.toLowerCase();
  return censoredWords.some(word => lowercaseText.includes(word.toLowerCase()));
};

// Create dynamic question fields for the schema
const questionFields: Record<string, z.ZodTypeAny> = {};
for (let i = 1; i <= 20; i++) {
  questionFields[`q${i}`] = z.string().min(1, `Please rate question ${i}`);
}

// Define the schema for our form (SHS)
const shsFormSchema = z.object({
  section: z.string().min(1, "Please select your section"),
  teacher: z.string().min(1, "Please select a teacher"),
  subject: z.string().min(1, "Please select the subject"),
  positiveComment: z.string().refine(val => !containsCensoredWords(val), {
    message: "Your comment contains inappropriate language"
  }),
  improvementComment: z.string().refine(val => !containsCensoredWords(val), {
    message: "Your comment contains inappropriate language"
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
  ...questionFields
});

// Define the schema for our form (College)
const collegeFormSchema = z.object({
  subject: z.string().min(1, "Please select the subject"),
  teacher: z.string().min(1, "Please select a teacher"),
  positiveComment: z.string().refine(val => !containsCensoredWords(val), {
    message: "Your comment contains inappropriate language"
  }),
  improvementComment: z.string().refine(val => !containsCensoredWords(val), {
    message: "Your comment contains inappropriate language"
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
  ...questionFields
});

// Define the type for form values, explicitly including all field types
type FormValues = {
  section?: string;
  teacher: string;
  subject: string;
  positiveComment: string;
  improvementComment: string;
  agreeToTerms: boolean;
  // Add index signature for question fields
  [key: `q${number}`]: string;
};

const EvaluationForm = () => {
  const navigate = useNavigate();
  const [strandSections, setStrandSections] = useState<Record<string, string[]>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [hasEvaluatedBefore, setHasEvaluatedBefore] = useState(false);
  const [teacherPositions, setTeacherPositions] = useState<Record<string, string>>({});
  const [studentType, setStudentType] = useState<'shs' | 'college'>('shs');
  const [subjectsByTeacher, setSubjectsByTeacher] = useState<Record<string, string[]>>({});
  const [teachersBySection, setTeachersBySection] = useState<Record<string, string[]>>({});
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [subjectTeacherMapping, setSubjectTeacherMapping] = useState<Record<string, string>>({});
  
  // Initialize forms
  const shsForm = useForm<FormValues>({
    resolver: zodResolver(shsFormSchema),
    defaultValues: {
      section: "",
      teacher: "",
      subject: "",
      positiveComment: "",
      improvementComment: "",
      agreeToTerms: false,
      // Initialize all question ratings as empty strings
      ...Object.fromEntries(Array(20).fill(0).map((_, i) => [`q${i+1}`, ""]))
    },
  });

  const collegeForm = useForm<FormValues>({
    resolver: zodResolver(collegeFormSchema),
    defaultValues: {
      teacher: "",
      subject: "",
      positiveComment: "",
      improvementComment: "",
      agreeToTerms: false,
      // Initialize all question ratings as empty strings
      ...Object.fromEntries(Array(20).fill(0).map((_, i) => [`q${i+1}`, ""]))
    },
  });

  // Get student information
  useEffect(() => {
    const studentData = localStorage.getItem('studentUser');
    if (studentData) {
      const student = JSON.parse(studentData);
      setStudentInfo(student);
      
      // Determine student type
      if (student.level === 'shs') {
        setStudentType('shs');
        // Pre-populate form with SHS student section
        shsForm.setValue('section', student.section || '');
      } else {
        setStudentType('college');
      }
    }
  }, []);
  
  useEffect(() => {
    // Initialize strand/section mapping
    setStrandSections({
      'ABM': ['9-1', '9-2', '8-1'],
      'GAS': ['9-1', '9-2', '8-1'],
      'HUMSS': ['9-1', '9-2', '9-3', '9-4', '8-1', '8-2'],
      'TVL': ['9-1', '8-1'],
      'BSE': ['1-1', '2-1', '3-1', '4-1'],
      'BSIT': ['1-1', '2-1', '3-1', '4-1'],
      'ACT': ['1-1', '2-1'],
    });

    // Initialize teacher positions
    setTeacherPositions({
      "MR. CYRUS OROLFO": "Assistant Professor",
      "MS. AIRA AQUINO": "Instructor",
      "MS. RONALYN BARAQUIEL": "Associate Professor",
      "MS. ANGELICA BRAGA": "Instructor",
      "MS. DONNA CAMPOSANO": "Instructor",
      "MR. ERNEST JAMES CANITAN": "Instructor",
      "MS. GLEMARIE AÑORA": "Assistant Professor",
      "MS. CLAIRE ANN JIMENEZ": "Instructor",
      "DR. GERRY LOPEZ": "Professor",
      "MR. JAKE MAISA": "Instructor",
      "MR. ROVEL PILUETA": "Assistant Professor",
      "MS. MARIVIE SEÑA": "Associate Professor"
    });

    // Initialize subjects by teacher
    setSubjectsByTeacher({
      "MR. CYRUS OROLFO": ["Programming 1", "Web Development", "Database Management"],
      "MS. AIRA AQUINO": ["Mathematics", "Algebra", "Statistics"],
      "MS. RONALYN BARAQUIEL": ["English Literature", "Communication Arts", "Creative Writing"],
      "MS. ANGELICA BRAGA": ["History", "Social Studies", "Political Science"],
      "MS. DONNA CAMPOSANO": ["Physics", "Earth Science", "Chemistry"],
      "MR. ERNEST JAMES CANITAN": ["Physical Education", "Health Education", "Sports Science"],
      "MS. GLEMARIE AÑORA": ["Biology", "Anatomy", "Environmental Science"],
      "MS. CLAIRE ANN JIMENEZ": ["Psychology", "Sociology", "Anthropology"],
      "DR. GERRY LOPEZ": ["Philosophy", "Ethics", "Religious Studies"],
      "MR. JAKE MAISA": ["Economics", "Business Management", "Entrepreneurship"],
      "MR. ROVEL PILUETA": ["Computer Science", "Information Technology", "Networking"],
      "MS. MARIVIE SEÑA": ["Accounting", "Finance", "Business Law"]
    });

    // Initialize teachers by section for SHS
    setTeachersBySection({
      "ABM 9-1": ["MR. JAKE MAISA", "MS. MARIVIE SEÑA", "MS. AIRA AQUINO"],
      "ABM 9-2": ["MS. MARIVIE SEÑA", "MR. JAKE MAISA", "MS. DONNA CAMPOSANO"],
      "HUMSS 9-1": ["MS. RONALYN BARAQUIEL", "DR. GERRY LOPEZ", "MS. ANGELICA BRAGA"],
      "HUMSS 9-2": ["MS. ANGELICA BRAGA", "MS. CLAIRE ANN JIMENEZ", "DR. GERRY LOPEZ"],
      "BSIT 1-1": ["MR. CYRUS OROLFO", "MR. ROVEL PILUETA", "MS. AIRA AQUINO"],
      "BSIT 2-1": ["MR. ROVEL PILUETA", "MR. CYRUS OROLFO", "MS. GLEMARIE AÑORA"]
      // Add more sections as needed
    });

    // Initialize subject-teacher mapping for college
    setSubjectTeacherMapping({
      "Programming 1": "MR. CYRUS OROLFO",
      "Web Development": "MR. ROVEL PILUETA",
      "Database Management": "MR. CYRUS OROLFO",
      "Mathematics": "MS. AIRA AQUINO",
      "Algebra": "MS. AIRA AQUINO",
      "Statistics": "MS. AIRA AQUINO",
      "English Literature": "MS. RONALYN BARAQUIEL",
      "Communication Arts": "MS. RONALYN BARAQUIEL",
      "Computer Science": "MR. ROVEL PILUETA",
      "Information Technology": "MR. ROVEL PILUETA",
      "Networking": "MR. ROVEL PILUETA"
      // Add more subject-teacher mappings
    });

    // Check if user has already submitted an evaluation
    const checkPreviousEvaluations = () => {
      const studentData = localStorage.getItem('studentUser');
      if (studentData) {
        const student = JSON.parse(studentData);
        const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');

        // Determine if this student has evaluated before
        const hasEvaluated = evaluations.some((evaluation: any) => evaluation.studentId === student.usn);
        setHasEvaluatedBefore(hasEvaluated);
        
        // If already evaluated, show warning
        if (hasEvaluated) {
          toast.warning("You have already submitted an evaluation. Only one evaluation per account is allowed.");
        }
      }
    };

    // Check previous evaluations on component mount
    checkPreviousEvaluations();
  }, []);
  
  // Watch for section changes in SHS form
  const selectedSHSSection = shsForm.watch('section');
  const selectedSHSTeacher = shsForm.watch('teacher');
  
  // Watch for subject changes in College form
  const selectedSubject = collegeForm.watch('subject');
  
  // Get available teachers based on section for SHS
  const getSHSTeachersForSection = () => {
    if (!studentInfo || !selectedSHSSection) return [];
    
    const sectionKey = `${studentInfo.strandCourse} ${selectedSHSSection}`;
    return teachersBySection[sectionKey] || [];
  };
  
  // Get available subjects for selected SHS teacher
  const getSHSSubjectsForTeacher = () => {
    return selectedSHSTeacher ? subjectsByTeacher[selectedSHSTeacher] || [] : [];
  };
  
  // Get available subjects for college student
  const getCollegeSubjects = () => {
    return Object.keys(subjectTeacherMapping);
  };
  
  // Update teacher when subject is selected in College form
  useEffect(() => {
    if (studentType === 'college' && selectedSubject) {
      const teacher = subjectTeacherMapping[selectedSubject] || '';
      collegeForm.setValue('teacher', teacher);
    }
  }, [selectedSubject, collegeForm, studentType]);

  // Function to update section evaluation counts
  const updateSectionEvaluationCounts = (strandCourse: string, section: string) => {
    // Create section key
    const sectionKey = `${strandCourse} ${section}`;
    
    // Get current section data
    const sectionData = JSON.parse(localStorage.getItem('sectionData') || '{}');
    
    // Update the evaluation count
    if (!sectionData[sectionKey]) {
      sectionData[sectionKey] = {
        name: sectionKey,
        totalCapacity: 40, // Default capacity
        signUps: 0,
        evaluationsCompleted: 1,
      };
    } else {
      sectionData[sectionKey].evaluationsCompleted = (sectionData[sectionKey].evaluationsCompleted || 0) + 1;
    }
    
    // Save back to localStorage
    localStorage.setItem('sectionData', JSON.stringify(sectionData));
  };

  const handleSHSSubmit = (values: FormValues) => {
    // Check if user has already evaluated
    if (hasEvaluatedBefore) {
      toast.error("You have already submitted an evaluation. Only one evaluation per account is allowed.");
      return;
    }

    if (!studentInfo) {
      toast.error("Student information not found. Please log in again.");
      navigate('/');
      return;
    }
    
    // Create the evaluation object
    const evaluation = {
      id: Date.now(),
      teacher: values.teacher,
      teacherPosition: teacherPositions[values.teacher] || "Instructor",
      strandCourse: studentInfo.strandCourse,
      section: values.section,
      subject: values.subject,
      date: new Date().toISOString().split('T')[0],
      status: "Submitted",
      studentId: studentInfo.usn,
      studentType: 'shs',
      results: {
        ...Object.fromEntries(
          Object.entries(values)
            .filter(([key]) => key.startsWith('q'))
        )
      },
      positiveComment: values.positiveComment || "",
      improvementComment: values.improvementComment || ""
    };

    // Save to localStorage
    const existingEvaluations = localStorage.getItem('evaluations');
    const evaluationsArray = existingEvaluations ? JSON.parse(existingEvaluations) : [];
    evaluationsArray.push(evaluation);
    localStorage.setItem('evaluations', JSON.stringify(evaluationsArray));
    
    // Update section evaluation counts
    updateSectionEvaluationCounts(studentInfo.strandCourse, values.section || '');
    
    // Store submitted data for display
    setSubmittedData(evaluation);
    
    // Show success message
    setShowSuccess(true);
    toast.success("Evaluation submitted successfully!");
  };

  const handleCollegeSubmit = (values: FormValues) => {
    // Check if user has already evaluated
    if (hasEvaluatedBefore) {
      toast.error("You have already submitted an evaluation. Only one evaluation per account is allowed.");
      return;
    }

    if (!studentInfo) {
      toast.error("Student information not found. Please log in again.");
      navigate('/');
      return;
    }
    
    // Create the evaluation object
    const evaluation = {
      id: Date.now(),
      teacher: values.teacher,
      teacherPosition: teacherPositions[values.teacher] || "Instructor",
      strandCourse: studentInfo.strandCourse,
      section: studentInfo.section,
      subject: values.subject,
      date: new Date().toISOString().split('T')[0],
      status: "Submitted",
      studentId: studentInfo.usn,
      studentType: 'college',
      results: {
        ...Object.fromEntries(
          Object.entries(values)
            .filter(([key]) => key.startsWith('q'))
        )
      },
      positiveComment: values.positiveComment || "",
      improvementComment: values.improvementComment || ""
    };

    // Save to localStorage
    const existingEvaluations = localStorage.getItem('evaluations');
    const evaluationsArray = existingEvaluations ? JSON.parse(existingEvaluations) : [];
    evaluationsArray.push(evaluation);
    localStorage.setItem('evaluations', JSON.stringify(evaluationsArray));
    
    // Update section evaluation counts
    updateSectionEvaluationCounts(studentInfo.strandCourse, studentInfo.section);
    
    // Store submitted data for display
    setSubmittedData(evaluation);
    
    // Show success message
    setShowSuccess(true);
    toast.success("Evaluation submitted successfully!");
  };

  // Function to display rating as text
  const getRatingText = (rating: string) => {
    switch (rating) {
      case "1": return "Poor";
      case "2": return "Fair";
      case "3": return "Good";
      case "4": return "Very Good";
      case "5": return "Excellent";
      default: return "Not rated";
    }
  };

  const goToSubmissions = () => {
    navigate("/student-dashboard/submissions");
  };

  if (showSuccess && submittedData) {
    return (
      <div className="w-full h-full space-y-6 p-4">
        <Card className="border-t-4 border-t-green-500">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <FileCheck className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Evaluation Submitted Successfully</h2>
              <p className="text-center text-muted-foreground mb-6">
                Thank you for providing your feedback on {submittedData.teacher}.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Your Evaluation Summary</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Teacher</p>
                  <p className="font-medium">{submittedData.teacher}</p>
                  <p className="text-xs text-muted-foreground">{submittedData.teacherPosition}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Date Submitted</p>
                  <p className="font-medium">{submittedData.date}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{submittedData.subject}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Strand/Course</p>
                  <p className="font-medium">{submittedData.strandCourse}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Section</p>
                  <p className="font-medium">{submittedData.section}</p>
                </div>
              </div>
              
              <div className="border rounded p-4 mt-6">
                <h4 className="font-medium mb-4">Your Ratings</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(submittedData.results).map(([key, value]) => {
                    const questionNumber = key.substring(1);
                    return (
                      <div key={key} className="grid grid-cols-12 gap-2 py-1 border-b border-gray-100">
                        <div className="col-span-1">{questionNumber}.</div>
                        <div className="col-span-9">{evaluationQuestions[parseInt(questionNumber) - 1]}</div>
                        <div className="col-span-2 font-medium text-right">{getRatingText(value as string)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submittedData.positiveComment && (
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">What You Liked</h4>
                    <p className="bg-gray-50 p-3 rounded">{submittedData.positiveComment}</p>
                  </div>
                )}
                
                {submittedData.improvementComment && (
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Areas for Improvement</h4>
                    <p className="bg-gray-50 p-3 rounded">{submittedData.improvementComment}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={goToSubmissions} className="w-full md:w-auto">
                View All Submissions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-6">
      {/* ACLC College Branding */}
      <div className="bg-white rounded-lg p-4 shadow-md mb-6">
        <img 
          src="/lovable-uploads/c2ca72cb-3ab3-423b-95e0-80def32b3505.png" 
          alt="ACLC Logo" 
          className="h-16 mx-auto mb-2" 
        />
        <h2 className="text-xl font-bold text-center text-primary mb-2">ACLC COLLEGE OF DAET</h2>
        <p className="text-center text-muted-foreground">Teacher Evaluation Form</p>
      </div>
      
      {hasEvaluatedBefore && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-amber-500 h-6 w-6 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">You've already submitted an evaluation</h3>
              <p className="text-amber-700 text-sm">
                Our system allows only one evaluation submission per account.
                To view your previous submission, please check the submissions page.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Student Info Display */}
      {studentInfo && (
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-primary">
          <h3 className="font-medium">Student Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{studentInfo.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Strand/Course</p>
              <p className="font-medium">{studentInfo.strandCourse}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Section</p>
              <p className="font-medium">{studentInfo.section}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Evaluation Form Tabs based on student type */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <Tabs defaultValue={studentType} value={studentType}>
          {/* Only show TabsList if in development mode */}
          {process.env.NODE_ENV === 'development' && (
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="shs">Senior High School</TabsTrigger>
              <TabsTrigger value="college">College</TabsTrigger>
            </TabsList>
          )}
          
          {/* SHS Evaluation Form */}
          <TabsContent value="shs">
            <h3 className="font-medium text-lg mb-4">Senior High School Teacher Evaluation</h3>
            <Form {...shsForm}>
              <form onSubmit={shsForm.handleSubmit(handleSHSSubmit)} className="space-y-6">
                {/* SHS Section */}
                <FormField
                  control={shsForm.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Section</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset teacher when section changes
                          shsForm.setValue('teacher', '');
                          shsForm.setValue('subject', '');
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studentInfo && strandSections[studentInfo.strandCourse]?.map((section) => (
                            <SelectItem key={section} value={section}>{section}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SHS Teacher Selection */}
                <FormField
                  control={shsForm.control}
                  name="teacher"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Teacher</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset subject when teacher changes
                          shsForm.setValue('subject', '');
                        }} 
                        defaultValue={field.value}
                        disabled={!selectedSHSSection}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getSHSTeachersForSection().map((teacher) => (
                            <SelectItem key={teacher} value={teacher}>
                              {teacher} ({teacherPositions[teacher] || "Instructor"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subject Selection */}
                <FormField
                  control={shsForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedSHSTeacher}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getSHSSubjectsForTeacher().map((subject) => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rating Questions */}
                <div className="space-y-6">
                  <h3 className="font-medium text-lg">Please rate the following aspects:</h3>
                  
                  {/* Dynamically generated questions */}
                  {evaluationQuestions.map((question, index) => {
                    const questionNumber = index + 1;
                    const fieldName = `q${questionNumber}` as `q${number}`;
                    
                    return (
                      <FormField
                        key={fieldName}
                        control={shsForm.control}
                        name={fieldName}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>{`${questionNumber}. ${question}`}</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap gap-2 sm:gap-4"
                              >
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <FormItem key={value} className="flex items-center space-x-2">
                                    <FormControl>
                                      <RadioGroupItem value={String(value)} />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {value === 1 ? "Poor" : value === 2 ? "Fair" : value === 3 ? "Good" : value === 4 ? "Very Good" : "Excellent"}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>

                {/* Comments/Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={shsForm.control}
                    name="positiveComment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What do you like about this teacher? (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please share positive aspects of this teacher..."
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={shsForm.control}
                    name="improvementComment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What needs improvement? (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please share areas that need improvement..."
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Terms and Conditions */}
                <FormField
                  control={shsForm.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I confirm that this evaluation is honest and based on my experience with this teacher
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full md:w-auto" disabled={hasEvaluatedBefore}>
                  <Send className="mr-2 h-4 w-4" /> Submit Evaluation
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* College Evaluation Form */}
          <TabsContent value="college">
            <h3 className="font-medium text-lg mb-4">College Teacher Evaluation</h3>
            <Form {...collegeForm}>
              <form onSubmit={collegeForm.handleSubmit(handleCollegeSubmit)} className="space-y-6">
                {/* Subject Selection */}
                <FormField
                  control={collegeForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Subject</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getCollegeSubjects().map((subject) => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* College Teacher Display (Read-only) */}
                <FormField
                  control={collegeForm.control}
                  name="teacher"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Input value={field.value} readOnly className="bg-gray-50" />
                      <FormMessage />
                      {field.value && (
                        <p className="text-sm text-muted-foreground">
                          Position: {teacherPositions[field.value] || "Instructor"}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Rating Questions */}
                <div className="space-y-6">
                  <h3 className="font-medium text-lg">Please rate the following aspects:</h3>
                  
                  {/* Dynamically generated questions */}
                  {evaluationQuestions.map((question, index) => {
                    const questionNumber = index + 1;
                    const fieldName = `q${questionNumber}` as `q${number}`;
                    
                    return (
                      <FormField
                        key={fieldName}
                        control={collegeForm.control}
                        name={fieldName}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>{`${questionNumber}. ${question}`}</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap gap-2 sm:gap-4"
                              >
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <FormItem key={value} className="flex items-center space-x-2">
                                    <FormControl>
                                      <RadioGroupItem value={String(value)} />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {value === 1 ? "Poor" : value === 2 ? "Fair" : value === 3 ? "Good" : value === 4 ? "Very Good" : "Excellent"}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>

                {/* Comments/Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={collegeForm.control}
                    name="positiveComment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What do you like about this teacher? (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please share positive aspects of this teacher..."
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={collegeForm.control}
                    name="improvementComment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What needs improvement? (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please share areas that need improvement..."
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Terms and Conditions */}
                <FormField
                  control={collegeForm.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I confirm that this evaluation is honest and based on my experience with this teacher
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full md:w-auto" disabled={hasEvaluatedBefore}>
                  <Send className="mr-2 h-4 w-4" /> Submit Evaluation
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EvaluationForm;
