import { 
  Schedule, 
  ScheduledClass, 
  Course, 
  Faculty, 
  Room, 
  Section, 
  GeneticAlgorithmConfig,
  DayOfWeek,
  SchedulingResult 
} from "../types";
import { ConstraintValidator } from "../constraint-validator";
import { FitnessCalculator } from "../fitness-calculator";

/**
 * Genetic Algorithm for University Timetabling
 * Hybrid approach with Greedy initialization and Hill Climbing refinement
 */
export class GeneticAlgorithmScheduler {
  private courses: Course[];
  private faculty: Faculty[];
  private rooms: Room[];
  private sections: Section[];
  private validator: ConstraintValidator;
  private fitnessCalculator: FitnessCalculator;
  private config: GeneticAlgorithmConfig;

  constructor(
    courses: Course[],
    faculty: Faculty[],
    rooms: Room[],
    sections: Section[],
    config: GeneticAlgorithmConfig
  ) {
    this.courses = courses;
    this.faculty = faculty;
    this.rooms = rooms;
    this.sections = sections;
    this.config = config;

    // Initialize validator and calculator
    const constraints = {
      maxFacultyLoad: 24,
      overloadThreshold: 30,
      minGapBetweenClasses: 30,
      maxDailyHours: 8,
      preferredTimeRanges: [],
      labRequirements: {
        labSubjectsMustHaveLabRooms: true,
        labRoomTypes: ['LAB']
      },
      facultyQualificationRules: {
        mustMatchQualification: true,
        allowTeachingAssistant: false
      }
    };

    this.validator = new ConstraintValidator(courses, faculty, rooms, sections, constraints);
    this.fitnessCalculator = new FitnessCalculator(constraints);
  }

  /**
   * Main scheduling method
   */
  async generateSchedule(): Promise<SchedulingResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Generate initial population with greedy algorithm
      let population = this.initializePopulation();
      
      // Step 2: Evaluate initial population
      population = this.evaluatePopulation(population);
      
      let bestSchedule = this.getBestSchedule(population);
      let generation = 0;

      // Step 3: Evolve population
      for (generation = 0; generation < this.config.generations; generation++) {
        // Selection
        const selectedPopulation = this.selection(population);
        
        // Crossover and Mutation
        const offspringPopulation = this.crossoverAndMutation(selectedPopulation);
        
        // Evaluate offspring
        const evaluatedOffspring = this.evaluatePopulation(offspringPopulation);
        
        // elitism: keep best individuals
        population = this.elitism(population, evaluatedOffspring);
        
        // Update best schedule
        const currentBest = this.getBestSchedule(population);
        if (currentBest.fitness > bestSchedule.fitness) {
          bestSchedule = currentBest;
        }

        // Early stopping if perfect solution found
        if (bestSchedule.fitness >= 1500 && bestSchedule.metrics.hardConflicts === 0) {
          break;
        }

        // Progress logging
        if (generation % 10 === 0) {
          console.log(`Generation ${generation}: Best fitness = ${bestSchedule.fitness.toFixed(2)}, Conflicts = ${bestSchedule.metrics.totalConflicts}`);
        }
      }

      // Step 4: Local optimization with Hill Climbing
      bestSchedule = this.hillClimbingOptimization(bestSchedule);

      const executionTime = Date.now() - startTime;

