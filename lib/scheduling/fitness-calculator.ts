import { Schedule, Conflict, ScheduleMetrics, SchedulingConstraints } from "./types";

/**
 * Calculate fitness score and metrics for a schedule
 */
export class FitnessCalculator {
  private constraints: SchedulingConstraints;

  constructor(constraints: SchedulingConstraints) {
    this.constraints = constraints;
  }

  /**
   * Calculate comprehensive fitness score (higher is better)
   */
  calculateFitness(schedule: Schedule): number {
    const metrics = this.calculateMetrics(schedule);
    schedule.metrics = metrics;
    
    // Base score starts at 1000
    let fitness = 1000;
    
    // Heavy penalties for hard conflicts
    fitness -= metrics.hardConflicts * 500;
    
    // Moderate penalties for soft conflicts
    fitness -= metrics.softConflicts * 100;
    
    // Bonus for good metrics
    fitness += this.calculateWorkloadBalanceBonus(metrics);
    fitness += this.calculateUtilizationBonus(metrics);
    fitness += this.calculatePrerequisiteBonus(metrics);
    fitness += this.calculateStudentTimeBonus(metrics);
    
    return Math.max(0, fitness); // Ensure non-negative
  }

  /**
   * Calculate detailed metrics for a schedule
   */
  calculateMetrics(schedule: Schedule): ScheduleMetrics {
    const conflicts = schedule.conflicts;
    const hardConflicts = conflicts.filter(c => c.severity === 'HARD').length;
    const softConflicts = conflicts.filter(c => c.severity === 'SOFT').length;

    return {
      totalConflicts: conflicts.length,
      hardConflicts,
      softConflicts,
      facultyUtilization: this.calculateFacultyUtilization(schedule),
      roomUtilization: this.calculateRoomUtilization(schedule),
      workloadBalance: this.calculateWorkloadBalanceScore(schedule),
      prerequisiteSatisfaction: this.calculatePrerequisiteSatisfaction(schedule),
      studentGaps: this.calculateStudentGaps(schedule)
    };
  }

  /**
   * Calculate faculty utilization percentage
   */
  private calculateFacultyUtilization(schedule: Schedule): number {
    const facultyLoads = new Map<string, number>();
    const facultyMaxLoads = new Map<string, number>();

    // Calculate current loads
    schedule.classes.forEach(cls => {
      const load = facultyLoads.get(cls.facultyId) || 0;
      facultyLoads.set(cls.facultyId, load + 1); // Count classes, could be units
    });

    // Calculate utilization
    let totalUtilization = 0;
    let facultyCount = 0;

    facultyLoads.forEach((load, facultyId) => {
      const maxLoad = this.constraints.maxFacultyLoad;
      const utilization = (load / maxLoad) * 100;
      totalUtilization += Math.min(utilization, 100); // Cap at 100%
      facultyCount++;
    });

    return facultyCount > 0 ? totalUtilization / facultyCount : 0;
  }

  /**
   * Calculate room utilization percentage
   */
  private calculateRoomUtilization(schedule: Schedule): number {
    const roomUsage = new Map<string, number>();
    const totalPossibleSlots = 5 * 12; // 5 days * 12 hours per day (7AM-7PM)

    // Count room usage
    schedule.classes.forEach(cls => {
      const usage = roomUsage.get(cls.roomId) || 0;
      roomUsage.set(cls.roomId, usage + 1);
    });

    // Calculate utilization
    let totalUtilization = 0;
    let roomCount = 0;

    roomUsage.forEach((usage, roomId) => {
      const utilization = (usage / totalPossibleSlots) * 100;
      totalUtilization += utilization;
      roomCount++;
    });

    return roomCount > 0 ? totalUtilization / roomCount : 0;
  }

  /**
   * Calculate workload balance score (0-100, higher is better)
   */
  private calculateWorkloadBalanceScore(schedule: Schedule): number {
    const facultyLoads = new Map<string, number>();

    // Calculate loads
    schedule.classes.forEach(cls => {
      const load = facultyLoads.get(cls.facultyId) || 0;
      facultyLoads.set(cls.facultyId, load + 1);
    });

    if (facultyLoads.size === 0) return 100;

    const loads = Array.from(facultyLoads.values());
    const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower deviation = higher score
    return Math.max(0, 100 - (standardDeviation * 10));
  }

  /**
   * Calculate prerequisite satisfaction percentage
   */
  private calculatePrerequisiteSatisfaction(schedule: Schedule): number {
    const prerequisiteConflicts = schedule.conflicts.filter(c => c.type === 'PREREQUISITE').length;
    const totalClasses = schedule.classes.length;

    if (totalClasses === 0) return 100;

    const satisfiedPrereqs = Math.max(0, totalClasses - prerequisiteConflicts);
    return (satisfiedPrereqs / totalClasses) * 100;
  }

  /**
   * Calculate average student gaps between classes
   */
  private calculateStudentGaps(schedule: Schedule): number {
    const sectionSchedules = new Map<string, any[]>();

    // Group classes by section
    schedule.classes.forEach(cls => {
      if (!sectionSchedules.has(cls.sectionId)) {
        sectionSchedules.set(cls.sectionId, []);
      }
      sectionSchedules.get(cls.sectionId)!.push(cls);
    });

    let totalGaps = 0;
    let sectionCount = 0;

    sectionSchedules.forEach((classes, sectionId) => {
      // Sort by day and time
      classes.sort((a, b) => {
        if (a.timeSlot.day !== b.timeSlot.day) {
          return a.timeSlot.day.localeCompare(b.timeSlot.day);
        }
        return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
      });

      // Calculate gaps between consecutive classes
      let dayGaps = 0;
      for (let i = 1; i < classes.length; i++) {
        const prev = classes[i - 1];
        const curr = classes[i];

        if (prev.timeSlot.day === curr.timeSlot.day) {
          const gapMinutes = this.timeToMinutes(curr.timeSlot.startTime) - 
                           this.timeToMinutes(prev.timeSlot.endTime);
          if (gapMinutes > 0) {
            dayGaps += gapMinutes;
          }
        }
      }

      totalGaps += dayGaps;
      sectionCount++;
    });

    return sectionCount > 0 ? totalGaps / sectionCount : 0;
  }

  /**
   * Bonus points for good workload balance
   */
  private calculateWorkloadBalanceBonus(metrics: ScheduleMetrics): number {
    return Math.round(metrics.workloadBalance * 2); // Up to 200 points
  }

  /**
   * Bonus points for good utilization
   */
  private calculateUtilizationBonus(metrics: ScheduleMetrics): number {
    const avgUtilization = (metrics.facultyUtilization + metrics.roomUtilization) / 2;
    return Math.round(avgUtilization); // Up to 100 points
  }

  /**
   * Bonus points for prerequisite satisfaction
   */
  private calculatePrerequisiteBonus(metrics: ScheduleMetrics): number {
    return Math.round(metrics.prerequisiteSatisfaction); // Up to 100 points
  }

  /**
   * Bonus points for minimal student gaps
   */
  private calculateStudentTimeBonus(metrics: ScheduleMetrics): number {
    // Fewer gaps = higher bonus
    if (metrics.studentGaps < 60) return 50; // Less than 1 hour average gap
    if (metrics.studentGaps < 120) return 25; // Less than 2 hours average gap
    return 0;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
