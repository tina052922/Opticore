import { 
  Course, 
  Faculty, 
  Room, 
  Section, 
  Schedule, 
  SchedulingResult, 
  GeneticAlgorithmConfig,
  SchedulingConstraints 
} from "./types";
import { SchedulingDataLoader } from "./data-loader";
import { GeneticAlgorithmScheduler } from "./algorithms/genetic-algorithm";

/**
 * Main scheduling engine that coordinates all components
 */
export class OptiCoreScheduler {
  private courses: Course[] = [];
  private faculty: Faculty[] = [];
  private rooms: Room[] = [];
  private sections: Section[] = [];
  private constraints: SchedulingConstraints;
  private gaConfig: GeneticAlgorithmConfig;

  constructor() {
    // Initialize CTU-specific constraints
    this.constraints = {
      maxFacultyLoad: 24, // CTU standard load
      overloadThreshold: 30,
      minGapBetweenClasses: 30, // 30 minutes between classes
      maxDailyHours: 8,
      preferredTimeRanges: [],
      labRequirements: {
        labSubjectsMustHaveLabRooms: true,
        labRoomTypes: ['LAB', 'COMPUTER']
      },
      facultyQualificationRules: {
        mustMatchQualification: true,
        allowTeachingAssistant: false
      }
    };

    // Genetic Algorithm configuration optimized for university scheduling
    this.gaConfig = {
      populationSize: 50,
      generations: 100,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitismRate: 0.2,
      tournamentSize: 5
    };
  }

  /**
   * Initialize scheduler with real CTU data
   */
  async initialize(): Promise<void> {
    try {
      console.log("Loading CTU scheduling data...");
      
      // Load all data from database
      this.courses = await SchedulingDataLoader.loadCourses();
      this.faculty = await SchedulingDataLoader.loadFaculty();
      this.rooms = await SchedulingDataLoader.loadRooms();
      this.sections = await SchedulingDataLoader.loadSections();

      // Match faculty to courses based on qualifications
      SchedulingDataLoader.matchFacultyToCourses(this.faculty, this.courses);

      console.log(`Loaded ${this.courses.length} courses, ${this.faculty.length} faculty, ${this.rooms.length} rooms, ${this.sections.length} sections`);
      
      // Validate data integrity
      this.validateData();
      
    } catch (error) {
      throw new Error(`Failed to initialize scheduler: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate optimal schedule using hybrid Genetic Algorithm
   */
  async generateSchedule(program?: string, semester?: string): Promise<SchedulingResult> {
    try {
      console.log(`Starting schedule generation for ${program || 'all programs'}...`);
      
      // Filter data if specific program requested
      const filteredData = this.filterDataByProgram(program);
      
      // Create scheduler instance
      const scheduler = new GeneticAlgorithmScheduler(
        filteredData.courses,
        filteredData.faculty,
        filteredData.rooms,
        filteredData.sections,
        this.gaConfig
      );

      // Generate schedule
      const result = await scheduler.generateSchedule();
      
      if (result.success && result.schedule) {
        console.log(`Schedule generated successfully!`);
        console.log(`Fitness: ${result.schedule.fitness.toFixed(2)}`);
        console.log(`Conflicts: ${result.schedule.metrics.totalConflicts} (Hard: ${result.schedule.metrics.hardConflicts}, Soft: ${result.schedule.metrics.softConflicts})`);
        console.log(`Faculty utilization: ${result.schedule.metrics.facultyUtilization.toFixed(1)}%`);
        console.log(`Room utilization: ${result.schedule.metrics.roomUtilization.toFixed(1)}%`);
        
        // Post-process and optimize
        result.schedule = this.postProcessSchedule(result.schedule);
      }

      return result;
      
    } catch (error) {
      return {
        success: false,
        message: `Schedule generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: 0,
        iterations: 0
      };
    }
  }

  /**
   * Generate multiple schedule options for comparison
   */
  async generateMultipleOptions(program?: string, count: number = 3): Promise<SchedulingResult[]> {
    const results: SchedulingResult[] = [];
    
    for (let i = 0; i < count; i++) {
      console.log(`Generating schedule option ${i + 1}...`);
      const result = await this.generateSchedule(program);
      results.push(result);
    }

    // Sort by fitness (best first)
    results.sort((a, b) => (b.schedule?.fitness || 0) - (a.schedule?.fitness || 0));
    
    return results;
  }

  /**
   * Validate loaded data integrity
   */
  private validateData(): void {
    const errors: string[] = [];

    // Check for required data
    if (this.courses.length === 0) errors.push("No courses loaded");
    if (this.faculty.length === 0) errors.push("No faculty loaded");
    if (this.rooms.length === 0) errors.push("No rooms loaded");
    if (this.sections.length === 0) errors.push("No sections loaded");

    // Check faculty-course assignments
    const unassignedCourses = this.courses.filter(course => 
      !this.faculty.some(faculty => faculty.canTeachCourses.includes(course.id))
    );
    
    if (unassignedCourses.length > 0) {
      errors.push(`${unassignedCourses.length} courses have no qualified faculty`);
    }

    // Check room capacity
    const oversizedSections = this.sections.filter(section => 
      !this.rooms.some(room => room.capacity >= section.studentCount)
    );
    
    if (oversizedSections.length > 0) {
      errors.push(`${oversizedSections.length} sections exceed room capacity`);
    }

    if (errors.length > 0) {
      throw new Error(`Data validation failed:\n${errors.join('\n')}`);
    }

    console.log("Data validation passed");
  }

