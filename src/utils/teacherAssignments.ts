
/**
 * Teacher Assignments Utility
 * This utility provides functions to access teacher assignments data from localStorage
 */

interface Teacher {
  id: number;
  name: string;
  position: string;
  category: 'SHS' | 'College';
  subjects: string[]; // Add subjects array to teacher interface
}

interface CollegeAssignment {
  id: number;
  subject: string;
  teacherId: number;
  sectionId: string;
}

interface SHSAssignment {
  id: number;
  section: string;
  strandCourse: string;
  teacherIds: number[];
  subjects: string[];
}

// Enhanced user interface to track evaluation limits
interface UserEvaluationStatus {
  userId: string;
  evaluatedTeachers: number[];
  totalEvaluations: number;
  maxEvaluations: number;
}

// Get all teachers
export const getTeachers = (): Teacher[] => {
  const teachers = localStorage.getItem('teachers');
  return teachers ? JSON.parse(teachers) : [];
};

// Get teachers filtered by category
export const getTeachersByCategory = (category: 'SHS' | 'College' | 'all'): Teacher[] => {
  const teachers = getTeachers();
  if (category === 'all') return teachers;
  return teachers.filter(teacher => teacher.category === category);
};

// Get teacher by ID
export const getTeacherById = (id: number): Teacher | undefined => {
  const teachers = getTeachers();
  return teachers.find(teacher => teacher.id === id);
};

// Get teacher name by ID
export const getTeacherName = (id: number): string => {
  const teacher = getTeacherById(id);
  return teacher ? teacher.name : "Unknown Teacher";
};

// Get all college assignments
export const getCollegeAssignments = (): CollegeAssignment[] => {
  const assignments = localStorage.getItem('collegeAssignments');
  return assignments ? JSON.parse(assignments) : [];
};

// Get college assignments for a specific section
export const getCollegeAssignmentsForSection = (course: string, section: string): CollegeAssignment[] => {
  const sectionId = `${course} ${section}`;
  const assignments = getCollegeAssignments();
  return assignments.filter(assignment => assignment.sectionId === sectionId);
};

// Get subjects available for a college section
export const getSubjectsForCollegeSection = (course: string, section: string): string[] => {
  const assignments = getCollegeAssignmentsForSection(course, section);
  return assignments.map(assignment => assignment.subject);
};

// Get teacher for a specific college subject
export const getTeacherForCollegeSubject = (course: string, section: string, subject: string): Teacher | undefined => {
  const assignments = getCollegeAssignmentsForSection(course, section);
  const assignment = assignments.find(a => a.subject === subject);
  
  if (!assignment) return undefined;
  return getTeacherById(assignment.teacherId);
};

// Get all SHS assignments
export const getSHSAssignments = (): SHSAssignment[] => {
  const assignments = localStorage.getItem('shsAssignments');
  return assignments ? JSON.parse(assignments) : [];
};

// Get SHS assignment for a specific strand and section
export const getSHSAssignmentForSection = (strand: string, section: string): SHSAssignment | undefined => {
  const assignments = getSHSAssignments();
  return assignments.find(
    assignment => assignment.strandCourse === strand && assignment.section === section
  );
};

// Get teachers assigned to a specific SHS section
export const getTeachersForSHSSection = (strand: string, section: string): Teacher[] => {
  const assignment = getSHSAssignmentForSection(strand, section);
  
  if (!assignment) return [];
  
  return assignment.teacherIds
    .map(id => getTeacherById(id))
    .filter((teacher): teacher is Teacher => teacher !== undefined);
};

// Get subjects for a specific SHS section
export const getSubjectsForSHSSection = (strand: string, section: string): string[] => {
  const assignment = getSHSAssignmentForSection(strand, section);
  return assignment ? assignment.subjects : [];
};

// Get teacher-subject pairs for SHS section
export const getTeacherSubjectPairsForSHSSection = (
  strand: string, 
  section: string
): Array<{teacher: Teacher, subject: string}> => {
  const assignment = getSHSAssignmentForSection(strand, section);
  
  if (!assignment) return [];
  
  return assignment.teacherIds.map((teacherId, index) => {
    const teacher = getTeacherById(teacherId);
    const subject = assignment.subjects[index];
    
    return {
      teacher: teacher || {id: 0, name: "Unknown Teacher", position: "", category: "College", subjects: []},
      subject: subject || "Unknown Subject"
    };
  });
};

// NEW: Get teachers with their assigned subjects for student's section
export const getTeachersWithSubjectsForStudent = (
  strandCourse: string, 
  section: string, 
  level: 'shs' | 'college'
): Array<{teacher: Teacher, subjects: string[]}> => {
  if (level === 'shs') {
    const pairs = getTeacherSubjectPairsForSHSSection(strandCourse, section);
    const teacherSubjectMap = new Map<number, Set<string>>();
    
    pairs.forEach(pair => {
      if (!teacherSubjectMap.has(pair.teacher.id)) {
        teacherSubjectMap.set(pair.teacher.id, new Set());
      }
      teacherSubjectMap.get(pair.teacher.id)!.add(pair.subject);
    });
    
    return Array.from(teacherSubjectMap.entries()).map(([teacherId, subjects]) => {
      const teacher = getTeacherById(teacherId);
      return {
        teacher: teacher || {id: 0, name: "Unknown Teacher", position: "", category: "SHS", subjects: []},
        subjects: Array.from(subjects)
      };
    });
  } else {
    // For college, get all unique teachers from all subjects in the section
    const assignments = getCollegeAssignmentsForSection(strandCourse, section);
    const teacherSubjectMap = new Map<number, Set<string>>();
    
    assignments.forEach(assignment => {
      if (!teacherSubjectMap.has(assignment.teacherId)) {
        teacherSubjectMap.set(assignment.teacherId, new Set());
      }
      teacherSubjectMap.get(assignment.teacherId)!.add(assignment.subject);
    });
    
    return Array.from(teacherSubjectMap.entries()).map(([teacherId, subjects]) => {
      const teacher = getTeacherById(teacherId);
      return {
        teacher: teacher || {id: 0, name: "Unknown Teacher", position: "", category: "College", subjects: []},
        subjects: Array.from(subjects)
      };
    });
  }
};

