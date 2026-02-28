import { 
  Schedule, 
  ScheduledClass, 
  Conflict, 
  Course, 
  Faculty, 
  Room, 
  Section, 
  SchedulingConstraints,
  DayOfWeek 
} from "./types";

/**
 * Validates all scheduling constraints and detects conflicts
 */
export class ConstraintValidator {
  private courses: Map<string, Course>;
  private faculty: Map<string, Faculty>;
  private rooms: Map<string, Room>;
  private sections: Map<string, Section>;
  private constraints: SchedulingConstraints;

  constructor(
    courses: Course[],
    faculty: Faculty[],
    rooms: Room[],
    sections: Section[],
    constraints: SchedulingConstraints
  ) {
    this.courses = new Map(courses.map(c => [c.id, c]));
    this.faculty = new Map(faculty.map(f => [f.id, f]));
    this.rooms = new Map(rooms.map(r => [r.id, r]));
    this.sections = new Map(sections.map(s => [s.id, s]));
    this.constraints = constraints;
  }

  /**
   * Validate entire schedule and return all conflicts
   */
  validateSchedule(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Check hard constraints first
    conflicts.push(...this.checkFacultyConflicts(schedule));
    conflicts.push(...this.checkRoomConflicts(schedule));
    conflicts.push(...this.checkStudentConflicts(schedule));
    conflicts.push(...this.checkPrerequisiteConflicts(schedule));
    conflicts.push(...this.checkQualificationConflicts(schedule));
    conflicts.push(...this.checkCapacityConflicts(schedule));
    conflicts.push(...this.checkLabRequirements(schedule));
    
    // Check soft constraints
    conflicts.push(...this.checkWorkloadBalance(schedule));
    conflicts.push(...this.checkFacultyAvailability(schedule));
    conflicts.push(...this.checkRoomAvailability(schedule));
    
    return conflicts;
  }

  /**
   * Check for faculty double-booking
   */
  private checkFacultyConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const facultySchedule = new Map<string, ScheduledClass[]>();

    // Group classes by faculty
    schedule.classes.forEach(cls => {
      if (!facultySchedule.has(cls.facultyId)) {
        facultySchedule.set(cls.facultyId, []);
      }
      facultySchedule.get(cls.facultyId)!.push(cls);
    });

    // Check for time overlaps
    facultySchedule.forEach((classes, facultyId) => {
      for (let i = 0; i < classes.length; i++) {
        for (let j = i + 1; j < classes.length; j++) {
          if (this.timeSlotsOverlap(classes[i].timeSlot, classes[j].timeSlot)) {
            const faculty = this.faculty.get(facultyId)!;
            conflicts.push({
              type: 'FACULTY',
              severity: 'HARD',
              description: `${faculty.name} scheduled for two classes at the same time`,
              involvedIds: [classes[i].id, classes[j].id, facultyId]
            });
          }
        }
      }
    });

