import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Printer } from 'lucide-react';

interface TeacherResult {
  id: string;
  teacher_name: string;
  overall_rating: number;
  total_evaluations: number;
  average_scores: {
    teaching_effectiveness: number;
    classroom_management: number;
    course_content: number;
    responsiveness: number;
  };
  positive_comments: string[];
  negative_comments: string[];
  suggestions: string[];
  flagged_comments: string[];
}

interface TeacherEvaluationPrintProps {
  teacherResult: TeacherResult;
  evaluationPeriod: string;
}

export const TeacherEvaluationPrint: React.FC<TeacherEvaluationPrintProps> = ({
  teacherResult,
  evaluationPeriod
}) => {
  const handlePrint = () => {
    window.print();
  };

  const getGradeComment = (rating: number) => {
    if (rating >= 4.5) return "EXCELLENT";
    if (rating >= 4.0) return "VERY GOOD";
    if (rating >= 3.5) return "GOOD";
    if (rating >= 3.0) return "SATISFACTORY";
    return "NEEDS IMPROVEMENT";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold">Teacher Evaluation Report</h2>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div className="print-container bg-white p-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            {/* School Logo Placeholder */}
            <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">LOGO</span>
            </div>
            <h1 className="text-2xl font-bold text-primary">ACLC College of Daet</h1>
          </div>
          <h2 className="text-xl font-semibold mb-2">EVALUATION RESULT - OVERALL</h2>
          <p className="text-sm">DATE: {new Date().toLocaleDateString()}</p>
          <p className="text-sm">{evaluationPeriod}</p>
        </div>

        {/* Teacher Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Teacher: {teacherResult.teacher_name}</h3>
          <p className="text-sm">Total Evaluations: {teacherResult.total_evaluations}</p>
          <p className="text-sm">Overall Rating: {teacherResult.overall_rating.toFixed(2)} / 5.0 - {getGradeComment(teacherResult.overall_rating)}</p>
        </div>

        {/* Detailed Scores */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Detailed Ratings:</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Teaching Effectiveness:</span>
              <span>{teacherResult.average_scores.teaching_effectiveness.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Classroom Management:</span>
              <span>{teacherResult.average_scores.classroom_management.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Course Content:</span>
              <span>{teacherResult.average_scores.course_content.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Responsiveness:</span>
              <span>{teacherResult.average_scores.responsiveness.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h4 className="font-semibold mb-3 underline">COMMENTS:</h4>
          
          {/* Good Comments */}
          <div className="mb-4">
            <div className="flex">
              <div className="w-1/2 pr-4">
                <h5 className="font-medium mb-2 underline">GOOD COMMENTS</h5>
                <div className="min-h-32 border border-gray-300 p-2 text-sm">
                  {teacherResult.positive_comments.length > 0 ? (
                    <ul className="space-y-1">
                      {teacherResult.positive_comments.map((comment, index) => (
                        <li key={index} className="text-xs">• {comment}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">No positive comments</span>
                  )}
                </div>
              </div>
              
              <div className="w-1/2 pl-4">
                <h5 className="font-medium mb-2 underline">NEED IMPROVEMENT</h5>
                <div className="min-h-32 border border-gray-300 p-2 text-sm">
                  {teacherResult.negative_comments.length > 0 ? (
                    <ul className="space-y-1">
                      {teacherResult.negative_comments.map((comment, index) => (
                        <li key={index} className="text-xs">• {comment}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">No improvement suggestions</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mb-6">
            <h5 className="font-medium mb-2 underline">SUGGESTIONS</h5>
            <div className="min-h-24 border border-gray-300 p-2 text-sm">
              {teacherResult.suggestions.length > 0 ? (
                <ul className="space-y-1">
                  {teacherResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs">• {suggestion}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">No suggestions provided</span>
              )}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="space-y-4 mt-8">
          <div className="flex justify-start">
            <div className="text-center">
              <div className="border-b border-black w-48 mb-1"></div>
              <p className="text-sm">Received by: {teacherResult.teacher_name}</p>
              <p className="text-xs text-gray-600">Teacher</p>
            </div>
          </div>
          
          <div className="flex justify-start">
            <div className="text-center">
              <div className="border-b border-black w-48 mb-1"></div>
              <p className="text-sm">Evaluated by: Jerome Samante</p>
              <p className="text-xs text-gray-600">Academic Head</p>
            </div>
          </div>
          
          <div className="flex justify-start">
            <div className="text-center">
              <div className="border-b border-black w-48 mb-1"></div>
              <p className="text-sm">Approved by: Mariel Bhogs</p>
              <p className="text-xs text-gray-600">School Director</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};