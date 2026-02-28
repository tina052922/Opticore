// Core data structures for university timetabling

export interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  lecHours: number;
  labHours: number;
  totalHours: number;
  type: 'LECTURE' | 'LAB' | 'LECTURE_LAB';
  category: string;
  yearLevel: number;
  semester: number;
  prerequisites: string[];
  program: string;
  requiresLab: boolean;
  maxStudents: number;
}

export interface Faculty {
  id: string;
  name: string;
  rank: FacultyRank;
  maxLoad: number;
  currentLoad: number;
  qualifications: string[];
  preferredSubjects: string[];
  availableTimes: TimeSlot[];
  hourlyRate: number;
  experience: number;
  canTeachCourses: string[]; // Course IDs they can teach
}

export interface Room {
  id: string;
  code: string;
  building: string;
  capacity: number;
  type: 'LECTURE' | 'LAB' | 'COMPUTER' | 'SPECIALIZED';
  equipment: string[];
  availableTimes: TimeSlot[];
}

export interface Section {
  id: string;
  name: string;
  program: string;
  yearLevel: number;
  semester: number;
  studentCount: number;
  curriculum: string[];
}

export interface TimeSlot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface ScheduledClass {
  id: string;
  courseId: string;
  facultyId: string;
  roomId: string;
  sectionId: string;
  timeSlot: TimeSlot;
  semester: string;
  academicYear: string;
}

export interface Schedule {
  classes: ScheduledClass[];
  fitness: number;
  conflicts: Conflict[];
  metrics: ScheduleMetrics;
}

export interface Conflict {
  type: 'FACULTY' | 'ROOM' | 'STUDENT' | 'PREREQUISITE' | 'QUALIFICATION' | 'CAPACITY';
  severity: 'HARD' | 'SOFT';
  description: string;
  involvedIds: string[];
}

export interface ScheduleMetrics {
  totalConflicts: number;
  hardConflicts: number;
  softConflicts: number;
  facultyUtilization: number;
  roomUtilization: number;
  workloadBalance: number;
  prerequisiteSatisfaction: number;
  studentGaps: number;
}

export interface SchedulingConstraints {
  maxFacultyLoad: number;
  overloadThreshold: number;
  minGapBetweenClasses: number; // minutes
  maxDailyHours: number;
  preferredTimeRanges: TimeSlot[];
  labRequirements: {
    labSubjectsMustHaveLabRooms: boolean;
    labRoomTypes: string[];
  };
  facultyQualificationRules: {
    mustMatchQualification: boolean;
    allowTeachingAssistant: boolean;
  };
}

export enum FacultyRank {
  INSTRUCTOR_I = 'INSTRUCTOR_I',
  INSTRUCTOR_II = 'INSTRUCTOR_II',
  INSTRUCTOR_III = 'INSTRUCTOR_III',
  ASSISTANT_PROFESSOR_I = 'ASSISTANT_PROFESSOR_I',
  ASSISTANT_PROFESSOR_II = 'ASSISTANT_PROFESSOR_II',
  ASSISTANT_PROFESSOR_III = 'ASSISTANT_PROFESSOR_III',
  ASSISTANT_PROFESSOR_IV = 'ASSISTANT_PROFESSOR_IV',
  ASSOCIATE_PROFESSOR_I = 'ASSOCIATE_PROFESSOR_I',
  ASSOCIATE_PROFESSOR_II = 'ASSOCIATE_PROFESSOR_II',
  ASSOCIATE_PROFESSOR_III = 'ASSOCIATE_PROFESSOR_III',
  ASSOCIATE_PROFESSOR_IV = 'ASSOCIATE_PROFESSOR_IV',
  ASSOCIATE_PROFESSOR_V = 'ASSOCIATE_PROFESSOR_V',
  PROFESSOR_I = 'PROFESSOR_I',
  PROFESSOR_II = 'PROFESSOR_II',
  PROFESSOR_III = 'PROFESSOR_III',
  PROFESSOR_IV = 'PROFESSOR_IV',
  PROFESSOR_V = 'PROFESSOR_V',
  PROFESSOR_VI = 'PROFESSOR_VI',
  UNIVERSITY_PROFESSOR = 'UNIVERSITY_PROFESSOR'
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY'
}

export interface GeneticAlgorithmConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  elitismRate: number;
  tournamentSize: number;
}

export interface SchedulingResult {
  success: boolean;
  schedule?: Schedule;
  message?: string;
  executionTime: number;
  iterations: number;
}
