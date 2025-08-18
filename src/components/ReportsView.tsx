import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Document as DocxDocument, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, Media } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

// Interface for teacher ratings data
interface TeacherRatings {
  teachingEffectiveness: string;
  courseContent: string;
  classroomManagement: string;
  communication: string;
  preparedness: string;
  [key: string]: string; // Add index signature for dynamic questions (q1-q20)
}

interface Evaluation {
  id: number;
  teacher: string;
  date: string;
  status: string;
  studentId?: string;
  subject?: string;
  results: TeacherRatings;
  feedback?: string;
}

interface Teacher {
  name: string;
  ratings: {
    teaching: number;
    content: number;
    management: number;
    communication: number;
    preparedness: number;
  };
  students: number;
  department: string;
  averageRating: number;
}

// Helper function to calculate average rating for a teacher
const calculateAverageRating = (ratings: any): number => {
  const values = Object.values(ratings) as number[];
  if (values.length === 0) return 0;
  const sum = values.reduce((sum, val) => sum + Number(val), 0);
  return sum / values.length;
};

// Group evaluation questions into categories
const mapQuestionToCategory = (questionKey: string): string => {
  const questionNumber = parseInt(questionKey.substring(1));
  
  // Map question numbers to categories
  // q1-q4 -> Teaching
  // q5-q8 -> Content
  // q9-q12 -> Management 
  // q13-q16 -> Communication
  // q17-q20 -> Preparedness
  if (questionNumber >= 1 && questionNumber <= 4) {
    return 'teaching';
  } else if (questionNumber >= 5 && questionNumber <= 8) {
    return 'content';
  } else if (questionNumber >= 9 && questionNumber <= 12) {
    return 'management';
  } else if (questionNumber >= 13 && questionNumber <= 16) {
    return 'communication';
  } else if (questionNumber >= 17 && questionNumber <= 20) {
    return 'preparedness';
  }
  
  return 'teaching'; // Default category
};