      return {
        success: bestSchedule.metrics.hardConflicts === 0,
        schedule: bestSchedule,
        message: `Generated schedule with fitness ${bestSchedule.fitness.toFixed(2)} in ${generation} generations`,
        executionTime,
        iterations: generation
      };

    } catch (error) {
      return {
        success: false,
        message: `Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        iterations: 0
      };
    }
  }

  /**
   * Initialize population using greedy algorithm for better starting points
   */
  private initializePopulation(): Schedule[] {
    const population: Schedule[] = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      const schedule = this.greedyScheduleGeneration();
      population.push(schedule);
    }

    return population;
  }

  /**
   * Greedy schedule generation for initial population
   */
  private greedyScheduleGeneration(): Schedule {
    const classes: ScheduledClass[] = [];
    const usedCombinations = new Set<string>();

    // Sort courses by priority (year level, units, prerequisites)
    const sortedCourses = [...this.courses].sort((a, b) => {
      if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
      if (a.units !== b.units) return b.units - a.units;
      return a.prerequisites.length - b.prerequisites.length;
    });

    // Assign each course
    for (const course of sortedCourses) {
      for (const section of this.sections.filter(s => s.program === course.program)) {
        if (this.sectionNeedsCourse(section, course)) {
          const scheduledClass = this.assignCourseGreedy(course, section, usedCombinations);
          if (scheduledClass) {
            classes.push(scheduledClass);
          }
        }
      }
    }

    const schedule: Schedule = {
      classes,
      fitness: 0,
      conflicts: [],
      metrics: {
        totalConflicts: 0,
        hardConflicts: 0,
        softConflicts: 0,
        facultyUtilization: 0,
        roomUtilization: 0,
        workloadBalance: 0,
        prerequisiteSatisfaction: 0,
        studentGaps: 0
      }
    };

    return schedule;
  }

  /**
   * Check if section needs this course
   */
  private sectionNeedsCourse(section: Section, course: Course): boolean {
    // Simplified: assume each section needs each course from their program
    return section.program === course.program && 
           section.yearLevel === course.yearLevel;
  }

  /**
   * Greedy assignment of course to faculty, room, and time
   */
  private assignCourseGreedy(
    course: Course, 
    section: Section, 
    usedCombinations: Set<string>
  ): ScheduledClass | null {
    // Find suitable faculty
    const suitableFaculty = this.faculty.filter(f => 
      f.canTeachCourses.includes(course.id) && 
      f.currentLoad < f.maxLoad
    );

    if (suitableFaculty.length === 0) return null;

    // Find suitable rooms
    const suitableRooms = this.rooms.filter(r => 
      r.capacity >= section.studentCount &&
      (!course.requiresLab || r.type === 'LAB')
    );

    if (suitableRooms.length === 0) return null;

    // Try to find a valid combination
    const timeSlots = this.generateTimeSlots(course.totalHours);

    for (const faculty of suitableFaculty.sort(() => Math.random() - 0.5)) {
      for (const room of suitableRooms.sort(() => Math.random() - 0.5)) {
        for (const timeSlot of timeSlots) {
          const combination = `${faculty.id}-${room.id}-${timeSlot.day}-${timeSlot.startTime}`;
          
          if (!usedCombinations.has(combination)) {
            usedCombinations.add(combination);

            // Update faculty load
            faculty.currentLoad += course.units;

            return {
              id: `${course.id}-${section.id}-${Date.now()}`,
              courseId: course.id,
              facultyId: faculty.id,
              roomId: room.id,
              sectionId: section.id,
              timeSlot,
              semester: "1st",
              academicYear: "2025-2026"
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Generate time slots for a course
   */
  private generateTimeSlots(totalHours: number): any[] {
    const slots = [];
    const days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
    
    // Common time slots
    const commonSlots = [
      { startTime: '07:00', endTime: '08:00' },
      { startTime: '08:00', endTime: '09:00' },
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '14:00' },
      { startTime: '14:00', endTime: '15:00' },
      { startTime: '15:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '17:00' },
      { startTime: '17:00', endTime: '18:00' }
    ];

    for (const day of days) {
      for (const slot of commonSlots) {
        slots.push({ day, ...slot });
      }
    }

    return slots;
  }

  /**
   * Evaluate population fitness
   */
  private evaluatePopulation(population: Schedule[]): Schedule[] {
    return population.map(schedule => {
      schedule.conflicts = this.validator.validateSchedule(schedule);
      schedule.fitness = this.fitnessCalculator.calculateFitness(schedule);
      return schedule;
    });
  }

  /**
   * Tournament selection
   */
  private selection(population: Schedule[]): Schedule[] {
    const selected: Schedule[] = [];
    
    while (selected.length < population.length) {
      const tournament = this.selectTournamentIndividuals(population);
      const winner = tournament.reduce((best, current) => 
        current.fitness > best.fitness ? current : best
      );
      selected.push(winner);
    }

    return selected;
  }

  /**
   * Select individuals for tournament
   */
  private selectTournamentIndividuals(population: Schedule[]): Schedule[] {
    const tournament: Schedule[] = [];
    
    for (let i = 0; i < this.config.tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }

    return tournament;
  }

  /**
   * Crossover and mutation
   */
  private crossoverAndMutation(population: Schedule[]): Schedule[] {
    const offspring: Schedule[] = [];

    for (let i = 0; i < population.length; i += 2) {
      const parent1 = population[i];
      const parent2 = population[i + 1] || population[0]; // Handle odd population size

      // Crossover
      if (Math.random() < this.config.crossoverRate) {
        const [child1, child2] = this.crossover(parent1, parent2);
        offspring.push(child1, child2);
      } else {
        offspring.push(this.cloneSchedule(parent1), this.cloneSchedule(parent2));
      }
    }

    // Mutation
    return offspring.map(schedule => 
      Math.random() < this.config.mutationRate ? this.mutate(schedule) : schedule
    );
  }

  /**
   * Two-point crossover
   */
  private crossover(parent1: Schedule, parent2: Schedule): [Schedule, Schedule] {
    const child1 = this.cloneSchedule(parent1);
    const child2 = this.cloneSchedule(parent2);

    if (parent1.classes.length < 2 || parent2.classes.length < 2) {
      return [child1, child2];
    }

    // Select crossover points
    const point1 = Math.floor(Math.random() * Math.min(parent1.classes.length, parent2.classes.length));
    const point2 = Math.floor(Math.random() * Math.min(parent1.classes.length, parent2.classes.length));
    const start = Math.min(point1, point2);
    const end = Math.max(point1, point2);

    // Exchange segments
    const segment1 = parent1.classes.slice(start, end);
    const segment2 = parent2.classes.slice(start, end);

    child1.classes.splice(start, end - start, ...segment2);
    child2.classes.splice(start, end - start, ...segment1);

    return [child1, child2];
  }

  /**
   * Mutation operations
   */
  private mutate(schedule: Schedule): Schedule {
    const mutated = this.cloneSchedule(schedule);

    if (mutated.classes.length === 0) return mutated;

    // Random mutation type
    const mutationType = Math.random();

    if (mutationType < 0.4) {
      // Time slot mutation
      this.mutateTimeSlot(mutated);
    } else if (mutationType < 0.7) {
      // Room mutation
      this.mutateRoom(mutated);
    } else {
      // Faculty mutation
      this.mutateFaculty(mutated);
    }

    return mutated;
  }

  /**
   * Mutate time slot
   */
  private mutateTimeSlot(schedule: Schedule): void {
    const randomIndex = Math.floor(Math.random() * schedule.classes.length);
    const targetClass = schedule.classes[randomIndex];
    const newTimeSlot = this.generateTimeSlots(1)[Math.floor(Math.random() * this.generateTimeSlots(1).length)];
    
    targetClass.timeSlot = newTimeSlot;
  }

  /**
   * Mutate room
   */
  private mutateRoom(schedule: Schedule): void {
    const randomIndex = Math.floor(Math.random() * schedule.classes.length);
    const targetClass = schedule.classes[randomIndex];
    const course = this.courses.find(c => c.id === targetClass.courseId);
    
    if (course) {
      const suitableRooms = this.rooms.filter(r => 
        r.capacity >= 30 && // Assume 30 students minimum
        (!course.requiresLab || r.type === 'LAB')
      );
      
      if (suitableRooms.length > 0) {
        targetClass.roomId = suitableRooms[Math.floor(Math.random() * suitableRooms.length)].id;
      }
    }
  }

  /**
   * Mutate faculty
   */
  private mutateFaculty(schedule: Schedule): void {
    const randomIndex = Math.floor(Math.random() * schedule.classes.length);
    const targetClass = schedule.classes[randomIndex];
    const course = this.courses.find(c => c.id === targetClass.courseId);
    
    if (course) {
      const suitableFaculty = this.faculty.filter(f => 
        f.canTeachCourses.includes(course.id) && 
        f.currentLoad < f.maxLoad
      );
      
      if (suitableFaculty.length > 0) {
        targetClass.facultyId = suitableFaculty[Math.floor(Math.random() * suitableFaculty.length)].id;
      }
    }
  }

  /**
   * Elitism - keep best individuals
   */
  private elitism(population: Schedule[], offspring: Schedule[]): Schedule[] {
    const combined = [...population, ...offspring];
    combined.sort((a, b) => b.fitness - a.fitness);
    
    const eliteSize = Math.floor(this.config.elitismRate * this.config.populationSize);
    const newPopulation = combined.slice(0, eliteSize);
    
    // Fill remaining slots with best offspring
    while (newPopulation.length < this.config.populationSize) {
      const nextBest = combined[eliteSize + (newPopulation.length - eliteSize)];
      if (nextBest) {
        newPopulation.push(nextBest);
      } else {
        break;
      }
    }

    return newPopulation;
  }

  /**
   * Get best schedule from population
   */
  private getBestSchedule(population: Schedule[]): Schedule {
    return population.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }

  /**
   * Hill climbing optimization for local refinement
   */
  private hillClimbingOptimization(schedule: Schedule): Schedule {
    let currentSchedule = this.cloneSchedule(schedule);
    let improved = true;
    const maxIterations = 100;
    let iterations = 0;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      // Try small improvements
      for (let i = 0; i < 10; i++) {
        const neighborSchedule = this.generateNeighbor(currentSchedule);
        neighborSchedule.conflicts = this.validator.validateSchedule(neighborSchedule);
        neighborSchedule.fitness = this.fitnessCalculator.calculateFitness(neighborSchedule);

        if (neighborSchedule.fitness > currentSchedule.fitness) {
          currentSchedule = neighborSchedule;
          improved = true;
          break;
        }
      }
    }

    return currentSchedule;
  }

  /**
   * Generate neighbor solution for hill climbing
   */
  private generateNeighbor(schedule: Schedule): Schedule {
    const neighbor = this.cloneSchedule(schedule);
    
    if (neighbor.classes.length > 0) {
      const randomIndex = Math.floor(Math.random() * neighbor.classes.length);
      const targetClass = neighbor.classes[randomIndex];
      
      // Small random change
      const changeType = Math.random();
      if (changeType < 0.5) {
        // Change time slot by ±1 hour
        const currentHour = parseInt(targetClass.timeSlot.startTime.split(':')[0]);
        const newHour = Math.max(7, Math.min(18, currentHour + (Math.random() < 0.5 ? -1 : 1)));
        targetClass.timeSlot.startTime = `${newHour.toString().padStart(2, '0')}:00`;
        targetClass.timeSlot.endTime = `${(newHour + 1).toString().padStart(2, '0')}:00`;
      }
    }

    return neighbor;
  }

  /**
   * Clone schedule for mutation operations
   */
  private cloneSchedule(schedule: Schedule): Schedule {
    return {
      classes: schedule.classes.map(cls => ({ ...cls })),
      fitness: schedule.fitness,
      conflicts: [...schedule.conflicts],
      metrics: { ...schedule.metrics }
    };
  }
}