// OLD: Get unique teachers assigned to a student's section based on subjects
export const getTeachersForStudentSection = (
  strandCourse: string, 
  section: string, 
  level: 'shs' | 'college'
): Teacher[] => {
  if (level === 'shs') {
    return getTeachersForSHSSection(strandCourse, section);
  } else {
    // For college, get all unique teachers from all subjects in the section
    const assignments = getCollegeAssignmentsForSection(strandCourse, section);
    const uniqueTeacherIds = [...new Set(assignments.map(a => a.teacherId))];
    return uniqueTeacherIds
      .map(id => getTeacherById(id))
      .filter((teacher): teacher is Teacher => teacher !== undefined);
  }
};

// Get semester configuration
export const getSemesterConfig = (): {semester: string, evaluationDate: string} => {
  const config = localStorage.getItem('semesterConfig');
  return config 
    ? JSON.parse(config) 
    : {semester: "1st Semester", evaluationDate: new Date().toISOString().split('T')[0]};
};

// NEW: Evaluation tracking functions
export const getUserEvaluationStatus = (userId: string): UserEvaluationStatus => {
  const statusData = localStorage.getItem('userEvaluationStatus');
  const allStatuses = statusData ? JSON.parse(statusData) : {};
  
  return allStatuses[userId] || {
    userId,
    evaluatedTeachers: [],
    totalEvaluations: 0,
    maxEvaluations: getMaxEvaluationsPerStudent()
  };
};

export const updateUserEvaluationStatus = (userId: string, teacherId: number): boolean => {
  const statusData = localStorage.getItem('userEvaluationStatus');
  const allStatuses = statusData ? JSON.parse(statusData) : {};
  
  const currentStatus = allStatuses[userId] || {
    userId,
    evaluatedTeachers: [],
    totalEvaluations: 0,
    maxEvaluations: getMaxEvaluationsPerStudent()
  };
  
  // Check if teacher already evaluated
  if (currentStatus.evaluatedTeachers.includes(teacherId)) {
    return false; // Already evaluated this teacher
  }
  
  // Check if max evaluations reached
  if (currentStatus.totalEvaluations >= currentStatus.maxEvaluations) {
    return false; // Max evaluations reached
  }
  
  // Update status
  currentStatus.evaluatedTeachers.push(teacherId);
  currentStatus.totalEvaluations += 1;
  
  allStatuses[userId] = currentStatus;
  localStorage.setItem('userEvaluationStatus', JSON.stringify(allStatuses));
  
  return true;
};

export const canEvaluateTeacher = (userId: string, teacherId: number): boolean => {
  const status = getUserEvaluationStatus(userId);
  return !status.evaluatedTeachers.includes(teacherId) && 
         status.totalEvaluations < status.maxEvaluations;
};

export const setMaxEvaluationsPerStudent = (maxEvaluations: number): void => {
  localStorage.setItem('maxEvaluationsPerStudent', maxEvaluations.toString());
};

export const getMaxEvaluationsPerStudent = (): number => {
  const max = localStorage.getItem('maxEvaluationsPerStudent');
  return max ? parseInt(max) : 10;
};

// NEW: Get available subjects for a student
export const getSubjectsForStudent = (
  strandCourse: string, 
  section: string, 
  level: 'shs' | 'college'
): string[] => {
  // Get subjects from the admin-defined subject lists
  if (level === 'shs') {
    const strands = JSON.parse(localStorage.getItem('adminStrands') || '[]');
    const strand = strands.find((s: any) => s.name === strandCourse);
    return strand ? strand.subjects : [];
  } else {
    const courses = JSON.parse(localStorage.getItem('adminCourses') || '[]');
    const course = courses.find((c: any) => c.name === strandCourse);
    return course ? course.subjects : [];
  }
};

// NEW: Check if a student needs to evaluate all their subject teachers
export const getRemainingTeachersToEvaluate = (
  userId: string,
  strandCourse: string,
  section: string,
  level: 'shs' | 'college'
): Teacher[] => {
  const assignedTeachers = getTeachersForStudentSection(strandCourse, section, level);
  const evaluationStatus = getUserEvaluationStatus(userId);
  
  return assignedTeachers.filter(teacher => 
    !evaluationStatus.evaluatedTeachers.includes(teacher.id)
  );
};

// NEW: USN validation functions
export const isUSNAlreadyRegistered = (usn: string): boolean => {
  const registeredUSNs = JSON.parse(localStorage.getItem('registeredUSNs') || '[]');
  return registeredUSNs.includes(usn.toLowerCase());
};

export const registerUSN = (usn: string): void => {
  const registeredUSNs = JSON.parse(localStorage.getItem('registeredUSNs') || '[]');
  registeredUSNs.push(usn.toLowerCase());
  localStorage.setItem('registeredUSNs', JSON.stringify(registeredUSNs));
};
