
import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface Evaluation {
  id: number;
  teacher: string;
  date: string;
  strandCourse: string;
  section: string;
  status: string;
  studentUsn?: string; // Add USN to track which student submitted
  results: Record<string, string>;
  feedback?: string;
}

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

const SubmissionsTable = () => {
  const [submissions, setSubmissions] = useState<Evaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [currentUserUsn, setCurrentUserUsn] = useState<string>('');

  useEffect(() => {
    // Get current student's USN
    const studentUser = localStorage.getItem('studentUser');
    if (studentUser) {
      const userData = JSON.parse(studentUser);
      setCurrentUserUsn(userData.usn || '');
    }

    // Get evaluations from localStorage
    const storedEvaluations = localStorage.getItem('evaluations');
    if (storedEvaluations) {
      const allEvaluations = JSON.parse(storedEvaluations);
      
      // If we have the student's USN, filter evaluations that belong to this student
      // For now, show all evaluations as we might not be storing student USN in evaluations yet
      setSubmissions(allEvaluations);
    }
  }, []);

  // Function to calculate average rating for an evaluation
  const calculateAverageRating = (results: Record<string, string>): number => {
    const ratings = Object.values(results).map(r => parseInt(r || "0"));
    const validRatings = ratings.filter(r => r > 0);
    if (validRatings.length === 0) return 0;
    
    const sum = validRatings.reduce((total, rating) => total + rating, 0);
    return sum / validRatings.length;
  };

  const viewDetails = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
  };

  const closeDetails = () => {
    setSelectedEvaluation(null);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Evaluation Submissions</h2>
      </div>
      
      {submissions.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-muted-foreground">You haven't submitted any evaluations yet.</p>
        </div>
      ) : (
        <Table>
          <TableCaption>A list of your teacher evaluations</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Strand/Course</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Average Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission, index) => (
              <TableRow key={submission.id || index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{submission.teacher}</TableCell>
                <TableCell>{submission.strandCourse || "N/A"}</TableCell>
                <TableCell>{submission.section || "N/A"}</TableCell>
                <TableCell>{submission.date}</TableCell>
                <TableCell>
                  <span className={
                    calculateAverageRating(submission.results) >= 4.5 ? "text-green-600" : 
                    calculateAverageRating(submission.results) >= 4.0 ? "text-blue-600" : 
                    "text-yellow-600"
                  }>
                    {calculateAverageRating(submission.results).toFixed(1)}
                  </span>
                  <span className="text-muted-foreground ml-1">/5.0</span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                    {submission.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => viewDetails(submission)}>
                    <FileText size={16} className="mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Evaluation Details Modal */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Evaluation Results</h3>
                <Button variant="ghost" size="sm" onClick={closeDetails}>✕</Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Teacher:</p>
                  <p>{selectedEvaluation.teacher}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Submission Date:</p>
                    <p>{selectedEvaluation.date}</p>
                  </div>
                  <div>
                    <p className="font-medium">Average Rating:</p>
                    <p>{calculateAverageRating(selectedEvaluation.results).toFixed(2)}/5.0</p>
                  </div>
                  {selectedEvaluation.strandCourse && (
                    <div>
                      <p className="font-medium">Strand/Course:</p>
                      <p>{selectedEvaluation.strandCourse}</p>
                    </div>
                  )}
                  {selectedEvaluation.section && (
                    <div>
                      <p className="font-medium">Section:</p>
                      <p>{selectedEvaluation.section}</p>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Ratings:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.entries(selectedEvaluation.results).map(([key, value]) => {
                      // For new format with question numbers
                      if (key.startsWith('q')) {
                        const questionNumber = key.substring(1);
                        const questionIndex = parseInt(questionNumber) - 1;
                        
                        // Check if the question index is valid
                        if (questionIndex >= 0 && questionIndex < evaluationQuestions.length) {
                          return (
                            <div key={key} className="grid grid-cols-12 gap-2 py-1 border-b border-gray-100">
                              <div className="col-span-1">{questionNumber}.</div>
                              <div className="col-span-9">{evaluationQuestions[questionIndex]}</div>
                              <div className="col-span-2 font-medium text-right">{getRatingText(value)}</div>
                            </div>
                          );
                        }
                      }
                      
                      // Handle legacy format (if any old evaluations exist)
                      if (key === 'teachingEffectiveness' ||
                          key === 'courseContent' ||
                          key === 'classroomManagement' ||
                          key === 'communication' ||
                          key === 'preparedness') {
                        
                        const legacyQuestionMap: Record<string, string> = {
                          'teachingEffectiveness': "Teaching Effectiveness",
                          'courseContent': "Course Content and Relevance",
                          'classroomManagement': "Classroom Management",
                          'communication': "Communication Skills",
                          'preparedness': "Preparedness and Organization"
                        };
                        
                        return (
                          <div key={key} className="grid grid-cols-12 gap-2 py-1 border-b border-gray-100">
                            <div className="col-span-1">-</div>
                            <div className="col-span-9">{legacyQuestionMap[key]}</div>
                            <div className="col-span-2 font-medium text-right">{getRatingText(value)}</div>
                          </div>
                        );
                      }
                      
                      return null;
                    })}
                  </div>
                </div>
                
                {selectedEvaluation.feedback && (
                  <div className="border-t pt-4">
                    <p className="font-medium">Additional Feedback:</p>
                    <p className="mt-2 p-3 bg-gray-50 rounded-md">{selectedEvaluation.feedback}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button variant="outline" onClick={closeDetails}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsTable;
