
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface StudentLayoutProps {
  children: React.ReactNode;
  activeTab?: "dashboard" | "evaluate" | "submissions";
}

const StudentLayout = ({ children, activeTab = "dashboard" }: StudentLayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full overflow-hidden">
              <img 
                src="/lovable-uploads/86715b0f-5625-40bf-a473-6274a50edf1f.png" 
                alt="ACLC Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
            <h1 className="text-xl font-bold text-primary">TeachMetrics</h1>
            <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded">Student</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
        <div className="container mx-auto px-4 pb-2">
          <div className="flex space-x-4">
            <Button 
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              onClick={() => navigate("/student-dashboard")}
              size="sm"
            >
              Dashboard
            </Button>
            <Button 
              variant={activeTab === "evaluate" ? "default" : "ghost"}
              onClick={() => navigate("/student-dashboard/evaluate")}
              size="sm"
            >
              Submit Evaluation
            </Button>
            <Button 
              variant={activeTab === "submissions" ? "default" : "ghost"}
              onClick={() => navigate("/student-dashboard/submissions")}
              size="sm"
            >
              My Submissions
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="border-t py-4 bg-background">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            ACLC College of Daet © 2025 - Teachers Tabulation System
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Developed by John Carlo Monte & Kristine Joy Nisurtado
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
