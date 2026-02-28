import { prisma } from "@/lib/prisma";
import { Course, Faculty, Room, Section, FacultyRank, DayOfWeek } from "./types";

/**
 * Load real CTU data from database for scheduling
 */
export class SchedulingDataLoader {
  /**
   * Load all courses with their details
   */
  static async loadCourses(): Promise<Course[]> {
    const subjects = await prisma.subject.findMany({
      orderBy: [
        { code: 'asc' }
      ]
    });

    return subjects.map(subject => ({
      id: subject.id,
      code: subject.code,
      title: subject.title,
      units: subject.units,
      lecHours: subject.lecHours,
      labHours: subject.labHours,
      totalHours: subject.lecHours + subject.labHours,
      type: subject.labHours > 0 ? 'LECTURE_LAB' : 'LECTURE',
      category: (subject as any).category || 'DEPARTMENTAL',
      yearLevel: (subject as any).yearLevel || 1,
      semester: (subject as any).semester || 1,
      prerequisites: subject.prerequisite ? [subject.prerequisite] : [],
      program: this.extractProgramFromCode(subject.code),
      requiresLab: subject.labHours > 0,
      maxStudents: this.getDefaultClassSize(subject.code)
    }));
  }

  /**
   * Load faculty with their qualifications and constraints
   */
  static async loadFaculty(): Promise<Faculty[]> {
    const users = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR'
      },
      include: {
        facultyProfile: true
      }
    });

    return users.map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      rank: (user.facultyProfile?.rank as FacultyRank) || FacultyRank.INSTRUCTOR_I,
      maxLoad: user.facultyProfile?.standardLoad || 24,
      currentLoad: 0, // Will be calculated based on current assignments
      qualifications: this.extractQualifications(user),
      preferredSubjects: [], // Could be added to faculty profile
      availableTimes: this.generateDefaultAvailability(),
      hourlyRate: user.facultyProfile?.hourlyRate || 200,
      experience: user.facultyProfile?.experience || 0,
      canTeachCourses: [] // Will be populated based on qualifications
    }));
  }

  /**
   * Load available rooms
   */
  static async loadRooms(): Promise<Room[]> {
    const rooms = await prisma.room.findMany({
      orderBy: [
        { building: 'asc' },
        { code: 'asc' }
      ]
    });

    return rooms.map(room => ({
      id: room.id,
      code: room.code,
      building: room.building,
      capacity: room.capacity,
      type: room.type as 'LECTURE' | 'LAB' | 'COMPUTER' | 'SPECIALIZED',
      equipment: this.getRoomEquipment(room.type, room.code),
      availableTimes: this.generateDefaultAvailability()
    }));
  }

  /**
   * Load sections (student groups)
   */
  static async loadSections(): Promise<Section[]> {
    const sections = await prisma.section.findMany({
      include: {
        program: true
      },
      orderBy: [
        { yearLevel: 'asc' },
        { name: 'asc' }
      ]
    });

    return sections.map(section => ({
      id: section.id,
      name: section.name,
      program: section.program.code,
      yearLevel: section.yearLevel,
      semester: 1, // Default to first semester
      studentCount: section.studentCount,
      curriculum: [] // Would be populated from program curriculum
    }));
  }

  /**
   * Extract program from course code
   */
  private static extractProgramFromCode(code: string): string {
    if (code.startsWith('BIT')) return 'BIT';
    if (code.startsWith('BSIT')) return 'BSIT';
    if (code.startsWith('BSIE')) return 'BSIE';
    if (code.startsWith('GEC')) return 'GEC';
    return 'GENERAL';
  }

  /**
   * Get default class size based on course type
   */
  private static getDefaultClassSize(code: string): number {
    if (code.includes('LAB')) return 30;
    if (code.startsWith('GEC')) return 40;
    if (code.includes('ELEC') || code.includes('AUTOMOTIVE') || code.includes('GARMENTS')) return 25;
    return 35;
  }

  /**
   * Extract qualifications from faculty profile
   */
  private static extractQualifications(user: any): string[] {
    const qualifications = [];
    
    if (user.facultyProfile?.bsDegree) {
      qualifications.push(user.facultyProfile.bsDegree);
    }
    if (user.facultyProfile?.msDegree) {
      qualifications.push(user.facultyProfile.msDegree);
    }
    if (user.facultyProfile?.phdDegree) {
      qualifications.push(user.facultyProfile.phdDegree);
    }
    if (user.facultyProfile?.eligibility) {
      qualifications.push(user.facultyProfile.eligibility);
    }
    
    return qualifications;
  }

  /**
   * Get room equipment based on type and code
   */
  private static getRoomEquipment(type: string, code: string): string[] {
    const equipment = [];
    
    if (type === 'LAB') {
      equipment.push('Lab Equipment');
      if (code.includes('COMPUTER') || code.includes('IT')) {
        equipment.push('Computers', 'Internet');
      }
      if (code.includes('ELECTRONICS')) {
        equipment.push('Oscilloscope', 'Multimeter', 'Power Supplies');
      }
      if (code.includes('AUTOMOTIVE')) {
        equipment.push('Vehicle Lift', 'Tools', 'Engine Diagnostic');
      }
      if (code.includes('GARMENTS')) {
        equipment.push('Sewing Machines', 'Pattern Tables', 'Irons');
      }
    }
    
    if (type === 'LECTURE') {
      equipment.push('Projector', 'Whiteboard', 'Sound System');
    }
    
    return equipment;
  }

  /**
   * Generate default availability (Monday-Friday, 7AM-9PM)
   */
  private static generateDefaultAvailability(): any[] {
    const days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
    const timeSlots = [];
    
    for (const day of days) {
      timeSlots.push({
        day,
        startTime: '07:00',
        endTime: '21:00'
      });
    }
    
    return timeSlots;
  }

  /**
   * Match faculty to courses based on qualifications
   */
  static matchFacultyToCourses(faculty: Faculty[], courses: Course[]): void {
    faculty.forEach(fac => {
      fac.canTeachCourses = [];
      
      courses.forEach(course => {
        if (this.canFacultyTeachCourse(fac, course)) {
          fac.canTeachCourses.push(course.id);
        }
      });
    });
  }

  /**
   * Check if faculty can teach a specific course
   */
  private static canFacultyTeachCourse(faculty: Faculty, course: Course): boolean {
    // Basic qualification matching
    const hasRelevantDegree = faculty.qualifications.some(qual => 
      qual.toLowerCase().includes('information') && course.program === 'BSIT' ||
      qual.toLowerCase().includes('engineering') && course.program === 'BSIE' ||
      qual.toLowerCase().includes('technology') && course.program === 'BIT' ||
      qual.toLowerCase().includes('education') && course.category === 'GEC'
    );

    // Rank-based eligibility
    const canTeachByRank = faculty.rank !== FacultyRank.INSTRUCTOR_I || course.yearLevel <= 2;

    // Experience-based eligibility
    const hasEnoughExperience = faculty.experience >= 1 || course.yearLevel <= 1;

    return hasRelevantDegree && canTeachByRank && hasEnoughExperience;
  }
}
