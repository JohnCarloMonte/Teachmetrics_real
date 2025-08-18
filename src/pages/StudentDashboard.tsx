import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { ChevronRight, FileCheck, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MultiTeacherEvaluationForm from "@/components/MultiTeacherEvaluationForm";
import StudentSubmissions from "./StudentSubmissions";

const StudentDashboard = () => {
  const [studentName, setStudentName] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if student is logged in
    const studentData = localStorage.getItem("studentUser");
    if (!studentData) {
      // If no student data, redirect to login
      navigate("/");
      return;
    }
    
    // Parse student data and set name
    const student = JSON.parse(studentData);
    setStudentName(student.fullName || "Student");
    setCurrentUser(student);
    
    // Automatically redirect to evaluation form when landing on the dashboard
    if (window.location.pathname === "/student-dashboard") {
      navigate("/student-dashboard/evaluate");
    }
  }, [navigate]);
  
  const handleLogout = () => {
    // Remove student data and redirect to login
    localStorage.removeItem("studentUser");
    toast.success("Logged out successfully");
    navigate("/");
  };
  
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm py-4 px-4 md:px-8">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full overflow-hidden">
              <img 
                src="/lovable-uploads/logo.png" 
                alt="ACLC Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
            <h1 className="text-xl font-bold text-primary hidden md:block">TeachMetrics</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground mr-2 hidden md:block">
              Welcome, {studentName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={18} className="mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b py-2 px-4 md:px-8 md:relative">
        <div className="container mx-auto flex space-x-4 overflow-x-auto md:justify-start md:space-x-4 hidden md:flex">
          <Button 
            variant="ghost" 
            className="whitespace-nowrap"
            onClick={() => navigate("/student-dashboard/evaluate")}
          >
            <User size={16} className="mr-2" />
            Evaluate Teachers
          </Button>
          <Button 
            variant="ghost" 
            className="whitespace-nowrap"
            onClick={() => navigate("/student-dashboard/submissions")}
          >
            <FileCheck size={16} className="mr-2" />
            My Submissions
          </Button>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t py-2 px-4 flex justify-around md:hidden">
          <Button 
            variant="ghost" 
            className="flex flex-col items-center"
            onClick={() => navigate("/student-dashboard/evaluate")}
          >
            <User size={20} />
            <span className="text-xs">Evaluate</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center"
            onClick={() => navigate("/student-dashboard/submissions")}
          >
            <FileCheck size={20} />
            <span className="text-xs">Submissions</span>
          </Button>
        </div>
      </div>
      
      {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/student-dashboard/evaluate" replace />} />
        <Route path="/evaluate" element={<MultiTeacherEvaluationForm currentUser={currentUser} />} />
        <Route path="/submissions" element={<StudentSubmissions />} />
        <Route path="*" element={<Navigate to="/student-dashboard/evaluate" replace />} />
      </Routes>
    </div>
  );
};

export default StudentDashboard;
