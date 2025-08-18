
import React, { useState, useRef, useEffect } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSearch, Printer, Filter, ArrowUpDown, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the structure for evaluation data
interface Evaluation {
  id: number | string;
  teacher: string;
  teacherPosition?: string;
  date: string;
  status: string;
  studentId?: string;
  studentSection?: string;
  subject?: string;
  semester?: string;
  overallRating?: number;
  results: Record<string, string>;
  positiveComment?: string;
  improvementComment?: string;
  suggestions?: string;
  positiveComments?: string;
}

const EvaluationManager = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState<"teacher" | "rating" | "date">("teacher");
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState<Evaluation | null>(null);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  
  // Load evaluations from Supabase and localStorage
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        // Try to load from Supabase first
        const { data: evaluationsData, error } = await supabase
          .from('evaluations')
          .select(`
            *,
            profiles!evaluations_student_id_fkey(usn),
            teachers!evaluations_teacher_id_fkey(name, department)
          `)
          .order('submitted_at', { ascending: false });

        if (error) {
          console.error('Error loading from Supabase:', error);
          loadLocalStorageEvaluations();
          return;
        }

        if (evaluationsData && evaluationsData.length > 0) {
          // Convert Supabase data to our format
          const processedSupabaseData = evaluationsData.map((evaluation, index) => ({
            id: evaluation.id,
            teacher: evaluation.teachers?.name || 'Unknown Teacher',
            teacherPosition: 'Instructor',
            date: new Date(evaluation.submitted_at).toLocaleDateString(),
            status: 'Completed',
            studentId: evaluation.profiles?.usn || `S${index}`,
            studentSection: 'Unknown',
            subject: evaluation.teachers?.department || 'General Course',
            semester: '1st Semester',
            overallRating: evaluation.overall_rating,
            results: {
              teaching_effectiveness: evaluation.teaching_effectiveness.toString(),
              course_content: evaluation.course_content.toString(),
              classroom_management: evaluation.classroom_management.toString(),
              responsiveness: evaluation.responsiveness.toString()
            },
            positiveComment: evaluation.positive_feedback || '',
            improvementComment: evaluation.negative_feedback || '',
            suggestions: evaluation.suggestions || ''
          }));
          setEvaluations(processedSupabaseData);
        } else {
          // If no Supabase data, check localStorage
          loadLocalStorageEvaluations();
        }
      } catch (error) {
        console.error('Error connecting to Supabase:', error);
        loadLocalStorageEvaluations();
      }
    };

    const loadLocalStorageEvaluations = () => {
      const storedEvaluations = localStorage.getItem('evaluations');
      if (storedEvaluations) {
        const parsedData = JSON.parse(storedEvaluations);
        // Process the data to ensure it has all required fields
        const processedData = parsedData.map((evaluation: Evaluation, index: number) => ({
          ...evaluation,
          id: evaluation.id || `EVL-${2500 + index}`,
          studentId: evaluation.studentId || `S${10000 + index}`,
          subject: evaluation.subject || "General Course",
          overallRating: evaluation.overallRating || calculateOverallRating(evaluation.results),
          status: evaluation.status || "Completed",
          positiveComment: evaluation.positiveComment || evaluation.positiveComments || '',
          improvementComment: evaluation.improvementComment || evaluation.suggestions || ''
        }));
        setEvaluations(processedData);
      }
    };

    loadEvaluations();
  }, []);

  // Calculate average rating from evaluation results
  const calculateOverallRating = (results: Record<string, string>): number => {
    if (!results) return 0;
    
    // Check if this is the new format (q1-q20) or old format (teachingEffectiveness, etc.)
    const isNewFormat = Object.keys(results).some(key => key.startsWith('q'));
    
    if (isNewFormat) {
      // Handle new format (q1-q20)
      const questionRatings = Object.entries(results)
        .filter(([key, value]) => key.startsWith('q') && value && !isNaN(parseInt(value)))
        .map(([_, value]) => parseInt(value || "0"));
        
      if (questionRatings.length === 0) return 0;
      
      const sum = questionRatings.reduce((total, rating) => total + rating, 0);
      return sum / questionRatings.length;
    } else {
      // Handle old format (teachingEffectiveness, etc.)
      const ratings = [
        parseInt(results.teachingEffectiveness || "0"),
        parseInt(results.courseContent || "0"),
        parseInt(results.classroomManagement || "0"),
        parseInt(results.communication || "0"),
        parseInt(results.preparedness || "0")
      ];
      
      const validRatings = ratings.filter(r => r > 0);
      if (validRatings.length === 0) return 0;
      
      const sum = validRatings.reduce((total, rating) => total + rating, 0);
      return sum / validRatings.length;
    }
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
  
  // Function to handle viewing evaluation details
  const viewEvaluationDetails = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowDetailDialog(true);
  };

  // Function to handle delete evaluation
  const handleDeleteEvaluation = (evaluation: Evaluation) => {
    setEvaluationToDelete(evaluation);
    setShowDeleteDialog(true);
  };

  // Function to confirm delete
  const confirmDelete = () => {
    if (!evaluationToDelete) return;

    try {
      // Remove evaluation from localStorage
      const updatedEvaluations = evaluations.filter(evaluation => evaluation.id !== evaluationToDelete.id);
      localStorage.setItem('evaluations', JSON.stringify(updatedEvaluations));
      
      // Update state
      setEvaluations(updatedEvaluations);
      
      // Close dialog and reset
      setShowDeleteDialog(false);
      setEvaluationToDelete(null);
      
      toast.success(`Evaluation #${evaluationToDelete.id} has been deleted successfully`);
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      toast.error("Failed to delete evaluation. Please try again.");
    }
  };
  
  // Function to handle printing the table
  const handlePrint = useReactToPrint({
    documentTitle: "Teacher Evaluation Report",
    onAfterPrint: () => toast.success("Report printed successfully!"),
    contentRef: tableRef,
  });

  // Function to handle printing evaluation details
  const handlePrintDetails = useReactToPrint({
    documentTitle: "Evaluation Details",
    onAfterPrint: () => toast.success("Evaluation details printed successfully!"),
    contentRef: detailsRef,
  });

  // Function to handle downloading as CSV
  const handleDownload = () => {
    // Create CSV header
    let csvContent = "Evaluation ID,Teacher,Position,Subject,Semester,Submission Date,Rating,Status,Section\n";
    
    // Add filtered data to CSV - now including studentSection but NOT studentId
    filteredEvaluations.forEach((item) => {
      csvContent += `${item.id},"${item.teacher}","${item.teacherPosition || "Instructor"}","${item.subject || ""}","${item.semester || ""}","${item.date}",${item.overallRating || "N/A"},${item.status},"${item.studentSection || ""}"\n`;
    });
    
    // Create downloadable link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "teacher_evaluations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Report downloaded as CSV");
  };

  // Apply filters and sorting
  const filteredEvaluations = evaluations
    .filter((item) => {
      // Search filter
      const matchesSearch = 
        (item.teacher && item.teacher.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        `${item.id}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.studentId && item.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
        
      // Subject filter
      const matchesSubject = subjectFilter === "all" || 
        (item.subject && item.subject.toLowerCase().includes(subjectFilter.toLowerCase()));
        
      // Teacher filter
      const matchesTeacher = teacherFilter === "all" ||
        (item.teacher && item.teacher === teacherFilter);
        
      return matchesSearch && matchesSubject && matchesTeacher;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortField === "teacher") {
        return sortOrder === "asc" 
          ? a.teacher.localeCompare(b.teacher) 
          : b.teacher.localeCompare(a.teacher);
      } else if (sortField === "rating") {
        const ratingA = a.overallRating || 0;
        const ratingB = b.overallRating || 0;
        return sortOrder === "asc" 
          ? ratingA - ratingB 
          : ratingB - ratingA;
      } else {
        return sortOrder === "asc" 
          ? a.date.localeCompare(b.date) 
          : b.date.localeCompare(a.date);
      }
    });
    
  // Get unique teachers for filter
  const teacherOptions = ["all", ...new Set(evaluations.map(e => e.teacher))];

  // Get unique subjects for filter - limit to department categories  
  const subjectOptions = ["all", "Senior High School", "College", ...new Set(evaluations.filter(e => e.subject).map(e => e.subject as string))];

  // Define evaluation questions for displaying in details
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Manage Evaluations</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={filteredEvaluations.length === 0}>
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
          <Button variant="default" onClick={handlePrint} disabled={filteredEvaluations.length === 0}>
            <Printer size={16} className="mr-2" />
            Print Report
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex">
          <Input 
            placeholder="Search evaluations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex">
          <Select 
            value={subjectFilter}
            onValueChange={setSubjectFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {subjectOptions.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject === "all" ? "All Subjects" : subject}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex">
          <Select 
            value={teacherFilter}
            onValueChange={setTeacherFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {teacherOptions.map(teacher => (
                  <SelectItem key={teacher} value={teacher}>
                    {teacher === "all" ? "All Teachers" : teacher}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex gap-4 mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setSortField("teacher");
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
          }}
        >
          {sortField === "teacher" ? 
            <ArrowUpDown size={14} className="mr-1" />
            : <Filter size={14} className="mr-1" />
          }
          Sort by Teacher
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setSortField("rating");
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
          }}
        >
          {sortField === "rating" ? 
            <ArrowUpDown size={14} className="mr-1" />
            : <Filter size={14} className="mr-1" />
          }
          Sort by Rating
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setSortField("date");
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
          }}
        >
          {sortField === "date" ? 
            <ArrowUpDown size={14} className="mr-1" />
            : <Filter size={14} className="mr-1" />
          }
          Sort by Date
        </Button>
      </div>
      
      <div ref={tableRef}>
        <div className="text-center mb-4 print-only">
          <h1 className="text-2xl font-bold">ACLC College of Daet - Teacher Evaluations</h1>
          <p className="text-muted-foreground">Report Generated on {new Date().toLocaleDateString()}</p>
        </div>
        
        <Table>
          <TableCaption>A list of all teacher evaluations submitted by students</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Rating</TableHead>

              <TableHead>Status</TableHead>
              <TableHead className="text-right print:hidden">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvaluations.length > 0 ? (
              filteredEvaluations.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell>{evaluation.teacher}</TableCell>
                  <TableCell>{evaluation.teacherPosition || "Instructor"}</TableCell>
                  <TableCell>{evaluation.subject || "N/A"}</TableCell>
                  <TableCell>{evaluation.semester || "N/A"}</TableCell>
                  <TableCell>{evaluation.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={
                        (evaluation.overallRating || 0) >= 4.5 ? "text-green-600" : 
                        (evaluation.overallRating || 0) >= 4.0 ? "text-blue-600" : 
                        (evaluation.overallRating || 0) >= 3.5 ? "text-yellow-600" : "text-red-600"
                      }>
                        {(evaluation.overallRating || 0).toFixed(1)}
                      </span>
                      <span className="text-muted-foreground ml-1">/5.0</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                      {evaluation.status}
                    </Badge>
                  </TableCell>
                   <TableCell className="text-right print:hidden">
                     <div className="flex gap-2">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={() => viewEvaluationDetails(evaluation)}
                       >
                         <FileSearch size={16} className="mr-1" />
                         View
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="sm"
                         onClick={() => handleDeleteEvaluation(evaluation)}
                         className="text-red-600 hover:text-red-700 hover:bg-red-50"
                       >
                         <Trash2 size={16} className="mr-1" />
                         Delete
                       </Button>
                     </div>
                   </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  {evaluations.length === 0 ? 
                    "No evaluations have been submitted yet." : 
                    "No evaluations found matching the current filters."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Evaluation Detail Dialog */}
      {selectedEvaluation && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Evaluation Details</DialogTitle>
              <DialogDescription>
                Complete evaluation submission for {selectedEvaluation.teacher} 
                {selectedEvaluation.teacherPosition ? ` (${selectedEvaluation.teacherPosition})` : ''}
              </DialogDescription>
            </DialogHeader>
            
            <div ref={detailsRef} className="max-h-[60vh] overflow-y-auto p-4">
              <div className="print:block print:text-center print:mb-6 hidden">
                <h1 className="text-2xl font-bold">ACLC College of Daet</h1>
                <h2 className="text-xl font-semibold">Teacher Evaluation Report</h2>
                <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Teacher</p>
                  <p className="font-medium">{selectedEvaluation.teacher}</p>
                  <p className="text-xs text-muted-foreground">{selectedEvaluation.teacherPosition || "Instructor"}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Evaluation ID</p>
                  <p className="font-medium">{selectedEvaluation.id}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{selectedEvaluation.subject || "N/A"}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-medium">{selectedEvaluation.semester || "N/A"}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Student Section</p>
                  <p className="font-medium">{selectedEvaluation.studentSection || "Unknown"}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-muted-foreground">Date Submitted</p>
                  <p className="font-medium">{selectedEvaluation.date}</p>
                </div>
                <div className="border rounded p-3 col-span-2">
                  <p className="text-sm text-muted-foreground">Overall Rating</p>
                  <div className="flex items-center">
                    <span className={`text-2xl font-medium ${
                      (selectedEvaluation.overallRating || 0) >= 4.5 ? "text-green-600" : 
                      (selectedEvaluation.overallRating || 0) >= 4.0 ? "text-blue-600" : 
                      (selectedEvaluation.overallRating || 0) >= 3.5 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {(selectedEvaluation.overallRating || 0).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground ml-1">/5.0</span>
                  </div>
                </div>
              </div>
              
              <Tabs defaultValue="ratings" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ratings">Detailed Ratings</TabsTrigger>
                  <TabsTrigger value="positive">Positive Comments</TabsTrigger>
                  <TabsTrigger value="improvement">Areas for Improvement</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ratings" className="space-y-4">
                  <h3 className="font-medium text-lg">Question Ratings</h3>
                  
                  <div className="border rounded p-4">
                    <div className="space-y-2">
                      {Object.entries(selectedEvaluation.results)
                        .filter(([key]) => key.startsWith('q'))
                        .map(([key, value]) => {
                          const questionNumber = parseInt(key.substring(1)) - 1;
                          return (
                            <div key={key} className="grid grid-cols-12 gap-2 py-1 border-b border-gray-100">
                              <div className="col-span-1">{questionNumber + 1}.</div>
                              <div className="col-span-9">{evaluationQuestions[questionNumber]}</div>
                              <div className="col-span-2 font-medium text-right">{getRatingText(value)}</div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="positive">
                  <div className="border rounded p-4">
                    <h3 className="font-medium text-lg mb-2">What Students Like</h3>
                    {selectedEvaluation.positiveComment ? (
                      <p className="bg-gray-50 p-3 rounded">{selectedEvaluation.positiveComment}</p>
                    ) : (
                      <p className="text-muted-foreground italic">No positive comments provided</p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="improvement">
                  <div className="border rounded p-4">
                    <h3 className="font-medium text-lg mb-2">Areas for Improvement</h3>
                    {selectedEvaluation.improvementComment ? (
                      <p className="bg-gray-50 p-3 rounded">{selectedEvaluation.improvementComment}</p>
                    ) : (
                      <p className="text-muted-foreground italic">No improvement suggestions provided</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrintDetails}>
                <Printer size={16} className="mr-2" />
                Print Details
              </Button>
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this evaluation submission? This action cannot be undone.
              {evaluationToDelete && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p><strong>Evaluation ID:</strong> {evaluationToDelete.id}</p>
                  <p><strong>Teacher:</strong> {evaluationToDelete.teacher}</p>
                  <p><strong>Date:</strong> {evaluationToDelete.date}</p>
                  <p><strong>Section:</strong> {evaluationToDelete.studentSection || "Unknown"}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEvaluationToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Evaluation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EvaluationManager;
