import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, Home, Users, BarChart, UserPlus, Settings, Filter, Cog, Printer, FileCheck, LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const AdminLayout = ({ children, activeTab = "dashboard" }: AdminLayoutProps) => {
  const location = useLocation();
  
  // Determine active tab from URL if not explicitly provided
  const currentTab = activeTab || location.pathname.split('/').pop() || 'dashboard';
  
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <Home className="h-5 w-5" />,
      href: '/admin-dashboard'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: <FileText className="h-5 w-5" />,
      href: '/admin-dashboard/reports'
    },
 
    { 
      id: 'teachers', 
      label: 'Teachers', 
      icon: <Users className="h-5 w-5" />,
      href: '/admin-dashboard/teachers' 
    },
    { 
      id: 'sections', 
      label: 'Students', 
      icon: <Users className="h-5 w-5" />,
      href: '/admin-dashboard/sections'
    },
    { 
      id: 'system', 
      label: 'System', 
      icon: <Cog className="h-5 w-5" />,
      href: '/admin-dashboard/system'
    },
    { 
      id: 'approve', 
      label: 'Approve', 
      icon: <Users className="h-5 w-5" />,
      href: '/admin-dashboard/approve'
    },
    { 
      id: 'password-resets', 
      label: 'Password Resets', 
      icon: <UserPlus className="h-5 w-5" />,
      href: '/admin-dashboard/password-resets'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: <Settings className="h-5 w-5" />,
      href: '/admin-dashboard/profile'
    },
    { 
      id: 'filter-words', 
      label: 'Filter Words', 
      icon: <Filter className="h-5 w-5" />,
      href: '/admin-dashboard/filter-words'
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: <FileCheck className="h-5 w-5" />,
      href: '/admin-dashboard/documents'
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/logo.png" 
              alt="ACLC Logo" 
              className="h-12 w-12 object-contain"
            />
            <Link to="/admin-dashboard" className="text-lg md:text-xl font-bold text-primary">
              Academic Head Dashboard
            </Link>
          </div>
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-primary hidden md:block"
            >
              Logout
            </Link>
            <button 
              className="md:hidden text-muted-foreground hover:text-primary" 
              onClick={() => window.location.href = "/"}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar navigation */}
          <aside className="w-full lg:w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    currentTab === tab.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  {tab.icon}
                  <span className="ml-3">{tab.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
          
          {/* Main content area */}
          <main className="flex-1 bg-white rounded-lg shadow-sm p-4 md:p-6 overflow-x-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