    return conflicts;
  }

  /**
   * Check for room double-booking
   */
  private checkRoomConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const roomSchedule = new Map<string, ScheduledClass[]>();

    // Group classes by room
    schedule.classes.forEach(cls => {
      if (!roomSchedule.has(cls.roomId)) {
        roomSchedule.set(cls.roomId, []);
      }
      roomSchedule.get(cls.roomId)!.push(cls);
    });

    // Check for time overlaps
    roomSchedule.forEach((classes, roomId) => {
      for (let i = 0; i < classes.length; i++) {
        for (let j = i + 1; j < classes.length; j++) {
          if (this.timeSlotsOverlap(classes[i].timeSlot, classes[j].timeSlot)) {
            const room = this.rooms.get(roomId)!;
            conflicts.push({
              type: 'ROOM',
              severity: 'HARD',
              description: `Room ${room.code} double-booked for two classes`,
              involvedIds: [classes[i].id, classes[j].id, roomId]
            });
          }
        }
      }
    });

    return conflicts;
  }

  /**
   * Check for student conflicts (same program/year level)
   */
  private checkStudentConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const sectionSchedule = new Map<string, ScheduledClass[]>();

    // Group classes by section
    schedule.classes.forEach(cls => {
      if (!sectionSchedule.has(cls.sectionId)) {
        sectionSchedule.set(cls.sectionId, []);
      }
      sectionSchedule.get(cls.sectionId)!.push(cls);
    });

    // Check for time overlaps within same program/year level
    const programYearSchedule = new Map<string, ScheduledClass[]>();
    schedule.classes.forEach(cls => {
      const section = this.sections.get(cls.sectionId)!;
      const key = `${section.program}-${section.yearLevel}`;
      
      if (!programYearSchedule.has(key)) {
        programYearSchedule.set(key, []);
      }
      programYearSchedule.get(key)!.push(cls);
    });

    programYearSchedule.forEach((classes, programYear) => {
      for (let i = 0; i < classes.length; i++) {
        for (let j = i + 1; j < classes.length; j++) {
          if (classes[i].sectionId !== classes[j].sectionId && 
              this.timeSlotsOverlap(classes[i].timeSlot, classes[j].timeSlot)) {
            conflicts.push({
              type: 'STUDENT',
              severity: 'HARD',
              description: `Students in ${programYear} have overlapping classes`,
              involvedIds: [classes[i].id, classes[j].id]
            });
          }
        }
      }
    });

    return conflicts;
  }

  /**
   * Check prerequisite satisfaction
   */
  private checkPrerequisiteConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const sectionCourses = new Map<string, Course[]>();

    // Group courses by section
    schedule.classes.forEach(cls => {
      const course = this.courses.get(cls.courseId)!;
      if (!sectionCourses.has(cls.sectionId)) {
        sectionCourses.set(cls.sectionId, []);
      }
      sectionCourses.get(cls.sectionId)!.push(course);
    });

    // Check prerequisites
    sectionCourses.forEach((courses, sectionId) => {
      courses.forEach(course => {
        course.prerequisites.forEach(prereq => {
          const prereqCourse = courses.find(c => c.code === prereq);
          if (!prereqCourse) {
            conflicts.push({
              type: 'PREREQUISITE',
              severity: 'HARD',
              description: `Course ${course.code} requires prerequisite ${prereq} which is not scheduled`,
              involvedIds: [course.id, sectionId]
            });
          }
        });
      });
    });

    return conflicts;
  }

  /**
   * Check faculty qualification requirements
   */
  private checkQualificationConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];

    schedule.classes.forEach(cls => {
      const faculty = this.faculty.get(cls.facultyId)!;
      const course = this.courses.get(cls.courseId)!;

      if (!faculty.canTeachCourses.includes(course.id)) {
        conflicts.push({
          type: 'QUALIFICATION',
          severity: 'HARD',
          description: `${faculty.name} not qualified to teach ${course.code}`,
          involvedIds: [cls.id, cls.facultyId, course.id]
        });
      }
    });

    return conflicts;
  }

  /**
   * Check room capacity constraints
   */
  private checkCapacityConflicts(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];

    schedule.classes.forEach(cls => {
      const room = this.rooms.get(cls.roomId)!;
      const section = this.sections.get(cls.sectionId)!;
      const course = this.courses.get(cls.courseId)!;

      if (section.studentCount > room.capacity) {
        conflicts.push({
          type: 'CAPACITY',
          severity: 'HARD',
          description: `Room ${room.code} capacity (${room.capacity}) insufficient for ${section.name} (${section.studentCount} students)`,
          involvedIds: [cls.id, cls.roomId, cls.sectionId]
        });
      }
    });

    return conflicts;
  }

  /**
   * Check lab requirements
   */
  private checkLabRequirements(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];

    schedule.classes.forEach(cls => {
      const course = this.courses.get(cls.courseId)!;
      const room = this.rooms.get(cls.roomId)!;

      if (course.requiresLab && room.type !== 'LAB') {
        conflicts.push({
          type: 'QUALIFICATION', // Using existing type, could add new type
          severity: 'HARD',
          description: `Lab course ${course.code} scheduled in non-lab room ${room.code}`,
          involvedIds: [cls.id, cls.roomId, course.id]
        });
      }
    });

    return conflicts;
  }

  /**
   * Check faculty workload balance (soft constraint)
   */
  private checkWorkloadBalance(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];
    const facultyLoads = new Map<string, number>();

    // Calculate loads
    schedule.classes.forEach(cls => {
      const course = this.courses.get(cls.courseId)!;
      const currentLoad = facultyLoads.get(cls.facultyId) || 0;
      facultyLoads.set(cls.facultyId, currentLoad + course.units);
    });

    // Check for overloads
    facultyLoads.forEach((load, facultyId) => {
      const faculty = this.faculty.get(facultyId)!;
      if (load > faculty.maxLoad) {
        conflicts.push({
          type: 'FACULTY',
          severity: 'SOFT',
          description: `${faculty.name} has teaching load of ${load} units (max: ${faculty.maxLoad})`,
          involvedIds: [facultyId]
        });
      }
    });

    return conflicts;
  }

  /**
   * Check faculty availability during scheduled times
   */
  private checkFacultyAvailability(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];

    schedule.classes.forEach(cls => {
      const faculty = this.faculty.get(cls.facultyId)!;
      
      // Check if class time is within faculty available times
      const isAvailable = faculty.availableTimes.some(available => 
        available.day === cls.timeSlot.day &&
        this.timeSlotWithinRange(cls.timeSlot, available.startTime, available.endTime)
      );

      if (!isAvailable) {
        conflicts.push({
          type: 'FACULTY',
          severity: 'SOFT',
          description: `${faculty.name} scheduled outside available time`,
          involvedIds: [cls.id, cls.facultyId]
        });
      }
    });

    return conflicts;
  }

  /**
   * Check room availability during scheduled times
   */
  private checkRoomAvailability(schedule: Schedule): Conflict[] {
    const conflicts: Conflict[] = [];

    schedule.classes.forEach(cls => {
      const room = this.rooms.get(cls.roomId)!;
      
      // Check if class time is within room available times
      const isAvailable = room.availableTimes.some(available => 
        available.day === cls.timeSlot.day &&
        this.timeSlotWithinRange(cls.timeSlot, available.startTime, available.endTime)
      );

      if (!isAvailable) {
        conflicts.push({
          type: 'ROOM',
          severity: 'SOFT',
          description: `Room ${room.code} scheduled outside available time`,
          involvedIds: [cls.id, cls.roomId]
        });
      }
    });

    return conflicts;
  }

  /**
   * Check if two time slots overlap
   */
  private timeSlotsOverlap(slot1: any, slot2: any): boolean {
    if (slot1.day !== slot2.day) return false;
    
    const start1 = this.timeToMinutes(slot1.startTime);
    const end1 = this.timeToMinutes(slot1.endTime);
    const start2 = this.timeToMinutes(slot2.startTime);
    const end2 = this.timeToMinutes(slot2.endTime);

    return (start1 < end2) && (start2 < end1);
  }

  /**
   * Check if a time slot is within a range
   */
  private timeSlotWithinRange(slot: any, rangeStart: string, rangeEnd: string): boolean {
    const slotStart = this.timeToMinutes(slot.startTime);
    const slotEnd = this.timeToMinutes(slot.endTime);
    const rangeStartMin = this.timeToMinutes(rangeStart);
    const rangeEndMin = this.timeToMinutes(rangeEnd);

    return slotStart >= rangeStartMin && slotEnd <= rangeEndMin;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
