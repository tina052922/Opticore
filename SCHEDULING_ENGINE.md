# OptiCore AI Scheduling Engine

## 🎯 **Overview**

OptiCore features a comprehensive AI-powered scheduling engine that uses advanced optimization algorithms to generate conflict-free university timetables. The system implements a hybrid Genetic Algorithm with Greedy initialization and Hill Climbing optimization, specifically designed for CTU's academic requirements.

## 🧠 **Algorithm Implementation**

### **Hybrid Genetic Algorithm Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    OPTICORE SCHEDULING ENGINE                  │
├─────────────────────────────────────────────────────────────┤
│  1. DATA LOADING                                            │
│     ├─ Real CTU courses from database                       │
│     ├─ Faculty qualifications and constraints               │
│     ├─ Room capacities and equipment                        │
│     └─ Student sections and curricula                       │
├─────────────────────────────────────────────────────────────┤
│  2. GREEDY INITIALIZATION                                   │
│     ├─ Sort courses by priority (year, units, prereqs)      │
│     ├─ Assign qualified faculty                             │
│     ├─ Allocate suitable rooms                             │
│     └─ Generate initial population (50 schedules)           │
├─────────────────────────────────────────────────────────────┤
│  3. GENETIC ALGORITHM                                       │
│     ├─ Tournament Selection (size 5)                        │
│     ├─ Two-point Crossover (80% rate)                      │
│     ├─ Mutation (10% rate)                                 │
│     ├─ Elitism (20% best survive)                          │
│     └─ Evolution (100 generations)                         │
├─────────────────────────────────────────────────────────────┤
│  4. HILL CLIMBING OPTIMIZATION                              │
│     ├─ Local search refinement                              │
│     ├─ Small incremental improvements                       │
│     └─ Conflict resolution                                  │
├─────────────────────────────────────────────────────────────┤
│  5. CONSTRAINT VALIDATION                                    │
│     ├─ Hard constraints (no violations allowed)           │
│     ├─ Soft constraints (preferences optimized)             │
│     ├─ CTU faculty manual policies                          │
│     └─ Real-time conflict detection                         │
└─────────────────────────────────────────────────────────────┘
```

### **Algorithm Parameters**

| Parameter | Value | Purpose |
|------------|-------|---------|
| Population Size | 50 | Diverse initial solutions |
| Generations | 100 | Evolution iterations |
| Mutation Rate | 0.1 | Maintain diversity |
| Crossover Rate | 0.8 | Combine good solutions |
| Elitism Rate | 0.2 | Preserve best solutions |
| Tournament Size | 5 | Selection pressure |

## 📊 **Constraint System**

### **Hard Constraints (Must Not Violate)**

- **Faculty Conflicts**: One teacher cannot be in two places simultaneously
- **Room Conflicts**: One room cannot host two classes at the same time
- **Student Conflicts**: Same program/year students cannot have overlapping classes
- **Prerequisites**: Students must complete prerequisites before advanced courses
- **Room Capacity**: Class size cannot exceed room capacity
- **Lab Requirements**: Lab subjects must be scheduled in appropriate lab rooms
- **Faculty Qualifications**: Teachers must be qualified for assigned subjects

### **Soft Constraints (Should Satisfy When Possible)**

- **Workload Balance**: Distribute teaching load evenly (24 units max)
- **Preferred Times**: Schedule core subjects during prime hours (8AM-5PM)
- **Consecutive Classes**: Minimize gaps between classes for students
- **Room Preferences**: Assign preferred rooms to specific departments
- **Faculty Experience**: Match senior faculty with advanced courses

## 🏛️ **CTU-Specific Implementation**

### **Faculty Manual Policies Applied**

```typescript
// CTU Faculty Load Policies
const CTU_POLICIES = {
  maxTeachingLoad: 24,           // units per semester for regular faculty
  overloadThreshold: 30,         // units requiring justification
  hourlyRates: {
    baccalaureate: 200,          // ₱200/hour
    masters: 225,                // ₱225/hour  
    doctorate: 250               // ₱250/hour
  },
  facultyRanks: [
    'INSTRUCTOR_I', 'INSTRUCTOR_II', 'INSTRUCTOR_III',
    'ASSISTANT_PROFESSOR_I', 'ASSISTANT_PROFESSOR_II', 
    'ASSISTANT_PROFESSOR_III', 'ASSISTANT_PROFESSOR_IV',
    'ASSOCIATE_PROFESSOR_I', 'ASSOCIATE_PROFESSOR_II',
    'ASSOCIATE_PROFESSOR_III', 'ASSOCIATE_PROFESSOR_IV',
    'ASSOCIATE_PROFESSOR_V',
    'PROFESSOR_I', 'PROFESSOR_II', 'PROFESSOR_III',
    'PROFESSOR_IV', 'PROFESSOR_V', 'PROFESSOR_VI',
    'UNIVERSITY_PROFESSOR'
  ]
};
```

### **Program-Specific Curricula**

- **BIT Programs**: Electronics, Drafting, Automotive, Garments, Computer Technology
- **BSIT Program**: Complete 4-year curriculum (CMO No. 25 s. 2015)
- **BSIE Program**: Industrial Engineering curriculum (CMO No. 96 s. 2017)
- **GEC Subjects**: All General Education Courses handled by CAS

### **Room Infrastructure**

- **Specialized Labs**: Electronics, Drafting, Automotive, Garments labs
- **IT Labs**: IT LAB 1-4 (40 capacity each)
- **Lecture Rooms**: Multiple halls with varying capacities
- **Building Distribution**: COTE, CAS, CAFE, COED, CHTM buildings

## 🚀 **Performance Metrics**

### **Fitness Function Components**

```typescript
interface FitnessComponents {
  baseScore: 1000,                    // Starting points
  hardConflictPenalty: -500,          // Per hard conflict
  softConflictPenalty: -100,          // Per soft conflict
  workloadBalanceBonus: upTo 200,     // Even distribution
  utilizationBonus: upTo 100,         // Efficient resource use
  prerequisiteBonus: upTo 100,        // Satisfied prerequisites
  studentTimeBonus: upTo 50           // Minimal gaps
}
```

### **Success Criteria**

- **Perfect Schedule**: Fitness ≥ 1500, 0 hard conflicts
- **Good Schedule**: Fitness ≥ 1000, < 5 hard conflicts
- **Acceptable Schedule**: Fitness ≥ 500, < 10 hard conflicts
- **Execution Time**: < 30 seconds for single program
- **Convergence**: Typically 50-80 generations

## 💻 **API Integration**

### **Endpoints**

```typescript
// Generate schedule
POST /api/scheduling/generate
{
  program?: string,           // Optional: filter by program
  generateMultiple?: boolean, // Generate multiple options
  options?: number           // Number of options if multiple
}

