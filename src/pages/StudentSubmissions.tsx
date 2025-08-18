import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Submission {
  teacher_name: string;
  overall_rating: number;
  positive_feedback?: string;
  suggestions?: string;
}

const StudentSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const studentData = localStorage.getItem("studentUser");
        if (!studentData) {
          toast.error("No student data found. Please log in again.");
          return;
        }

        const student = JSON.parse(studentData);
        // Fetch evaluations and join with teachers to get teacher name
        const { data, error } = await supabase
          .from("evaluations")
          .select(`overall_rating, positive_feedback, suggestions, teacher_id, teachers:teacher_id (name)`) // join with teachers table
          .eq("student_id", student.id);

        if (error) {
          console.error("Error fetching submissions:", error);
          toast.error("Failed to load submissions.");
          return;
        }

        // Map the data to include teacher_name from the joined teachers table
        const mapped = (data || []).map((item: any) => ({
          teacher_name: item.teachers?.name || "Unknown Teacher",
          overall_rating: item.overall_rating,
          positive_feedback: item.positive_feedback,
          suggestions: item.suggestions,
        }));

        setSubmissions(mapped);
      } catch (err) {
        console.error("Unexpected error fetching submissions:", err);
        toast.error("An unexpected error occurred while loading submissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No submissions found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {submissions.map((submission, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Teacher: {submission.teacher_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Overall Rating:</strong> {submission.overall_rating}</p>
            <p><strong>Positive Feedback:</strong> {submission.positive_feedback || "None"}</p>
            <p><strong>Suggestions:</strong> {submission.suggestions || "None"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudentSubmissions;
