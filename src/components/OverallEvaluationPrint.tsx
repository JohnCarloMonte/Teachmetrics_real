import React from 'react';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';

interface TeacherSummary {
  teacher_name: string;
  overall_rating: number;
  total_evaluations: number;
}

interface OverallEvaluationPrintProps {
  teacherSummaries: TeacherSummary[];
  evaluationPeriod: string;
}

export const OverallEvaluationPrint: React.FC<OverallEvaluationPrintProps> = ({
  teacherSummaries,
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

  const overallAverage = teacherSummaries.reduce((sum, teacher) => sum + teacher.overall_rating, 0) / teacherSummaries.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold">Overall Evaluation Results</h2>
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
          <h2 className="text-xl font-semibold mb-2">OVERALL EVALUATION RESULTS</h2>
          <p className="text-sm">DATE: {new Date().toLocaleDateString()}</p>
          <p className="text-sm">{evaluationPeriod}</p>
        </div>

        {/* Summary Statistics */}
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p className="text-sm">Total Teachers Evaluated: {teacherSummaries.length}</p>
          <p className="text-sm">Overall School Average: {overallAverage.toFixed(2)} / 5.0 - {getGradeComment(overallAverage)}</p>
        </div>

        {/* Teacher Results Table */}
        <div className="mb-8">
          <h4 className="font-semibold mb-3">Individual Teacher Results:</h4>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Teacher Name</th>
                <th className="border border-gray-300 p-2 text-center">Overall Rating</th>
                <th className="border border-gray-300 p-2 text-center">Total Evaluations</th>
                <th className="border border-gray-300 p-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {teacherSummaries.map((teacher, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{teacher.teacher_name}</td>
                  <td className="border border-gray-300 p-2 text-center">{teacher.overall_rating.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 text-center">{teacher.total_evaluations}</td>
                  <td className="border border-gray-300 p-2 text-center text-sm">{getGradeComment(teacher.overall_rating)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Performance Distribution */}
        <div className="mb-8">
          <h4 className="font-semibold mb-3">Performance Distribution:</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm">Excellent (4.5-5.0): {teacherSummaries.filter(t => t.overall_rating >= 4.5).length} teachers</p>
              <p className="text-sm">Very Good (4.0-4.4): {teacherSummaries.filter(t => t.overall_rating >= 4.0 && t.overall_rating < 4.5).length} teachers</p>
            </div>
            <div>
              <p className="text-sm">Good (3.5-3.9): {teacherSummaries.filter(t => t.overall_rating >= 3.5 && t.overall_rating < 4.0).length} teachers</p>
              <p className="text-sm">Needs Improvement (&lt;3.5): {teacherSummaries.filter(t => t.overall_rating < 3.5).length} teachers</p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="space-y-4 mt-8">
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

      <style dangerouslySetInnerHTML={{
        __html: `
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
        `
      }} />
    </div>
  );
};