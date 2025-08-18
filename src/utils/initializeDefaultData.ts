export interface Teacher {
  id: number;
  name: string;
  position: string;
  category: 'SHS' | 'College';
  subjects: string[];
}

export interface CollegeAssignment {
  id: number;
  subject: string;
  teacherId: number;
  sectionId: string;
}

export interface SHSAssignment {
  id: number;
  section: string;
  strandCourse: string;
  teacherIds: number[];
  subjects: string[];
}

export const initializeDefaultData = () => {
  // Clear all existing data first for fresh start
  localStorage.removeItem('teachers');
  localStorage.removeItem('collegeAssignments');
  localStorage.removeItem('shsAssignments');
  localStorage.removeItem('evaluations');
  localStorage.removeItem('sectionCounts');

  // Sample teachers - 15 total (5 can teach both college and SHS)
  const teachers: Teacher[] = [
    // Teachers who can teach both College and SHS
    { id: 1, name: "Dr. Maria Santos", position: "Professor", category: "College", subjects: ["Mathematics", "Statistics"] },
    { id: 2, name: "Prof. John Rodriguez", position: "Associate Professor", category: "College", subjects: ["English", "Technical Writing"] },
    { id: 3, name: "Dr. Anna Cruz", position: "Professor", category: "College", subjects: ["Computer Programming", "ICT"] },
    { id: 4, name: "Prof. Michael Torres", position: "Assistant Professor", category: "College", subjects: ["Physical Science", "Physics"] },
    { id: 5, name: "Dr. Sarah Garcia", position: "Professor", category: "College", subjects: ["Research Methods", "Filipino"] },
    
    // College-only teachers
    { id: 6, name: "Prof. David Luna", position: "Associate Professor", category: "College", subjects: ["Database Systems", "Software Engineering"] },
    { id: 7, name: "Dr. Carmen Reyes", position: "Professor", category: "College", subjects: ["Web Development", "Mobile Programming"] },
    { id: 8, name: "Prof. Robert Diaz", position: "Assistant Professor", category: "College", subjects: ["Computer Networks", "Cybersecurity"] },
    { id: 9, name: "Dr. Elena Flores", position: "Professor", category: "College", subjects: ["Artificial Intelligence", "Machine Learning"] },
    { id: 10, name: "Prof. Antonio Valdez", position: "Associate Professor", category: "College", subjects: ["Operating Systems", "Computer Architecture"] },

    // SHS-only teachers
    { id: 11, name: "Ms. Grace Mendoza", position: "Senior High Teacher", category: "SHS", subjects: ["General Mathematics", "Business Math"] },
    { id: 12, name: "Mr. James Aquino", position: "Senior High Teacher", category: "SHS", subjects: ["English for Academic Purposes", "Creative Writing"] },
    { id: 13, name: "Ms. Patricia Ramos", position: "Senior High Teacher", category: "SHS", subjects: ["Araling Panlipunan", "Understanding Culture"] },
    { id: 14, name: "Mr. Steven Cruz", position: "Senior High Teacher", category: "SHS", subjects: ["Earth Science", "Physical Education"] },
    { id: 15, name: "Ms. Jennifer Lopez", position: "Senior High Teacher", category: "SHS", subjects: ["Philosophy", "Art Appreciation"] }
  ];

  // College assignments
  const collegeAssignments: CollegeAssignment[] = [
    // BSIT 1-1
    { id: 1, subject: "Mathematics", teacherId: 1, sectionId: "BSIT 1-1" },
    { id: 2, subject: "English", teacherId: 2, sectionId: "BSIT 1-1" },
    { id: 3, subject: "Computer Programming", teacherId: 3, sectionId: "BSIT 1-1" },
    { id: 4, subject: "Physical Science", teacherId: 4, sectionId: "BSIT 1-1" },
    
    // BSIT 2-1
    { id: 5, subject: "Statistics", teacherId: 1, sectionId: "BSIT 2-1" },
    { id: 6, subject: "Technical Writing", teacherId: 2, sectionId: "BSIT 2-1" },
    { id: 7, subject: "Database Systems", teacherId: 6, sectionId: "BSIT 2-1" },
    { id: 8, subject: "ICT", teacherId: 3, sectionId: "BSIT 2-1" },
    
    // BSIT 3-1
    { id: 9, subject: "Web Development", teacherId: 7, sectionId: "BSIT 3-1" },
    { id: 10, subject: "Software Engineering", teacherId: 6, sectionId: "BSIT 3-1" },
    { id: 11, subject: "Computer Networks", teacherId: 8, sectionId: "BSIT 3-1" },
    { id: 12, subject: "Physics", teacherId: 4, sectionId: "BSIT 3-1" },
    
    // BSIT 4-1
    { id: 13, subject: "Mobile Programming", teacherId: 7, sectionId: "BSIT 4-1" },
    { id: 14, subject: "Cybersecurity", teacherId: 8, sectionId: "BSIT 4-1" },
    { id: 15, subject: "Artificial Intelligence", teacherId: 9, sectionId: "BSIT 4-1" },
    { id: 16, subject: "Research Methods", teacherId: 5, sectionId: "BSIT 4-1" },
    
    // ACT 1-1
    { id: 17, subject: "Mathematics", teacherId: 1, sectionId: "ACT 1-1" },
    { id: 18, subject: "English", teacherId: 2, sectionId: "ACT 1-1" },
    { id: 19, subject: "Computer Programming", teacherId: 3, sectionId: "ACT 1-1" },
    { id: 20, subject: "Operating Systems", teacherId: 10, sectionId: "ACT 1-1" },
    
    // ACT 2-1
    { id: 21, subject: "Database Systems", teacherId: 6, sectionId: "ACT 2-1" },
    { id: 22, subject: "Statistics", teacherId: 1, sectionId: "ACT 2-1" },
    { id: 23, subject: "Web Development", teacherId: 7, sectionId: "ACT 2-1" },
    { id: 24, subject: "Machine Learning", teacherId: 9, sectionId: "ACT 2-1" },
    
    // BSE 1-1
    { id: 25, subject: "Mathematics", teacherId: 1, sectionId: "BSE 1-1" },
    { id: 26, subject: "English", teacherId: 2, sectionId: "BSE 1-1" },
    { id: 27, subject: "Physical Science", teacherId: 4, sectionId: "BSE 1-1" },
    { id: 28, subject: "Computer Programming", teacherId: 3, sectionId: "BSE 1-1" },
    
    // BSE 2-1
    { id: 29, subject: "Statistics", teacherId: 1, sectionId: "BSE 2-1" },
    { id: 30, subject: "Technical Writing", teacherId: 2, sectionId: "BSE 2-1" },
    { id: 31, subject: "Computer Architecture", teacherId: 10, sectionId: "BSE 2-1" },
    { id: 32, subject: "Filipino", teacherId: 5, sectionId: "BSE 2-1" }
  ];

  // SHS assignments (using teachers 1-5 who can teach both + SHS-only teachers 11-15)
  const shsAssignments: SHSAssignment[] = [
    // ABM sections
    { id: 1, section: "9-1", strandCourse: "ABM", teacherIds: [1, 11, 13, 12], subjects: ["Mathematics", "General Mathematics", "Araling Panlipunan", "English for Academic Purposes"] },
    { id: 2, section: "9-2", strandCourse: "ABM", teacherIds: [1, 11, 14, 15], subjects: ["Statistics", "Business Math", "Earth Science", "Philosophy"] },
    { id: 3, section: "8-1", strandCourse: "ABM", teacherIds: [2, 12, 13, 14], subjects: ["English", "Creative Writing", "Understanding Culture", "Physical Education"] },
    
    // GAS sections
    { id: 4, section: "9-1", strandCourse: "GAS", teacherIds: [1, 2, 13, 15], subjects: ["Mathematics", "English", "Araling Panlipunan", "Philosophy"] },
    { id: 5, section: "9-2", strandCourse: "GAS", teacherIds: [4, 14, 15, 5], subjects: ["Physical Science", "Earth Science", "Art Appreciation", "Filipino"] },
    { id: 6, section: "8-1", strandCourse: "GAS", teacherIds: [3, 11, 12, 14], subjects: ["Computer Programming", "Business Math", "English for Academic Purposes", "Physical Education"] },
    
    // HUMSS sections
    { id: 7, section: "9-1", strandCourse: "HUMSS", teacherIds: [2, 5, 13, 15], subjects: ["Technical Writing", "Research Methods", "Understanding Culture", "Philosophy"] },
    { id: 8, section: "9-2", strandCourse: "HUMSS", teacherIds: [1, 12, 13, 15], subjects: ["Statistics", "Creative Writing", "Araling Panlipunan", "Art Appreciation"] },
    { id: 9, section: "9-3", strandCourse: "HUMSS", teacherIds: [2, 5, 14, 15], subjects: ["English", "Filipino", "Earth Science", "Philosophy"] },
    { id: 10, section: "8-1", strandCourse: "HUMSS", teacherIds: [1, 2, 12, 14], subjects: ["Mathematics", "English", "English for Academic Purposes", "Physical Education"] },
    
    // TVL sections
    { id: 11, section: "9-1", strandCourse: "TVL", teacherIds: [3, 1, 14, 4], subjects: ["Computer Programming", "Mathematics", "Physical Education", "Physical Science"] },
    { id: 12, section: "8-1", strandCourse: "TVL", teacherIds: [3, 2, 11, 4], subjects: ["ICT", "Technical Writing", "General Mathematics", "Physics"] }
  ];

  // Sample questions
  const questions = [
    { id: "q1", text: "The teacher demonstrates mastery of the subject matter", category: "Subject Knowledge" },
    { id: "q2", text: "The teacher explains concepts clearly and effectively", category: "Teaching Methods" },
    { id: "q3", text: "The teacher uses appropriate teaching materials and resources", category: "Teaching Methods" },
    { id: "q4", text: "The teacher encourages student participation and engagement", category: "Student Engagement" },
    { id: "q5", text: "The teacher provides timely and constructive feedback", category: "Assessment" },
    { id: "q6", text: "The teacher maintains a positive learning environment", category: "Classroom Management" },
    { id: "q7", text: "The teacher is punctual and well-prepared for classes", category: "Professionalism" },
    { id: "q8", text: "The teacher shows respect for students and their diverse backgrounds", category: "Professionalism" },
    { id: "q9", text: "The teacher uses technology effectively to enhance learning", category: "Technology Integration" },
    { id: "q10", text: "The teacher demonstrates continuous professional development", category: "Professional Growth" }
  ];

  // Semester configuration
  const semesterConfig = {
    semester: "1st Semester",
    evaluationDate: new Date().toISOString().split('T')[0]
  };

  // Save all data to localStorage
  localStorage.setItem('teachers', JSON.stringify(teachers));
  localStorage.setItem('collegeAssignments', JSON.stringify(collegeAssignments));
  localStorage.setItem('shsAssignments', JSON.stringify(shsAssignments));
  localStorage.setItem('adminQuestions', JSON.stringify(questions));
  localStorage.setItem('semesterConfig', JSON.stringify(semesterConfig));

  console.log('Default data initialized successfully');
};