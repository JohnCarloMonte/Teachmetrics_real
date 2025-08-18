import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Printer } from 'lucide-react';

interface TeacherEvaluationReportProps {
  teacherResult: {
    teacher_id: string;
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
    overall_rank?: number;
    category_ranks?: {
      teaching_effectiveness_rank: number;
      classroom_management_rank: number;
      course_content_rank: number;
      responsiveness_rank: number;
    };
    teachers?: { name: string };
  };
  evaluationPeriod: string;
}

export const TeacherEvaluationReport: React.FC<TeacherEvaluationReportProps> = ({
  teacherResult,
  evaluationPeriod
}) => {
  const handlePrint = () => {
    window.print();
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { level: 'Very Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { level: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 60) return { level: 'Fair', color: 'bg-orange-100 text-orange-800' };
    return { level: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const teacherName = teacherResult.teachers?.name || 'Unknown Teacher';
  const overallPerformance = getPerformanceLevel(teacherResult.overall_rating);

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:shadow-none">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 print:shadow-none print:border">
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/86715b0f-5625-40bf-a473-6274a50edf1f.png" 
              alt="ACLC Logo" 
              className="h-16 w-16 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ACLC College of Daet</h1>
              <h2 className="text-lg font-semibold text-gray-700">Teacher Evaluation Report</h2>
              <p className="text-sm text-gray-600">{evaluationPeriod}</p>
            </div>
          </div>
          <Button onClick={handlePrint} className="no-print flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>

        {/* Teacher Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Teacher Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Name: </span>
                  <span className="text-lg font-semibold">{teacherName}</span>
                </div>
                <div>
                  <span className="font-medium">Total Evaluations: </span>
                  <span className="text-lg font-semibold">{teacherResult.total_evaluations}</span>
                </div>
                <div>
                  <span className="font-medium">Overall Rank: </span>
                  <Badge variant="outline" className="ml-2">
                    #{teacherResult.overall_rank || 'N/A'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Overall Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall Rating:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{teacherResult.overall_rating.toFixed(1)}%</span>
                    <Badge className={overallPerformance.color}>
                      {overallPerformance.level}
                    </Badge>
                  </div>
                </div>
                <Progress value={teacherResult.overall_rating} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Scores */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detailed Performance Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(teacherResult.average_scores).map(([key, score]) => {
                const performance = getPerformanceLevel(score);
                const categoryName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const rank = teacherResult.category_ranks?.[`${key}_rank` as keyof typeof teacherResult.category_ranks];
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{categoryName}:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{score.toFixed(1)}%</span>
                        {rank && (
                          <Badge variant="outline" className="text-xs">
                            Rank #{rank}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={score} className="h-2" />
                    <Badge className={`${performance.color} text-xs`}>
                      {performance.level}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        {(teacherResult.positive_comments.length > 0 || teacherResult.suggestions.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Student Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacherResult.positive_comments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Positive Comments</h4>
                  <div className="space-y-2">
                    {teacherResult.positive_comments.slice(0, 10).map((comment, index) => (
                      <div key={index} className="bg-green-50 p-3 rounded-md border-l-4 border-green-400">
                        <p className="text-sm text-gray-700">"{comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {teacherResult.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">Suggestions for Improvement</h4>
                  <div className="space-y-2">
                    {teacherResult.suggestions.slice(0, 10).map((suggestion, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                        <p className="text-sm text-gray-700">"{suggestion}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Signature Section */}
        <Card className="print:border-t-2 print:border-gray-300">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="border-b-2 border-gray-400 mb-2 pb-1 h-12 flex items-end justify-center">
                  <p className="text-sm font-medium">{teacherName}</p>
                </div>
                <p className="text-xs text-gray-600">Received by: (Teacher)</p>
                <p className="text-xs text-gray-500 mt-1">Date: _____________</p>
              </div>
              <div>
                <div className="border-b-2 border-gray-400 mb-2 pb-1 h-12 flex items-end justify-center">
                  <p className="text-sm font-medium">Jerome Samante</p>
                </div>
                <p className="text-xs text-gray-600">Evaluated by: (Academic Head)</p>
                <p className="text-xs text-gray-500 mt-1">Date: _____________</p>
              </div>
              <div>
                <div className="border-b-2 border-gray-400 mb-2 pb-1 h-12 flex items-end justify-center">
                  <p className="text-sm font-medium">Mariel Bhogs</p>
                </div>
                <p className="text-xs text-gray-600">Approved by: (School Director)</p>
                <p className="text-xs text-gray-500 mt-1">Date: _____________</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body { 
              background: white !important; 
              -webkit-print-color-adjust: exact;
            }
            .no-print { 
              display: none !important; 
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:border {
              border: 1px solid #ccc !important;
            }
            .print\\:border-t-2 {
              border-top: 2px solid #ccc !important;
            }
            .print\\:border-gray-300 {
              border-color: #d1d5db !important;
            }
            .print\\:mb-4 {
              margin-bottom: 1rem !important;
            }
            @page {
              margin: 1in;
              size: A4;
            }
          }
        `
      }} />
    </div>
  );
};