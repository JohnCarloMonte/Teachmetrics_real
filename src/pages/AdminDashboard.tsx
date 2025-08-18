import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import EvaluationManager from "@/components/EvaluationManager";
import ReportsView from "@/components/ReportsView";
import SignUpForm from "@/components/SignUpForm";
import SectionCountsDisplay from "@/components/SectionCountsDisplay";
import DashboardCard from "@/components/DashboardCard";
import TeacherAssignment from "@/components/TeacherAssignment";
import AdminManagement from "@/components/AdminManagement";
import { BarChart, Users, FileText, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserApprovalPage from "@/components/UserApprovalPage";
import AdminProfile from "@/components/AdminProfile";
import FilterWordsManager from "@/components/FilterWordsManager";
import PasswordResetRequests from "@/components/PasswordResetRequests";
import { initializeDefaultData } from "@/utils/initializeDefaultData";
import { supabase } from "@/integrations/supabase/client";
import PrintReports from "@/components/PrintReports";
import Documents from "@/pages/Documents";

// Define the props interface for AdminDashboard
export interface AdminDashboardProps {
  page?: string;
}

const DashboardHome = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = React.useState({
    totalEvaluations: 0,
    evaluatedTeachers: 0,
    pendingEvaluations: 0,
    totalStudents: 0,
    studentsWhoEvaluated: 0,
  });
  
  React.useEffect(() => {
    // Load stats from Supabase
    const loadStats = async () => {
      try {
        // Get total evaluations
        const { count: totalEvaluations } = await supabase
          .from('evaluations')
          .select('*', { count: 'exact', head: true });

        // Get teachers who have been evaluated (unique teachers from evaluations)
        const { data: evaluatedTeachersData } = await supabase
          .from('evaluations')
          .select('teacher_id')
          .not('teacher_id', 'is', null);

        const uniqueEvaluatedTeachers = new Set(
          evaluatedTeachersData?.map(e => e.teacher_id) || []
        ).size;

        // Get total approved students (excluding admins, count unique user_ids)
        const { data: approvedStudents } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('role', 'student')
          .eq('is_approved', true);

        const totalApprovedStudents = new Set(
          approvedStudents?.map(s => s.user_id) || []
        ).size;

        // Get unique students who evaluated teachers
        const { data: evaluations } = await supabase
          .from('evaluations')
          .select('student_id')
          .not('student_id', 'is', null);

        const uniqueStudentsWhoEvaluated = new Set(
          evaluations?.map(e => e.student_id) || []
        ).size;

        setStats({
          totalEvaluations: totalEvaluations || 0,
          evaluatedTeachers: uniqueEvaluatedTeachers,
          pendingEvaluations: 0,
          totalStudents: totalApprovedStudents,
          studentsWhoEvaluated: uniqueStudentsWhoEvaluated,
        });

      } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback to localStorage for backwards compatibility
        initializeDefaultData();
        
        const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        const totalStudents = users.filter(user => user.role !== 'admin' && user.isApproved).length;
        const approvedStudents = users.filter(user => user.role !== 'admin' && user.isApproved);
        const approvedStudentUSNs = new Set(approvedStudents.map(user => user.usn));
        const uniqueStudentsWhoEvaluated = new Set(
          evaluations.filter(e => e.studentUsn && approvedStudentUSNs.has(e.studentUsn)).map(e => e.studentUsn)
        ).size;
        
        setStats({
          totalEvaluations: evaluations.length,
          evaluatedTeachers: teachers.length,
          pendingEvaluations: 0,
          totalStudents: totalStudents,
          studentsWhoEvaluated: uniqueStudentsWhoEvaluated,
        });
      }
    };
    
    loadStats();
  }, []);
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold">Academic Head Dashboard</h2>
      <p className="text-muted-foreground">Welcome back, MR. JEROME SAMANTE</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard 
          title="Students Who Evaluated"
          description="Students who submitted evaluations"
          icon={<FileText className="h-8 w-8 text-primary" />}
          onClick={() => navigate("/admin-dashboard/reports")}
        >
          <div className="text-3xl font-bold">{stats.studentsWhoEvaluated}</div>
          <div className="text-sm text-muted-foreground mt-2">
            {stats.studentsWhoEvaluated > 0 ? `${stats.totalEvaluations} total evaluations` : "No evaluations yet"}
          </div>
        </DashboardCard>
        
        <DashboardCard 
          title="Evaluated Teachers"
          description="Teachers who have been evaluated"
          icon={<Users className="h-8 w-8 text-primary" />}
          onClick={() => navigate("/admin-dashboard/teachers")}
        >
          <div className="text-3xl font-bold">{stats.evaluatedTeachers}</div>
          <div className="text-sm text-muted-foreground mt-2">
            Teachers with evaluations
          </div>
        </DashboardCard>
        
        <DashboardCard 
          title="Approved Students"
          description="Students approved by admin"
          icon={<Users className="h-8 w-8 text-primary" />}
          onClick={() => navigate("/admin-dashboard/sections")}
        >
          <div className="text-3xl font-bold">{stats.totalStudents}</div>
          <div className="text-sm text-muted-foreground mt-2">
            Approved student accounts
          </div>
        </DashboardCard>
        
        <DashboardCard 
          title="Password Resets"
          description="Manage password reset requests"
          icon={<UserPlus className="h-8 w-8 text-primary" />}
          onClick={() => navigate("/admin-dashboard/password-resets")}
        >
          <div className="mt-3">
            <Button variant="outline" className="w-full">
              View Reset Requests
            </Button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

// Main Admin Dashboard with routes
const AdminDashboard = ({ page }: AdminDashboardProps) => {
  
  return (
    <Routes>
      <Route path="/" element={<AdminLayout activeTab="dashboard"><DashboardHome /></AdminLayout>} />
      <Route path="/reports" element={<AdminLayout activeTab="reports"><ReportsView /></AdminLayout>} />
      <Route path="/manage" element={<AdminLayout activeTab="manage"><EvaluationManager /></AdminLayout>} />
      <Route path="/sections" element={<AdminLayout activeTab="sections"><SectionCountsDisplay /></AdminLayout>} />
      <Route path="/teachers" element={<AdminLayout activeTab="teachers"><TeacherAssignment /></AdminLayout>} />
      <Route path="/system" element={<AdminLayout activeTab="system"><AdminManagement /></AdminLayout>} />
      <Route path="/approve" element={<AdminLayout activeTab="approve"><UserApprovalPage /></AdminLayout>} />
      <Route path="/profile" element={<AdminLayout activeTab="profile"><AdminProfile /></AdminLayout>} />
      <Route path="/filter-words" element={<AdminLayout activeTab="filter-words"><FilterWordsManager /></AdminLayout>} />
      <Route path="/password-resets" element={<AdminLayout activeTab="password-resets"><PasswordResetRequests /></AdminLayout>} />
      
      <Route path="/documents" element={<AdminLayout activeTab="documents"><Documents /></AdminLayout>} />
    </Routes>
  );
};

export default AdminDashboard;