// Get scheduler statistics
GET /api/scheduling/generate
{
  statistics: SchedulingStatistics,
  ready: boolean
}
```

### **Response Format**

```typescript
interface SchedulingResult {
  success: boolean;
  schedule?: Schedule;
  message?: string;
  executionTime: number;      // milliseconds
  iterations: number;          // generations
  statistics?: SchedulingStatistics;
}
```

## 🎛️ **Frontend Integration**

### **AI Scheduler Interface**

- **Overview Tab**: Data statistics and system readiness
- **Generator Tab**: Schedule generation with options
- **Algorithm Tab**: Configuration and explanation
- **Results Tab**: Generated schedule metrics and export

### **User Experience**

- **Real-time Progress**: Generation progress bar
- **Multiple Options**: Compare different schedules
- **Visual Metrics**: Fitness scores, conflicts, utilization
- **Export Functionality**: Save to database

## 🔧 **Technical Architecture**

### **Core Components**

```
/lib/scheduling/
├── types.ts              # Data structures and interfaces
├── data-loader.ts        # Database integration
├── constraint-validator.ts # Rule enforcement
├── fitness-calculator.ts # Scoring system
├── scheduler.ts          # Main orchestration
└── algorithms/
    └── genetic-algorithm.ts # GA implementation
```

### **Data Flow**

```
Database → Data Loader → GA Engine → Validator → Calculator → Frontend
    ↓           ↓          ↓          ↓          ↓          ↓
  CTU Data   Type-safe   Optimization  Rules     Fitness    UI
  Courses    Objects     Algorithm   Checking  Scoring    Display
  Faculty    Validation  Evolution  Conflicts  Metrics    Export
  Rooms      Mapping     Selection  Hard/Soft  Balance    Results
  Sections   Matching    Crossover  Penalties  Utilization Statistics
