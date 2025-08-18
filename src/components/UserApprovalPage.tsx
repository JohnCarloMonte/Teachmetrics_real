
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Search, GraduationCap, BookOpen, Filter, Settings, Edit, Save, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getMaxEvaluationsPerStudent, setMaxEvaluationsPerStudent } from "@/utils/teacherAssignments";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  user_id: string;
  full_name: string;
  usn?: string;
  strand_course: string;
  section: string;
  email?: string;
  phone_number?: string;
  role: string;
  level?: string;
  is_approved: boolean;
  status?: string;
  created_at: string;
  year_level?: number;
  semester?: string;
}

interface Strand {
  id: string;
  name: string;
  sections: string[];
  subjects: string[];
}

interface Course {
  id: string;
  name: string;
  sections: string[];
  subjects: string[];
}

const UserApprovalPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [maxEvaluations, setMaxEvaluations] = useState(10);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [strands, setStrands] = useState<Strand[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  useEffect(() => {
    loadUsers();
    loadMaxEvaluations();
    loadDynamicData();
  }, []);

  // Add additional useEffect to reload users when component mounts
  useEffect(() => {
    const interval = setInterval(() => {
      loadUsers();
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const loadDynamicData = () => {
    // Load strands from localStorage
    const storedStrands = localStorage.getItem('adminStrands');
    if (storedStrands) {
      setStrands(JSON.parse(storedStrands));
    }

    // Load courses from localStorage
    const storedCourses = localStorage.getItem('adminCourses');
    if (storedCourses) {
      setCourses(JSON.parse(storedCourses));
    }
  };
  
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };
  
  const loadMaxEvaluations = () => {
    const max = getMaxEvaluationsPerStudent();
    setMaxEvaluations(max);
  };
  
  const handleMaxEvaluationsChange = (value: string) => {
    const newMax = parseInt(value);
    if (!isNaN(newMax) && newMax > 0) {
      setMaxEvaluations(newMax);
      setMaxEvaluationsPerStudent(newMax);
      toast.success(`Maximum evaluations per student set to ${newMax}`);
    }
  };
  
  const approveUser = async (userId: string) => {
    try {
      // Use the database function for reliable status updates
      const { error } = await supabase.rpc('update_profile_status', {
        profile_id: userId,
        new_status: 'approved',
        new_is_approved: true
      });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      await loadUsers();
      toast.success("User has been approved and can now login");
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    }
  };

  const updateUser = async (userId: string, field: 'strand_course' | 'section' | 'full_name' | 'usn', value: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, [field]: value } : user
      ));
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const saveUserChanges = async (userId: string) => {
    setEditingUser(null);
    toast.success("User updated successfully");
  };

  const updateSectionCounts = (strandCourse: string, section: string, level: string) => {
    const sectionKey = `${strandCourse}-${section}`;
    
    try {
      // Get current section data
      const storedSectionCounts = localStorage.getItem("sectionCounts");
      let sectionCounts = storedSectionCounts ? JSON.parse(storedSectionCounts) : {};
      
      // Check if this section exists in our data
      if (!sectionCounts[sectionKey]) {
        sectionCounts[sectionKey] = {
          maxCount: 0, 
          signedUpCount: 0,
          evaluatedCount: 0,
          level: level // Add level (shs or college) to track section type
        };
      } 
      
      // Update signedUpCount
      if (sectionCounts[sectionKey].signedUpCount !== undefined) {
        sectionCounts[sectionKey].signedUpCount += 1;
      } else {
        sectionCounts[sectionKey].signedUpCount = 1;
      }
      
      // Save updated counts
      localStorage.setItem("sectionCounts", JSON.stringify(sectionCounts));
      
      // Trigger a custom storage event for SectionCountsDisplay to detect
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'users',
        newValue: localStorage.getItem('users')
      }));
      
    } catch (error) {
      console.error("Error updating section counts:", error);
    }
  };
  
  const rejectUser = async (userId: string) => {
    try {
      // Use the database function for reliable status updates
      const { error } = await supabase.rpc('update_profile_status', {
        profile_id: userId,
        new_status: 'declined',
        new_is_approved: false
      });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      await loadUsers();
      toast.success("User has been declined and cannot login");
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    }
  };
  
  const deleteUser = async (userId: string) => {
    try {
      // First delete from Supabase auth users
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Error deleting auth user:', authError);
        // Continue anyway, try to delete profile
      }

      // Then delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) throw profileError;
      
      // Optimistically update UI so the row disappears immediately
      setUsers(prev => prev.filter(u => u.user_id !== userId));
      toast.success("User has been deleted from the system");
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };
  
  // Get student level display text
  const getLevelDisplayText = (user: User) => {
    if (user.role !== "student") return "";
    return user.level === "shs" ? "Senior High" : "College";
  };

  const getCurrentSections = (user: User) => {
    if (user.level === "shs") {
      const strand = strands.find(s => s.name === user.strand_course);
      return strand ? strand.sections : [];
    } else {
      const course = courses.find(c => c.name === user.strand_course);
      return course ? course.sections : [];
    }
  };

  const getCurrentStrandsCourses = (level: string) => {
    return level === "shs" ? strands : courses;
  };

  const resetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    try {
      // Update password in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ password_hash: newPassword })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      setPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
      toast.success("Password updated successfully");
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    }
  };
  
  // Filter users based on search term, pending status, and level filter
  const pendingUsers = users
    .filter(user => 
      !user.is_approved && 
      (
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.usn && user.usn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.phone_number && user.phone_number.toLowerCase().includes(searchTerm.toLowerCase()))
      ) &&
      (levelFilter === "all" || user.level === levelFilter || !user.level)
    );

  // Debug logging
  console.log('Debug UserApprovalPage:', {
    totalUsers: users.length,
    pendingUsers: pendingUsers.length,
    searchTerm,
    levelFilter,
    allUsers: users.map(u => ({ name: u.full_name, approved: u.is_approved, level: u.level }))
  });
    
  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">User Approval</h1>
      </div>
      
      
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Pending Approval Requests</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <div className="relative">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by level" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="shs">Senior High School</SelectItem>
                <SelectItem value="college">College</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-8" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableCaption>Student account requests awaiting approval</TableCaption>
           <TableHeader>
             <TableRow>
                <TableHead className="min-w-[120px]">Name</TableHead>
                <TableHead className="min-w-[100px]">USN</TableHead>
                <TableHead className="min-w-[100px]">Course/Strand</TableHead>
                <TableHead className="min-w-[80px]">Section</TableHead>
                <TableHead className="min-w-[100px] hidden md:table-cell">Requested On</TableHead>
                <TableHead className="text-right min-w-[120px]">Actions</TableHead>
             </TableRow>
           </TableHeader>
          <TableBody>
            {pendingUsers.length > 0 ? (
              pendingUsers.map((user) => (
                 <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.usn || "N/A"}</TableCell>
                   <TableCell>{user.strand_course}</TableCell>
                   <TableCell>{user.section}</TableCell>
                   <TableCell className="hidden md:table-cell">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                   <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-green-600 border-green-600"
                        onClick={() => approveUser(user.id)}
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Approve</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 border-red-600"
                        onClick={() => rejectUser(user.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Reject</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
             ) : (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-6">
                     {searchTerm || levelFilter !== "all"
                       ? "No pending users match your search criteria" 
                       : "No pending user approval requests"}
                   </TableCell>
                 </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableCaption>Complete list of all system users</TableCaption>
             <TableHeader>
               <TableRow>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="min-w-[100px]">USN</TableHead>
                  <TableHead className="min-w-[100px]">Course/Strand</TableHead>
                  <TableHead className="min-w-[80px]">Section</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[150px]">Actions</TableHead>
               </TableRow>
             </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users
                .filter(user => 
                  (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (user.usn && user.usn.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (user.phone_number && user.phone_number.toLowerCase().includes(searchTerm.toLowerCase()))) &&
                  (levelFilter === "all" || user.level === levelFilter || !user.level)
                )
                  .map((user) => (
                     <TableRow key={user.id}>
                       <TableCell className="font-medium">
                         {editingUser === user.id && user.is_approved ? (
                           <Input
                             value={user.full_name}
                             onChange={(e) => updateUser(user.id, 'full_name', e.target.value)}
                             className="min-w-[120px]"
                           />
                         ) : (
                           user.full_name
                         )}
                       </TableCell>
                       <TableCell>
                         {editingUser === user.id && user.is_approved ? (
                           <Input
                             value={user.usn || ""}
                             onChange={(e) => updateUser(user.id, 'usn', e.target.value)}
                             className="min-w-[100px]"
                           />
                         ) : (
                           user.usn || "N/A"
                         )}
                       </TableCell>
                      <TableCell>
                        {editingUser === user.id && user.is_approved && user.level ? (
                          <Select 
                            value={user.strand_course} 
                            onValueChange={(value) => updateUser(user.id, 'strand_course', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getCurrentStrandsCourses(user.level).map((item) => (
                                <SelectItem key={item.id} value={item.name}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          user.strand_course
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUser === user.id && user.is_approved && user.level ? (
                          <Select 
                            value={user.section} 
                            onValueChange={(value) => updateUser(user.id, 'section', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getCurrentSections(user).map((section) => (
                                <SelectItem key={section} value={section}>
                                  {section}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          user.section
                        )}
                       </TableCell>
                       <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === 'approved' ? 'bg-green-100 text-green-800' :
                          user.status === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.status === 'approved' ? 'Approved' : 
                           user.status === 'declined' ? 'Declined' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {user.is_approved && user.level && (
                            <>
                              {editingUser === user.id ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => saveUserChanges(user.id)}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingUser(user.id)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </>
                          )}
                          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                              >
                                <Key className="h-4 w-4 mr-1" />
                                Reset Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                  Set a new password for {user.full_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="newPassword">New Password</Label>
                                  <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={resetPassword}>
                                  Update Password
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
               ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No users found
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default UserApprovalPage;