  /**
   * Filter data by specific program
   */
  private filterDataByProgram(program?: string) {
    if (!program) {
      return {
        courses: this.courses,
        faculty: this.faculty,
        rooms: this.rooms,
        sections: this.sections
      };
    }

    return {
      courses: this.courses.filter(c => c.program === program),
      faculty: this.faculty.filter(f => 
        f.canTeachCourses.some(courseId => 
          this.courses.find(c => c.id === courseId && c.program === program)
        )
      ),
      rooms: this.rooms, // Keep all rooms for flexibility
      sections: this.sections.filter(s => s.program === program)
    };
  }

  /**
   * Post-process schedule for additional optimizations
   */
  private postProcessSchedule(schedule: Schedule): Schedule {
    // Sort classes by day and time for better readability
    schedule.classes.sort((a, b) => {
      const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const dayComparison = dayOrder.indexOf(a.timeSlot.day) - dayOrder.indexOf(b.timeSlot.day);
      
      if (dayComparison !== 0) return dayComparison;
      
      return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
    });

    // Add metadata
    schedule.classes.forEach(cls => {
      const course = this.courses.find(c => c.id === cls.courseId);
      const faculty = this.faculty.find(f => f.id === cls.facultyId);
      const room = this.rooms.find(r => r.id === cls.roomId);
      const section = this.sections.find(s => s.id === cls.sectionId);

      // Add human-readable descriptions
      (cls as any).courseTitle = course?.title || 'Unknown Course';
      (cls as any).facultyName = faculty?.name || 'Unknown Faculty';
      (cls as any).roomCode = room?.code || 'Unknown Room';
      (cls as any).sectionName = section?.name || 'Unknown Section';
      (cls as any).program = section?.program || 'Unknown Program';
    });

    return schedule;
  }

  /**
   * Export schedule to database format
   */
  async exportScheduleToDatabase(schedule: Schedule): Promise<boolean> {
    try {
      // This would integrate with your existing database schema
      // For now, return the schedule data in a format that can be easily imported
      
      const exportData = {
        schedules: schedule.classes.map(cls => ({
          subjectId: cls.courseId,
          instructorId: cls.facultyId,
          roomId: cls.roomId,
          sectionId: cls.sectionId,
          day: cls.timeSlot.day,
          startTime: cls.timeSlot.startTime,
          endTime: cls.timeSlot.endTime,
          semester: cls.semester,
          academicYear: cls.academicYear,
          status: "APPROVED"
        })),
        metrics: schedule.metrics,
        conflicts: schedule.conflicts,
        fitness: schedule.fitness
      };

      console.log("Schedule exported successfully");
      console.log(`Total classes: ${exportData.schedules.length}`);
      console.log(`Conflicts: ${exportData.conflicts.length}`);
      
      // In a real implementation, you would save this to your database
      // await prisma.schedule.createMany({ data: exportData.schedules });
      
      return true;
      
    } catch (error) {
      console.error("Failed to export schedule:", error);
      return false;
    }
  }

  /**
   * Get scheduling statistics
   */
  getStatistics() {
    return {
      courses: {
        total: this.courses.length,
        byProgram: this.groupBy(this.courses, 'program'),
        byType: this.groupBy(this.courses, 'type'),
        labCourses: this.courses.filter(c => c.requiresLab).length
      },
      faculty: {
        total: this.faculty.length,
        byRank: this.groupBy(this.faculty, 'rank'),
        averageLoad: this.faculty.reduce((sum, f) => sum + f.maxLoad, 0) / this.faculty.length,
        qualifiedPerCourse: this.courses.map(c => 
          this.faculty.filter(f => f.canTeachCourses.includes(c.id)).length
        )
      },
      rooms: {
        total: this.rooms.length,
        byType: this.groupBy(this.rooms, 'type'),
        byBuilding: this.groupBy(this.rooms, 'building'),
        averageCapacity: this.rooms.reduce((sum, r) => sum + r.capacity, 0) / this.rooms.length
      },
      sections: {
        total: this.sections.length,
        byProgram: this.groupBy(this.sections, 'program'),
        byYearLevel: this.groupBy(this.sections, 'yearLevel'),
        totalStudents: this.sections.reduce((sum, s) => sum + s.studentCount, 0)
      }
    };
  }

  /**
   * Helper method to group items by property
   */
  private groupBy<T>(items: T[], property: keyof T): Record<string, number> {
    return items.reduce((groups, item) => {
      const key = String(item[property]);
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }
}