```

## 📈 **Optimization Features**

### **Intelligent Initialization**

- **Greedy Algorithm**: Creates smart starting solutions
- **Priority Sorting**: Courses sorted by difficulty and importance
- **Qualification Matching**: Faculty assigned based on expertise
- **Room Optimization**: Capacity and equipment matching

### **Adaptive Evolution**

- **Dynamic Selection**: Tournament selection preserves diversity
- **Smart Crossover**: Exchange schedule segments intelligently
- **Targeted Mutation**: Focus on problem areas
- **Elitism Preservation**: Best solutions always survive

### **Local Refinement**

- **Hill Climbing**: Fine-tune best solutions
- **Conflict Resolution**: Fix remaining issues
- **Resource Balancing**: Optimize faculty and room usage
- **Preference Satisfaction**: Meet soft constraints

## 🎯 **Use Cases**

### **Program-Specific Scheduling**

```typescript
// Generate schedule for BSIT program only
const bsitSchedule = await scheduler.generateSchedule("BSIT");

// Generate multiple options for BIT programs
const bitOptions = await scheduler.generateMultipleOptions("BIT", 5);
```

### **Cross-College Coordination**

```typescript
// Generate schedule for all programs
const fullSchedule = await scheduler.generateSchedule();

// Compare different program schedules
const comparisons = await scheduler.compareProgramSchedules();
```

### **What-If Analysis**

```typescript
// Test different faculty assignments
const scenario1 = await scheduler.generateSchedule("BSIT", {
  facultyConstraints: { maxLoad: 20 }
});

const scenario2 = await scheduler.generateSchedule("BSIT", {
  roomConstraints: { preferredBuildings: ["COTE"] }
});
```

## 🔍 **Quality Assurance**

### **Validation Checks**

- **Data Integrity**: Verify all required data is present
- **Constraint Satisfaction**: Ensure all rules are followed
- **Performance Metrics**: Monitor execution time and convergence
- **Result Quality**: Validate generated schedules

### **Testing Scenarios**

- **Small Programs**: Single BIT major (≤ 50 classes)
- **Medium Programs**: BSIT curriculum (≤ 100 classes)
- **Large Programs**: All programs combined (≤ 500 classes)
- **Edge Cases**: Maximum faculty load, room shortages

## 🚀 **Future Enhancements**

### **Algorithm Improvements**

- **Multi-objective Optimization**: Pareto frontier for conflicting goals
- **Machine Learning**: Learn from successful schedules
- **Parallel Processing**: Multi-threaded evolution
- **Adaptive Parameters**: Self-tuning algorithm parameters

### **Feature Additions**

- **Real-time Collaboration**: Multiple users editing simultaneously
- **Historical Analysis**: Learn from past semesters
- **Predictive Analytics**: Forecast enrollment and resource needs
- **Mobile Interface**: Schedule management on mobile devices

---

## 📞 **Support and Documentation**

For technical support or questions about the scheduling engine:

1. **Check System Status**: Use `/api/scheduling/generate` endpoint
2. **Review Algorithm Parameters**: See configuration section
3. **Validate Data**: Ensure all courses, faculty, and rooms are properly configured
4. **Monitor Performance**: Check execution times and convergence metrics

The OptiCore AI Scheduling Engine represents a significant advancement in academic timetabling, combining cutting-edge optimization algorithms with practical university administration requirements.