const ReportsView = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [teachersData, setTeachersData] = useState<Teacher[]>([]);
  const [overallStats, setOverallStats] = useState({
    averageRating: 0,
    totalEvaluations: 0,
    highestRatedTeacher: { name: "", averageRating: 0, students: 0 },
    lowestRatedTeacher: { name: "", averageRating: 0, students: 0 }
  });
  
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Effect to load and process evaluation data
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        // Try to load from Supabase first
        const { data: evaluationsData, error } = await supabase
          .from('evaluations')
          .select(`
            *,
            profiles!evaluations_student_id_fkey(usn),
            teachers!evaluations_teacher_id_fkey(name, department)
          `);

        if (error) {
          console.error('Error loading from Supabase:', error);
          // Fallback to localStorage
          processLocalStorageEvaluations();
          return;
        }

        if (evaluationsData && evaluationsData.length > 0) {
          processSupabaseEvaluations(evaluationsData);
        } else {
          // If no Supabase data, check localStorage
          processLocalStorageEvaluations();
        }
      } catch (error) {
        console.error('Error connecting to Supabase:', error);
        // Fallback to localStorage
        processLocalStorageEvaluations();
      }
    };

    const processLocalStorageEvaluations = () => {
      // Get evaluations from localStorage
      const storedEvaluations = localStorage.getItem('evaluations');
      if (!storedEvaluations) return;
      
      const evaluations: Evaluation[] = JSON.parse(storedEvaluations);
      if (!evaluations.length) return;
      
      // Group evaluations by teacher
      const teacherGroups: Record<string, Evaluation[]> = {};
      evaluations.forEach(evaluation => {
        if (!teacherGroups[evaluation.teacher]) {
          teacherGroups[evaluation.teacher] = [];
        }
        teacherGroups[evaluation.teacher].push(evaluation);
      });
      
      // Process teacher data
      const processedTeachers: Teacher[] = Object.keys(teacherGroups).map(teacherName => {
        const teacherEvals = teacherGroups[teacherName];
        const students = teacherEvals.length;
        
        // Initialize category totals for both old and new format
        const totalRatings = {
          teaching: 0,
          content: 0,
          management: 0,
          communication: 0,
          preparedness: 0
        };
        
        // Track count of ratings per category (to calculate average)
        const categoryCount = {
          teaching: 0,
          content: 0, 
          management: 0,
          communication: 0,
          preparedness: 0
        };
        
        // Process each evaluation
        teacherEvals.forEach(evaluation => {
          const results = evaluation.results;
          
          // Check if this is using the new format (q1-q20)
          const isNewFormat = Object.keys(results).some(key => key.startsWith('q'));
          
          if (isNewFormat) {
            // Process new format (q1-q20)
            for (const [key, value] of Object.entries(results)) {
              if (key.startsWith('q') && !isNaN(parseInt(key.substring(1))) && value) {
                const category = mapQuestionToCategory(key);
                const numericValue = parseInt(value);
                if (!isNaN(numericValue)) {
                  totalRatings[category] += numericValue;
                  categoryCount[category]++;
                }
              }
            }
          } else {
            // Process old format
            if (results.teachingEffectiveness || results.courseContent) {
              // Process old format
              if (results.teachingEffectiveness) {
                totalRatings.teaching += parseInt(results.teachingEffectiveness || "0");
                categoryCount.teaching++;
              }
              if (results.courseContent) {
                totalRatings.content += parseInt(results.courseContent || "0");
                categoryCount.content++;
              }
              if (results.classroomManagement) {
                totalRatings.management += parseInt(results.classroomManagement || "0");
                categoryCount.management++;
              }
              if (results.communication) {
                totalRatings.communication += parseInt(results.communication || "0");
                categoryCount.communication++;
              }
              if (results.preparedness) {
                totalRatings.preparedness += parseInt(results.preparedness || "0");
                categoryCount.preparedness++;
              }
            }
          }
        });
        
        // Calculate average ratings per category
        const ratings = {
          teaching: categoryCount.teaching > 0 ? totalRatings.teaching / categoryCount.teaching : 0,
          content: categoryCount.content > 0 ? totalRatings.content / categoryCount.content : 0,
          management: categoryCount.management > 0 ? totalRatings.management / categoryCount.management : 0,
          communication: categoryCount.communication > 0 ? totalRatings.communication / categoryCount.communication : 0,
          preparedness: categoryCount.preparedness > 0 ? totalRatings.preparedness / categoryCount.preparedness : 0
        };
        
        // Determine department (use first evaluation subject as department if available)
        const department = teacherEvals[0].subject || "General";
        
        // Calculate average rating for this teacher using all non-zero categories
        const nonZeroCategories = Object.values(ratings).filter(value => value > 0);
        const avgRating = nonZeroCategories.length > 0 ? 
          nonZeroCategories.reduce((sum, val) => sum + val, 0) / nonZeroCategories.length : 0;
        
        return {
          name: teacherName,
          ratings,
          students,
          department,
          averageRating: avgRating
        };
      });
      
      setTeachersData(processedTeachers);
      
      // Calculate overall statistics
      if (processedTeachers.length) {
        const teachersSortedByRating = [...processedTeachers].sort((a, b) => 
          b.averageRating - a.averageRating
        );
        
        const defaultTeacher = { name: "N/A", averageRating: 0, students: 0 };
        const highestRated = teachersSortedByRating[0] || defaultTeacher;
        const lowestRated = teachersSortedByRating[teachersSortedByRating.length - 1] || defaultTeacher;
        
        setOverallStats({
          averageRating: processedTeachers.reduce((sum, t) => sum + t.averageRating, 0) / processedTeachers.length,
          totalEvaluations: processedTeachers.reduce((sum, t) => sum + t.students, 0),
          highestRatedTeacher: highestRated,
          lowestRatedTeacher: lowestRated
        });
      }
    };

    const processSupabaseEvaluations = (evaluationsData: any[]) => {
      // Group evaluations by teacher
      const teacherGroups: Record<string, any[]> = {};
      evaluationsData.forEach(evaluation => {
        const teacherName = evaluation.teachers?.name || 'Unknown Teacher';
        if (!teacherGroups[teacherName]) {
          teacherGroups[teacherName] = [];
        }
        teacherGroups[teacherName].push(evaluation);
      });
      
      // Process teacher data
      const processedTeachers: Teacher[] = Object.keys(teacherGroups).map(teacherName => {
        const teacherEvals = teacherGroups[teacherName];
        const students = teacherEvals.length;
        
        // Calculate average ratings
        const totalRating = teacherEvals.reduce((sum, evaluation) => sum + evaluation.overall_rating, 0);
        const avgRating = totalRating / students;
        
        // Use Supabase categories for department
        const department = teacherEvals[0]?.teachers?.department || "General";
        
        return {
          name: teacherName,
          ratings: {
            teaching: teacherEvals.reduce((sum, evaluation) => sum + evaluation.teaching_effectiveness, 0) / students,
            content: teacherEvals.reduce((sum, evaluation) => sum + evaluation.course_content, 0) / students,
            management: teacherEvals.reduce((sum, evaluation) => sum + evaluation.classroom_management, 0) / students,
            communication: 0, // Not in current Supabase schema
            preparedness: teacherEvals.reduce((sum, evaluation) => sum + evaluation.responsiveness, 0) / students
          },
          students,
          department,
          averageRating: avgRating
        };
      });
      
      setTeachersData(processedTeachers);
      
      // Calculate overall statistics
      if (processedTeachers.length) {
        const teachersSortedByRating = [...processedTeachers].sort((a, b) => 
          b.averageRating - a.averageRating
        );
        
        const defaultTeacher = { name: "N/A", averageRating: 0, students: 0 };
        const highestRated = teachersSortedByRating[0] || defaultTeacher;
        const lowestRated = teachersSortedByRating[teachersSortedByRating.length - 1] || defaultTeacher;
        
        setOverallStats({
          averageRating: processedTeachers.reduce((sum, t) => sum + t.averageRating, 0) / processedTeachers.length,
          totalEvaluations: processedTeachers.reduce((sum, t) => sum + t.students, 0),
          highestRatedTeacher: highestRated,
          lowestRatedTeacher: lowestRated
        });
      }
    };

    processLocalStorageEvaluations();
    
    loadEvaluations();
  }, []);
  
  // Function to handle printing
  const handlePrint = useReactToPrint({
    documentTitle: "ACLC Teacher Evaluation Report",
    onAfterPrint: () => toast.success("Report printed successfully!"),
    contentRef: reportRef,
  });

  // Export teacher ratings to Word
  const exportTeacherRatingsToWord = async () => {
    // Fetch logo as base64
    let logoImage = null;
    try {
      const response = await fetch("/lovable-uploads/logo.png");
      const blob = await response.blob();
      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result?.toString().split(",")[1]);
        reader.readAsDataURL(blob);
      });
      logoImage = Media.addImage(new DocxDocument(), base64, 100, 100);
    } catch {}

    // Table rows
    const tableRows = [
      new DocxTableRow({
        children: [
          new DocxTableCell({ children: [new Paragraph("Teacher Name")] }),
          new DocxTableCell({ children: [new Paragraph("Teaching")] }),
          new DocxTableCell({ children: [new Paragraph("Content")] }),
          new DocxTableCell({ children: [new Paragraph("Management")] }),
          new DocxTableCell({ children: [new Paragraph("Communication")] }),
          new DocxTableCell({ children: [new Paragraph("Preparedness")] }),
          new DocxTableCell({ children: [new Paragraph("Average")] }),
          new DocxTableCell({ children: [new Paragraph("Students")] }),
        ],
      }),
      ...filteredTeachers.map(teacher =>
        new DocxTableRow({
          children: [
            new DocxTableCell({ children: [new Paragraph(teacher.name)] }),
            new DocxTableCell({ children: [new Paragraph(teacher.ratings.teaching.toFixed(1))] }),
            new DocxTableCell({ children: [new Paragraph(teacher.ratings.content.toFixed(1))] }),
            new DocxTableCell({ children: [new Paragraph(teacher.ratings.management.toFixed(1))] }),
            new DocxTableCell({ children: [new Paragraph(teacher.ratings.communication.toFixed(1))] }),
            new DocxTableCell({ children: [new Paragraph(teacher.ratings.preparedness.toFixed(1))] }),
            new DocxTableCell({ children: [new Paragraph(teacher.averageRating.toFixed(1))] }),
            new DocxTableCell({ children: [new Paragraph(String(teacher.students))] }),
          ],
        })
      ),
    ];

    const doc = new DocxDocument({
      sections: [
        {
          properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
          children: [
            logoImage ? logoImage : new Paragraph(""),
            new Paragraph({ children: ["ACLC College of Daet"] }),
            new Paragraph({ children: ["Teacher Ratings"] }),
            new DocxTable({ rows: tableRows }),
            new Paragraph({ children: ["Generated on " + new Date().toLocaleDateString()] }),
          ],
        },
      ],
    });
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "TeacherRatings.docx");
    });
  };

  // Export teacher ratings to Excel
  const exportTeacherRatingsToExcel = () => {
    const data = [
      ["Teacher Name", "Teaching", "Content", "Management", "Communication", "Preparedness", "Average", "Students"],
      ...filteredTeachers.map(teacher => [
        teacher.name,
        teacher.ratings.teaching.toFixed(1),
        teacher.ratings.content.toFixed(1),
        teacher.ratings.management.toFixed(1),
        teacher.ratings.communication.toFixed(1),
        teacher.ratings.preparedness.toFixed(1),
        teacher.averageRating.toFixed(1),
        teacher.students
      ])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teacher Ratings");
    XLSX.writeFile(workbook, "TeacherRatings.xlsx");
  };

  // Filter teachers based on department
  const filteredTeachers = selectedDepartment === "all" 
    ? teachersData 
    : teachersData.filter(t => t.department === selectedDepartment);
  
  // Get unique departments for filter - limit to SHS and College only
  const departments = ["all", "Senior High School", "College"];
  
  // Get all teacher names for filter
  const teacherNames = ["all", ...teachersData.map(t => t.name)];
  
  // Get data for selected teacher or show all if "all" is selected
  const teacherDetailData = selectedTeacher === "all" 
    ? filteredTeachers 
    : teachersData.filter(t => t.name === selectedTeacher);

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="print:block print:text-center print:mb-6 hidden">
        <img src="/lovable-uploads/logo.png" alt="Logo" style={{ width: 100, margin: "0 auto" }} />
        <h1 className="text-2xl font-bold">ACLC College of Daet</h1>
        <h2 className="text-xl">Teacher Evaluation Report</h2>
        <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold">Evaluation Reports</h2>
        <div className="flex items-center space-x-2">
          
          
          <Select 
            defaultValue={selectedTeacher} 
            onValueChange={setSelectedTeacher}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {teacherNames.map(name => (
                  <SelectItem key={name} value={name}>
                    {name === "all" ? "All Teachers" : name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
        
        </div>
      </div>

      {teachersData.length > 0 ? (
        <Tabs defaultValue="summary" className="w-full print:hidden">
          <TabsList className="w-full max-w-md mb-6">
            <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
            <TabsTrigger value="teachers" className="flex-1">Teacher Ratings</TabsTrigger>
           
            <TabsTrigger value="statistics" className="flex-1">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Summary Statistics</CardTitle>
                  <CardDescription>Overall evaluation metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Overall Average Rating</div>
                      <div className="text-2xl font-medium">{overallStats.averageRating.toFixed(1)} / 5.0</div>
                      <div className="text-sm">Based on {overallStats.totalEvaluations} total evaluations</div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Highest Rated Teacher</div>
                      <div className="text-xl font-medium">{overallStats.highestRatedTeacher.name}</div>
                      <div className="text-sm">
                        {overallStats.highestRatedTeacher.averageRating?.toFixed(1)} / 5.0 
                        ({overallStats.highestRatedTeacher.students} evaluations)
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Total Teachers Evaluated</div>
                      <div className="text-2xl font-medium">{teachersData.length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Teacher detail cards only in summary tab */}
              {teacherDetailData.length > 0 && (
                <div className="space-y-6 print:mt-8">
                  <h2 className="text-xl font-bold print:text-center">Teacher Evaluation Report</h2>
                  {teacherDetailData.map((teacher) => (
                    <Card key={teacher.name} className="print:break-inside-avoid">
                      <CardHeader>
                        <CardTitle>{teacher.name}</CardTitle>
                        <CardDescription>Department: {teacher.department}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Overall Rating:</span>
                            <span className={`text-lg font-bold ${
                              (teacher.averageRating || 0) >= 4.5 ? "text-green-600" : 
                              (teacher.averageRating || 0) >= 4.0 ? "text-blue-600" : "text-yellow-600"
                            }`}>
                              {teacher.averageRating?.toFixed(2)} / 5.0
                            </span>
                          </div>
                          <div className="space-y-3">
                            {Object.entries(teacher.ratings).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-2">
                                <div className="capitalize">{key}:</div>
                                <div className="text-right">
                                  <span className={
                                    Number(value) >= 4.5 ? "text-green-600" : 
                                    Number(value) >= 4.0 ? "text-blue-600" : "text-yellow-600"
                                  }>
                                    {Number(value).toFixed(1)}
                                  </span> / 5.0
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-4 flex justify-between items-center">
                            <span>Evaluations:</span>
                            <span className="font-medium">{teacher.students}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="teachers" className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher Name</TableHead>
                  <TableHead>Teaching</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Management</TableHead>
                  <TableHead>Communication</TableHead>
                  <TableHead>Preparedness</TableHead>
                  <TableHead>Average</TableHead>
                  <TableHead>Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.name}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell className={teacher.ratings.teaching >= 4.5 ? "text-green-600" : teacher.ratings.teaching >= 4.0 ? "text-blue-600" : "text-yellow-600"}>
                        {teacher.ratings.teaching.toFixed(1)}
                      </TableCell>
                      <TableCell className={teacher.ratings.content >= 4.5 ? "text-green-600" : teacher.ratings.content >= 4.0 ? "text-blue-600" : "text-yellow-600"}>
                        {teacher.ratings.content.toFixed(1)}
                      </TableCell>
                      <TableCell className={teacher.ratings.management >= 4.5 ? "text-green-600" : teacher.ratings.management >= 4.0 ? "text-blue-600" : "text-yellow-600"}>
                        {teacher.ratings.management.toFixed(1)}
                      </TableCell>
                      <TableCell className={teacher.ratings.communication >= 4.5 ? "text-green-600" : teacher.ratings.communication >= 4.0 ? "text-blue-600" : "text-yellow-600"}>
                        {teacher.ratings.communication.toFixed(1)}
                      </TableCell>
                      <TableCell className={teacher.ratings.preparedness >= 4.5 ? "text-green-600" : teacher.ratings.preparedness >= 4.0 ? "text-blue-600" : "text-yellow-600"}>
                        {teacher.ratings.preparedness.toFixed(1)}
                      </TableCell>
                      <TableCell className="font-bold bg-slate-50">
                        <div className={teacher.averageRating >= 4.5 ? "text-green-600" : teacher.averageRating >= 4.0 ? "text-blue-600" : "text-yellow-600"}>
                          {teacher.averageRating.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell>{teacher.students}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No teacher evaluations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex justify-end gap-2">
             
              <Button variant="outline" size="sm" onClick={exportTeacherRatingsToExcel}>
                <Download size={16} className="mr-2" />
                Export to Excel
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="departments" className="space-y-6">
          </TabsContent>
          
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistical Analysis</CardTitle>
                  <CardDescription>Detailed statistics by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border rounded-lg p-3 text-center">
                        <div className="text-sm text-muted-foreground">Mean</div>
                        <div className="text-xl font-medium">{overallStats.averageRating.toFixed(2)}</div>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <div className="text-sm text-muted-foreground">Median</div>
                        <div className="text-xl font-medium">
                          {teachersData.length > 0 
                            ? (teachersData.sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0))[Math.floor(teachersData.length / 2)].averageRating || 0).toFixed(2)
                            : "0.00"}
                        </div>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <div className="text-sm text-muted-foreground">Mode</div>
                        <div className="text-xl font-medium">-</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Standard Deviation</div>
                      <div className="text-xl font-medium">-</div>
                      <div className="text-sm">Consistency in ratings across teachers</div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Variance</div>
                      <div className="text-xl font-medium">-</div>
                      <div className="text-sm">Spread of evaluation scores</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Category Analysis</CardTitle>
                  <CardDescription>Average scores by evaluation category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teachersData.length > 0 ? (
                      ["Teaching", "Content", "Management", "Communication", "Preparedness"].map((category, index) => {
                        const categoryKey = category.toLowerCase();
                        const avgScore = teachersData.reduce((sum, t) => sum + t.ratings[categoryKey], 0) / teachersData.length;
                        
                        return (
                          <div key={index} className="flex items-center">
                            <div className="w-36">{category}</div>
                            <div className="flex-1">
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${avgScore >= 4.5 ? "bg-green-500" : avgScore >= 4.0 ? "bg-blue-500" : "bg-yellow-500"}`} 
                                  style={{ width: `${(avgScore / 5) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="w-12 text-right font-medium">{avgScore.toFixed(2)}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No evaluation data available.
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-muted-foreground">
                    Based on {overallStats.totalEvaluations} evaluation responses
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-lg text-muted-foreground">No evaluation data available yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Data will appear here once students submit their evaluations.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
