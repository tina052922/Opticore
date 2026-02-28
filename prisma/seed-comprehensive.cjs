/* eslint-disable no-console */
// Comprehensive Prisma seed script for OptiCore with all BIT majors, BSIT, BSIE curricula
// Based on CTU prospectuses and faculty policies

const { PrismaClient, Role, SubjectType, SubjectCategory, RoomType, DayOfWeek, FacultyRank } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding OptiCore comprehensive database...");

  const passwordHash = await bcrypt.hash("password", 10);

  // Core colleges
  const cote = await prisma.college.upsert({
    where: { code: "COTE" },
    update: {},
    create: { code: "COTE", name: "College of Technology" }
  });

  const cafe = await prisma.college.upsert({
    where: { code: "CAFE" },
    update: {},
    create: { code: "CAFE", name: "College of Agriculture and Food Engineering" }
  });

  const coed = await prisma.college.upsert({
    where: { code: "COED" },
    update: {},
    create: { code: "COED", name: "College of Education" }
  });

  const cas = await prisma.college.upsert({
    where: { code: "CAS" },
    update: {},
    create: { code: "CAS", name: "College of Arts and Sciences" }
  });

  const chtm = await prisma.college.upsert({
    where: { code: "CHTM" },
    update: {},
    create: { code: "CHTM", name: "College of Hospitality and Tourism Management" }
  });

  // Programs - BIT Majors
  const bitElectronics = await prisma.program.upsert({
    where: { code: "BIT-ELECTRONICS" },
    update: {},
    create: {
      code: "BIT-ELECTRONICS",
      name: "Bachelor of Industrial Technology - Major in Electronics Technology",
      collegeId: cote.id
    }
  });

  const bitDrafting = await prisma.program.upsert({
    where: { code: "BIT-DRAFTING" },
    update: {},
    create: {
      code: "BIT-DRAFTING",
      name: "Bachelor of Industrial Technology - Major in Drafting Technology",
      collegeId: cote.id
    }
  });

  const bitAutomotive = await prisma.program.upsert({
    where: { code: "BIT-AUTOMOTIVE" },
    update: {},
    create: {
      code: "BIT-AUTOMOTIVE",
      name: "Bachelor of Industrial Technology - Major in Automotive Technology",
      collegeId: cote.id
    }
  });

  const bitGarments = await prisma.program.upsert({
    where: { code: "BIT-GARMENTS" },
    update: {},
    create: {
      code: "BIT-GARMENTS",
      name: "Bachelor of Industrial Technology - Major in Garments Technology",
      collegeId: cote.id
    }
  });

  const bitComputerTech = await prisma.program.upsert({
    where: { code: "BIT-COMPTECH" },
    update: {},
    create: {
      code: "BIT-COMPTECH",
      name: "Bachelor of Industrial Technology - Major in Computer Technology",
      collegeId: cote.id
    }
  });

  // BSIT Program
  const bsit = await prisma.program.upsert({
    where: { code: "BSIT" },
    update: {},
    create: {
      code: "BSIT",
      name: "Bachelor of Science in Information Technology",
      collegeId: cote.id
    }
  });

  // BSIE Program
  const bsie = await prisma.program.upsert({
    where: { code: "BSIE" },
    update: {},
    create: {
      code: "BSIE",
      name: "Bachelor of Science in Industrial Engineering",
      collegeId: cote.id
    }
  });

  // CAS Programs for GEC
  const casGec = await prisma.program.upsert({
    where: { code: "CAS-GEC" },
    update: {},
    create: {
      code: "CAS-GEC",
      name: "CAS General Education Courses",
      collegeId: cas.id
    }
  });

  // Users with proper ranks and qualifications
  const doi = await prisma.user.upsert({
    where: { email: "doi@ctu.edu.ph" },
    update: {},
    create: {
      email: "doi@ctu.edu.ph",
      name: "Dean of Instructions",
      role: Role.DOI,
      passwordHash
    }
  });

  const coteAdmin = await prisma.user.upsert({
    where: { email: "cote.admin@ctu.edu.ph" },
    update: {},
    create: {
      email: "cote.admin@ctu.edu.ph",
      name: "COTE College Admin",
      role: Role.COLLEGE_ADMIN,
      collegeId: cote.id,
      passwordHash
    }
  });

  const casAdmin = await prisma.user.upsert({
    where: { email: "cas.admin@ctu.edu.ph" },
    update: {},
    create: {
      email: "cas.admin@ctu.edu.ph",
      name: "CAS College Admin",
      role: Role.COLLEGE_ADMIN,
      collegeId: cas.id,
      passwordHash
    }
  });

  // Chairman Admins for each program
  const bitElectronicsChair = await prisma.user.upsert({
    where: { email: "chair.electronics@ctu.edu.ph" },
    update: {},
    create: {
      email: "chair.electronics@ctu.edu.ph",
      name: "BIT Electronics Chairman",
      role: Role.CHAIRMAN_ADMIN,
      collegeId: cote.id,
      programId: bitElectronics.id,
      passwordHash
    }
  });

  const bitDraftingChair = await prisma.user.upsert({
    where: { email: "chair.drafting@ctu.edu.ph" },
    update: {},
    create: {
      email: "chair.drafting@ctu.edu.ph",
      name: "BIT Drafting Chairman",
      role: Role.CHAIRMAN_ADMIN,
      collegeId: cote.id,
      programId: bitDrafting.id,
      passwordHash
    }
  });

  const bitAutomotiveChair = await prisma.user.upsert({
    where: { email: "chair.automotive@ctu.edu.ph" },
    update: {},
    create: {
      email: "chair.automotive@ctu.edu.ph",
      name: "BIT Automotive Chairman",
      role: Role.CHAIRMAN_ADMIN,
      collegeId: cote.id,
      programId: bitAutomotive.id,
      passwordHash
    }
  });

  const bitGarmentsChair = await prisma.user.upsert({
    where: { email: "chair.garments@ctu.edu.ph" },
    update: {},
    create: {
      email: "chair.garments@ctu.edu.ph",
      name: "BIT Garments Chairman",
      role: Role.CHAIRMAN_ADMIN,
      collegeId: cote.id,
      programId: bitGarments.id,
      passwordHash
    }
  });

  const bsitChair = await prisma.user.upsert({
    where: { email: "chair.bsit@ctu.edu.ph" },
    update: {},
    create: {
      email: "chair.bsit@ctu.edu.ph",
      name: "BSIT Chairman Admin",
      role: Role.CHAIRMAN_ADMIN,
      collegeId: cote.id,
      programId: bsit.id,
      passwordHash
    }
  });

  const bsieChair = await prisma.user.upsert({
    where: { email: "chair.bsie@ctu.edu.ph" },
    update: {},
    create: {
      email: "chair.bsie@ctu.edu.ph",
      name: "BSIE Chairman Admin",
      role: Role.CHAIRMAN_ADMIN,
      collegeId: cote.id,
      programId: bsie.id,
      passwordHash
    }
  });

  // Faculty with proper ranks and qualifications
  const electronicsInstructor = await prisma.user.upsert({
    where: { email: "electronics.faculty@ctu.edu.ph" },
    update: {},
    create: {
      email: "electronics.faculty@ctu.edu.ph",
      name: "Electronics Faculty",
      role: Role.INSTRUCTOR,
      collegeId: cote.id,
      programId: bitElectronics.id,
      passwordHash
    }
  });

  const draftingInstructor = await prisma.user.upsert({
    where: { email: "drafting.faculty@ctu.edu.ph" },
    update: {},
    create: {
      email: "drafting.faculty@ctu.edu.ph",
      name: "Drafting Faculty",
      role: Role.INSTRUCTOR,
      collegeId: cote.id,
      programId: bitDrafting.id,
      passwordHash
    }
  });

  const automotiveInstructor = await prisma.user.upsert({
    where: { email: "automotive.faculty@ctu.edu.ph" },
    update: {},
    create: {
      email: "automotive.faculty@ctu.edu.ph",
      name: "Automotive Faculty",
      role: Role.INSTRUCTOR,
      collegeId: cote.id,
      programId: bitAutomotive.id,
      passwordHash
    }
  });

  const garmentsInstructor = await prisma.user.upsert({
    where: { email: "garments.faculty@ctu.edu.ph" },
    update: {},
    create: {
      email: "garments.faculty@ctu.edu.ph",
      name: "Garments Faculty",
      role: Role.INSTRUCTOR,
      collegeId: cote.id,
      programId: bitGarments.id,
      passwordHash
    }
  });

  const itInstructor = await prisma.user.upsert({
    where: { email: "it.faculty@ctu.edu.ph" },
    update: {},
    create: {
      email: "it.faculty@ctu.edu.ph",
      name: "IT Faculty",
      role: Role.INSTRUCTOR,
      collegeId: cote.id,
      programId: bsit.id,
      passwordHash
    }
  });

  const ieInstructor = await prisma.user.upsert({
    where: { email: "ie.faculty@ctu.edu.ph" },
    update: {},
    create: {
      email: "ie.faculty@ctu.edu.ph",
      name: "IE Faculty",
      role: Role.INSTRUCTOR,
      collegeId: cote.id,
      programId: bsie.id,
      passwordHash
    }
  });

  const gecInstructor = await prisma.user.upsert({
    where: { email: "gec.faculty@ctu.edu.ph" },
    update: {},
    create: {
      email: "gec.faculty@ctu.edu.ph",
      name: "GEC Faculty",
      role: Role.INSTRUCTOR,
      collegeId: cas.id,
      programId: casGec.id,
      passwordHash
    }
  });

  // Students
  const student = await prisma.user.upsert({
    where: { email: "student.bsit3a@ctu.edu.ph" },
    update: {},
    create: {
      email: "student.bsit3a@ctu.edu.ph",
      name: "BSIT 3A Student",
      role: Role.STUDENT,
      collegeId: cote.id,
      programId: bsit.id,
      passwordHash
    }
  });

  const visitor = await prisma.user.upsert({
    where: { email: "visitor@ctu.edu.ph" },
    update: { passwordHash },
    create: {
      email: "visitor@ctu.edu.ph",
      name: "Campus Visitor",
      role: Role.VISITOR,
      passwordHash
    }
  });

  // Faculty Profiles with ranks and qualifications
  const electronicsProfile = await prisma.facultyProfile.upsert({
    where: { userId: electronicsInstructor.id },
    update: {
      fullName: "Electronics Technology Specialist",
      bsDegree: "Bachelor of Industrial Technology - Electronics",
      msDegree: "Master of Technology",
      status: "FULLTIME",
      rank: FacultyRank.ASSISTANT_PROFESSOR_I,
      experience: 5,
      trainingHours: 120,
      eligibility: "RA 1080",
      hourlyRate: 225.0,
      standardLoad: 24
    },
    create: {
      userId: electronicsInstructor.id,
      fullName: "Electronics Technology Specialist",
      bsDegree: "Bachelor of Industrial Technology - Electronics",
      msDegree: "Master of Technology",
      status: "FULLTIME",
      rank: FacultyRank.ASSISTANT_PROFESSOR_I,
      experience: 5,
      trainingHours: 120,
      eligibility: "RA 1080",
      hourlyRate: 225.0,
      standardLoad: 24
    }
  });

  const draftingProfile = await prisma.facultyProfile.upsert({
    where: { userId: draftingInstructor.id },
    update: {
      fullName: "Drafting Technology Expert",
      bsDegree: "Bachelor of Industrial Technology - Drafting",
      status: "FULLTIME",
      rank: FacultyRank.INSTRUCTOR_III,
      experience: 3,
      trainingHours: 80,
      eligibility: "RA 1080",
      hourlyRate: 200.0,
      standardLoad: 24
    },
    create: {
      userId: draftingInstructor.id,
      fullName: "Drafting Technology Expert",
      bsDegree: "Bachelor of Industrial Technology - Drafting",
      status: "FULLTIME",
      rank: FacultyRank.INSTRUCTOR_III,
      experience: 3,
      trainingHours: 80,
      eligibility: "RA 1080",
      hourlyRate: 200.0,
      standardLoad: 24
    }
  });

  const automotiveProfile = await prisma.facultyProfile.upsert({
    where: { userId: automotiveInstructor.id },
    update: {
      fullName: "Automotive Technology Specialist",
      bsDegree: "Bachelor of Industrial Technology - Automotive",
      status: "FULLTIME",
      rank: FacultyRank.ASSISTANT_PROFESSOR_II,
      experience: 4,
      trainingHours: 100,
      eligibility: "RA 1080",
      hourlyRate: 225.0,
      standardLoad: 24
    },
    create: {
      userId: automotiveInstructor.id,
      fullName: "Automotive Technology Specialist",
      bsDegree: "Bachelor of Industrial Technology - Automotive",
      status: "FULLTIME",
      rank: FacultyRank.ASSISTANT_PROFESSOR_II,
      experience: 4,
      trainingHours: 100,
      eligibility: "RA 1080",
      hourlyRate: 225.0,
      standardLoad: 24
    }
  });

  const itProfile = await prisma.facultyProfile.upsert({
    where: { userId: itInstructor.id },
    update: {
      fullName: "Information Technology Specialist",
      bsDegree: "Bachelor of Science in Information Technology",
      msDegree: "Master of Science in IT",
      status: "FULLTIME",
      rank: FacultyRank.ASSOCIATE_PROFESSOR_I,
      experience: 6,
      trainingHours: 150,
      eligibility: "RA 1080",
      hourlyRate: 225.0,
      standardLoad: 24
    },
    create: {
      userId: itInstructor.id,
      fullName: "Information Technology Specialist",
      bsDegree: "Bachelor of Science in Information Technology",
      msDegree: "Master of Science in IT",
      status: "FULLTIME",
      rank: FacultyRank.ASSOCIATE_PROFESSOR_I,
      experience: 6,
      trainingHours: 150,
      eligibility: "RA 1080",
      hourlyRate: 225.0,
      standardLoad: 24
    }
  });

  // Academic Period
  const currentPeriod = await prisma.academicPeriod.upsert({
    where: { id: "CURRENT_PERIOD_1" },
    update: {
      name: "1st Semester 2025-2026",
      semester: "1st",
      academicYear: "2025-2026",
      isCurrent: true
    },
    create: {
      id: "CURRENT_PERIOD_1",
      name: "1st Semester 2025-2026",
      semester: "1st",
      academicYear: "2025-2026",
      isCurrent: true
    }
  });

  // Create sections for each program
  const bitElectronics1A = await createSection(prisma, bitElectronics, "1A", 1, 40);
  const bitElectronics2A = await createSection(prisma, bitElectronics, "2A", 2, 40);
  const bitDrafting1A = await createSection(prisma, bitDrafting, "1A", 1, 40);
  const bitDrafting2A = await createSection(prisma, bitDrafting, "2A", 2, 40);
  const bitAutomotive1A = await createSection(prisma, bitAutomotive, "1A", 1, 40);
  const bitAutomotive2A = await createSection(prisma, bitAutomotive, "2A", 2, 40);
  const bitGarments1A = await createSection(prisma, bitGarments, "1A", 1, 40);
  const bitGarments2A = await createSection(prisma, bitGarments, "2A", 2, 40);
  const bsit1A = await createSection(prisma, bsit, "1A", 1, 40);
  const bsit2A = await createSection(prisma, bsit, "2A", 2, 40);
  const bsit3A = await createSection(prisma, bsit, "3A", 3, 35);
  const bsie1A = await createSection(prisma, bsie, "1A", 1, 40);
  const bsie2A = await createSection(prisma, bsie, "2A", 2, 40);

  // Link demo student to BSIT 3A
  await prisma.user.update({
    where: { email: "student.bsit3a@ctu.edu.ph" },
    data: { sectionId: bsit3A.id }
  });

  // Create subjects for all programs
  await createBITSubjects(prisma, bitElectronics, bitDrafting, bitAutomotive, bitGarments);
  await createBSITSubjects(prisma, bsit);
  await createBSIESubjects(prisma, bsie);
  await createGECSubjects(prisma, cas);

  // Create rooms including BSIT department labs
  await createRooms(prisma);

  console.log("Comprehensive seed completed successfully!");
}

async function createSection(prisma, program, name, yearLevel, studentCount) {
  return await prisma.section.upsert({
    where: { programId_name: { programId: program.id, name } },
    update: {},
    create: {
      programId: program.id,
      name,
      yearLevel,
      studentCount
    }
  });
}

async function createBITSubjects(prisma, bitElectronics, bitDrafting, bitAutomotive, bitGarments) {
  // BIT Electronics Technology Subjects
  const electronicsSubjects = [
    { code: "ElxTech 111", title: "Electronic Devices, Instruments and Circuits", units: 15, lecHours: 3, labHours: 12, yearLevel: 1, semester: "1st", category: "MAJOR" },
    { code: "ElxTech 122", title: "Electronics Communication Systems", units: 15, lecHours: 3, labHours: 12, yearLevel: 1, semester: "2nd", category: "MAJOR", prerequisite: "ElxTech 111" },
    { code: "ElxTech 213", title: "Digital Applications and Embedded Systems", units: 15, lecHours: 3, labHours: 12, yearLevel: 2, semester: "1st", category: "MAJOR", prerequisite: "ElxTech 122" },
    { code: "ElxTech 224", title: "Industrial Automation", units: 15, lecHours: 3, labHours: 12, yearLevel: 2, semester: "2nd", category: "MAJOR", prerequisite: "ElxTech 213" }
  ];

  for (const subject of electronicsSubjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { ...subject, totalHours: subject.lecHours + subject.labHours },
      create: {
        ...subject,
        totalHours: subject.lecHours + subject.labHours,
        type: SubjectType.DEPARTMENTAL,
        college: "COTE",
        curriculum: "A.Y. 2020-2021 BIT EIXTech August 2020 Revision: 1"
      }
    });
  }

  // BIT Drafting Technology Subjects
  const draftingSubjects = [
    { code: "DTech 111", title: "Fundamentals of Mechanical Drafting with CAD", units: 15, lecHours: 3, labHours: 12, yearLevel: 1, semester: "1st", category: "MAJOR" },
    { code: "DTech 122", title: "Principles of Design, Furniture Design, and Theories of Architectural Drafting with CAD", units: 15, lecHours: 3, labHours: 12, yearLevel: 1, semester: "2nd", category: "MAJOR", prerequisite: "DTech 111" }
  ];

  for (const subject of draftingSubjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { ...subject, totalHours: subject.lecHours + subject.labHours },
      create: {
        ...subject,
        totalHours: subject.lecHours + subject.labHours,
        type: SubjectType.DEPARTMENTAL,
        college: "COTE",
        curriculum: "A.Y. 2021-2022"
      }
    });
  }

  // BIT Automotive Technology Subjects
  const automotiveSubjects = [
    { code: "AutoTech 111", title: "Fundamentals of Automotive Technology", units: 15, lecHours: 3, labHours: 12, yearLevel: 1, semester: "1st", category: "MAJOR" },
    { code: "AutoTech 122", title: "Chassis Unit and Related Electro-Mechanical Systems", units: 15, lecHours: 3, labHours: 12, yearLevel: 1, semester: "2nd", category: "MAJOR", prerequisite: "AutoTech 111" },
    { code: "AutoTech 213", title: "Power Trains and Automatic Transmission Operation and Servicing", units: 15, lecHours: 3, labHours: 12, yearLevel: 2, semester: "1st", category: "MAJOR", prerequisite: "AutoTech 122" },
    { code: "AutoTech 224", title: "Engine Servicing and Performance Testing with Driving Education", units: 15, lecHours: 3, labHours: 12, yearLevel: 2, semester: "2nd", category: "MAJOR", prerequisite: "AutoTech 111" }
  ];

  for (const subject of automotiveSubjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { ...subject, totalHours: subject.lecHours + subject.labHours },
      create: {
        ...subject,
        totalHours: subject.lecHours + subject.labHours,
        type: SubjectType.DEPARTMENTAL,
        college: "COTE",
        curriculum: "A.Y. 2020-2021 BIT AutoTech August 2020 Revision: 1"
      }
    });
  }

  // BIT Garments Technology Subjects
  const garmentsSubjects = [
    { code: "GarTech 111", title: "Garments Construction 1", units: 15, lecHours: 3, labHours: 12, yearLevel: 1, semester: "1st", category: "MAJOR" },
    { code: "GarTech 122", title: "Garments Construction 2", units: 15, lecHours: 3, labHours: 12, yearLevel: 1, semester: "2nd", category: "MAJOR", prerequisite: "GarTech 111" },
    { code: "GarTech 213", title: "Advanced Dress Designing and Construction", units: 15, lecHours: 3, labHours: 12, yearLevel: 2, semester: "1st", category: "MAJOR", prerequisite: "GarTech 122" },
    { code: "GarTech 224", title: "Draping", units: 15, lecHours: 3, labHours: 12, yearLevel: 2, semester: "2nd", category: "MAJOR", prerequisite: "GarTech 213" }
  ];

  for (const subject of garmentsSubjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { ...subject, totalHours: subject.lecHours + subject.labHours },
      create: {
        ...subject,
        totalHours: subject.lecHours + subject.labHours,
        type: SubjectType.DEPARTMENTAL,
        college: "COTE",
        curriculum: "A.Y. 2020-2021"
      }
    });
  }

  // Common subjects for all BIT programs
  const commonBITSubjects = [
    { code: "Draw 111", title: "Fundamentals of Technical Drawing and Sketching", units: 3, lecHours: 1, labHours: 3, yearLevel: 1, semester: "1st", category: "DEPARTMENTAL" },
    { code: "Draw 122", title: "Advanced Technical Drawing and Blueprint Reading", units: 3, lecHours: 1, labHours: 3, yearLevel: 1, semester: "2nd", category: "DEPARTMENTAL", prerequisite: "Draw 111" },
    { code: "AST 111", title: "Fundamentals of Electrical and Electronics", units: 3, lecHours: 3, labHours: 0, yearLevel: 1, semester: "1st", category: "DEPARTMENTAL" },
    { code: "AST 122", title: "Digital Electronics", units: 3, lecHours: 3, labHours: 0, yearLevel: 1, semester: "2nd", category: "DEPARTMENTAL", prerequisite: "AST 111" },
    { code: "AST 213", title: "Basic Pneumatics/Hydraulics", units: 3, lecHours: 1, labHours: 3, yearLevel: 2, semester: "1st", category: "DEPARTMENTAL", prerequisite: "AST 122" },
    { code: "AST 224", title: "Programmable Logic Controller", units: 3, lecHours: 1, labHours: 3, yearLevel: 2, semester: "2nd", category: "DEPARTMENTAL", prerequisite: "AST 213" },
    { code: "Comp 1", title: "Office Productivity Application Software", units: 5, lecHours: 2, labHours: 3, yearLevel: 1, semester: "2nd", category: "DEPARTMENTAL" }
  ];

  for (const subject of commonBITSubjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { ...subject, totalHours: subject.lecHours + subject.labHours },
      create: {
        ...subject,
        totalHours: subject.lecHours + subject.labHours,
        type: SubjectType.DEPARTMENTAL,
        college: "COTE"
      }
    });
  }
}

async function createBSITSubjects(prisma, bsit) {
  const bsitSubjects = [
    // First Year 1st Sem
    { code: "CC 111", title: "Introduction to Computing", units: 5, lecHours: 2, labHours: 3, yearLevel: 1, semester: "1st", category: "CC" },
    { code: "CC 112", title: "Computer Programming 1 (Lec)", units: 2, lecHours: 2, labHours: 0, yearLevel: 1, semester: "1st", category: "CC" },
    { code: "CC 112 L", title: "Computer Programming 1 (Lab)", units: 9, lecHours: 0, labHours: 9, yearLevel: 1, semester: "1st", category: "CC" },
    { code: "AP 1", title: "Multimedia", units: 5, lecHours: 2, labHours: 3, yearLevel: 1, semester: "1st", category: "AP" },
    { code: "PC 121", title: "Discrete Mathematics", units: 3, lecHours: 3, labHours: 0, yearLevel: 1, semester: "2nd", category: "PC" },
    { code: "AP 2", title: "Digital Logic Design", units: 5, lecHours: 2, labHours: 3, yearLevel: 1, semester: "2nd", category: "AP", prerequisite: "CC 111" },
    { code: "CC 123", title: "Computer Programming 2 (Lec)", units: 2, lecHours: 2, labHours: 0, yearLevel: 1, semester: "2nd", category: "CC", prerequisite: "CC 112, CC 112 L" },
    { code: "CC 123 L", title: "Computer Programming 2 (Lab)", units: 9, lecHours: 0, labHours: 9, yearLevel: 1, semester: "2nd", category: "CC", prerequisite: "CC 112, CC 112 L" },
    { code: "PC 212", title: "Quantitative Methods (Modeling & Simulation)", units: 3, lecHours: 3, labHours: 0, yearLevel: 2, semester: "1st", category: "PC", prerequisite: "PC 121" },
    { code: "CC 214", title: "Data Structures and Algorithms (Lec)", units: 2, lecHours: 2, labHours: 0, yearLevel: 2, semester: "1st", category: "CC", prerequisite: "CC 123, CC 123 L" },
    { code: "CC 214 L", title: "Data Structures and Algorithms (Lab)", units: 9, lecHours: 0, labHours: 9, yearLevel: 2, semester: "1st", category: "CC", prerequisite: "CC 123, CC 123 L" },
    { code: "P Elec 1", title: "Object-Oriented Programming", units: 5, lecHours: 2, labHours: 3, yearLevel: 2, semester: "1st", category: "PELEC", prerequisite: "CC 123, CC 123 L, AP 1" },
    { code: "P Elec 2", title: "Web Systems and Technologies", units: 5, lecHours: 2, labHours: 3, yearLevel: 2, semester: "1st", category: "PELEC", prerequisite: "CC 123, CC 123 L, AP 1" },
    { code: "PC 223", title: "Integrative Programming and Technologies 1", units: 5, lecHours: 2, labHours: 3, yearLevel: 2, semester: "2nd", category: "PC", prerequisite: "CC 123, CC 123 L" },
    { code: "PC 224", title: "Networking 1", units: 5, lecHours: 2, labHours: 3, yearLevel: 2, semester: "2nd", category: "PC", prerequisite: "AP 2" },
    { code: "CC 225", title: "Information Management (Lec)", units: 2, lecHours: 2, labHours: 0, yearLevel: 2, semester: "2nd", category: "CC", prerequisite: "CC 214, CC 214 L" },
    { code: "CC 225 L", title: "Information Management (Lab)", units: 9, lecHours: 0, labHours: 9, yearLevel: 2, semester: "2nd", category: "CC", prerequisite: "CC 214, CC 214 L" },
    { code: "P Elec 3", title: "Platform Technologies", units: 5, lecHours: 2, labHours: 3, yearLevel: 2, semester: "2nd", category: "PELEC" },
    { code: "AP 3", title: "ASP.NET", units: 5, lecHours: 2, labHours: 3, yearLevel: 2, semester: "2nd", category: "AP", prerequisite: "CC 123, CC 123 L" },
    // Third Year
    { code: "PC 315", title: "Networking 2 (Lec)", units: 2, lecHours: 2, labHours: 0, yearLevel: 3, semester: "1st", category: "PC", prerequisite: "PC 224" },
    { code: "PC 315 L", title: "Networking 2 (Lab)", units: 9, lecHours: 0, labHours: 9, yearLevel: 3, semester: "1st", category: "PC", prerequisite: "PC 224" },
    { code: "PC 316", title: "Systems Integration and Architecture 1", units: 5, lecHours: 2, labHours: 3, yearLevel: 3, semester: "1st", category: "PC", prerequisite: "PC 223" },
    { code: "PC 317", title: "Introduction to Human Computer Interaction", units: 5, lecHours: 2, labHours: 3, yearLevel: 3, semester: "1st", category: "PC", prerequisite: "AP 1, CC 225, CC 225 L" },
    { code: "PC 3180", title: "Database Management Systems", units: 5, lecHours: 2, labHours: 3, yearLevel: 3, semester: "1st", category: "PC", prerequisite: "CC 225, CC 225 L" },
    { code: "CC 316", title: "Applications Development and Emerging Technologies", units: 5, lecHours: 2, labHours: 3, yearLevel: 3, semester: "1st", category: "CC", prerequisite: "CC 214, CC 214 L" },
    { code: "PC 329", title: "Capstone Project and Research 1", units: 3, lecHours: 3, labHours: 0, yearLevel: 3, semester: "2nd", category: "RESEARCH" },
    { code: "PC 3210", title: "Social and Professional Issues", units: 3, lecHours: 3, labHours: 0, yearLevel: 3, semester: "2nd", category: "PC" },
    { code: "PC 3211", title: "Information Assurance and Security 1 (Lec)", units: 2, lecHours: 2, labHours: 0, yearLevel: 3, semester: "2nd", category: "PC", prerequisite: "PC 315, PC 315 L" },
    { code: "PC 3211 L", title: "Information Assurance and Security 1 (Lab)", units: 9, lecHours: 0, labHours: 9, yearLevel: 3, semester: "2nd", category: "PC", prerequisite: "PC 315, PC 315 L" },
    { code: "AP 4", title: "iOS Mobile Application Development", units: 5, lecHours: 2, labHours: 3, yearLevel: 3, semester: "2nd", category: "AP", prerequisite: "PC 223" },
    { code: "AP 5", title: "Technology and the Application of the Internet of Things", units: 5, lecHours: 2, labHours: 3, yearLevel: 3, semester: "2nd", category: "AP", prerequisite: "CC 316" },
    // Fourth Year
    { code: "PC 4112", title: "Information Assurance and Security 2 (Lec)", units: 2, lecHours: 2, labHours: 0, yearLevel: 4, semester: "1st", category: "PC", prerequisite: "PC 3211, PC 3211 L" },
    { code: "PC 4112 L", title: "Information Assurance and Security 2 (Lab)", units: 9, lecHours: 0, labHours: 9, yearLevel: 4, semester: "1st", category: "PC", prerequisite: "PC 3211, PC 3211 L" },
    { code: "PC 4113", title: "Systems Administration and Maintenance", units: 5, lecHours: 2, labHours: 3, yearLevel: 4, semester: "1st", category: "PC", prerequisite: "PC 3211, PC 3211 L" },
    { code: "PC 4114", title: "Capstone Project and Research 2", units: 3, lecHours: 3, labHours: 0, yearLevel: 4, semester: "1st", category: "RESEARCH", prerequisite: "PC 329" },
    { code: "P Elec 4", title: "Systems Integration and Architecture 2", units: 5, lecHours: 2, labHours: 3, yearLevel: 4, semester: "1st", category: "PELEC", prerequisite: "CC 316" },
    { code: "AP 6", title: "Cross-Platform Script Development Technology", units: 5, lecHours: 2, labHours: 3, yearLevel: 4, semester: "1st", category: "AP", prerequisite: "CC 316, PC 3211, PC 3211 L" },
    { code: "PC 4215", title: "On-the-Job Training (OJT)", units: 9, lecHours: 0, labHours: 0, yearLevel: 4, semester: "2nd", category: "OJT" }
  ];

  for (const subject of bsitSubjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { ...subject, totalHours: subject.lecHours + subject.labHours },
      create: {
        ...subject,
        totalHours: subject.lecHours + subject.labHours,
        type: subject.category === "GEC" ? SubjectType.GEC : SubjectType.DEPARTMENTAL,
        college: subject.category === "GEC" ? "CAS" : "COTE",
        curriculum: "CMO No. 25 s. 2015 Effective as of A.Y. 2023-2024 BSIT August 2023 Revision: 0"
      }
    });
  }
}

async function createBSIESubjects(prisma, bsie) {
  const bsieSubjects = [
    // First Year 1st Sem
    { code: "IE-IPC 111", title: "Introduction to Engineering", units: 4, lecHours: 1, labHours: 3, yearLevel: 1, semester: "1st", category: "DEPARTMENTAL" },
    { code: "IE-AC 111", title: "Principles of Economics", units: 3, lecHours: 3, labHours: 0, yearLevel: 1, semester: "1st", category: "DEPARTMENTAL" },
    { code: "IE-TECH 111", title: "Pneumatics and Programmable Logic Controller", units: 9, lecHours: 0, labHours: 9, yearLevel: 1, semester: "1st", category: "DEPARTMENTAL" },
    { code: "EMATH 111", title: "Calculus 1", units: 5, lecHours: 5, labHours: 0, yearLevel: 1, semester: "1st", category: "DEPARTMENTAL" },
    { code: "ECHEM", title: "Chemistry for Engineering (lec)", units: 3, lecHours: 3, labHours: 0, yearLevel: 1, semester: "1st", category: "DEPARTMENTAL" },
    { code: "ECHEML", title: "Chemistry for Engineering (lab)", units: 3, lecHours: 0, labHours: 3, yearLevel: 1, semester: "1st", category: "DEPARTMENTAL" },
    { code: "BES-CFP", title: "Computer Fundamentals and Programming", units: 6, lecHours: 0, labHours: 6, yearLevel: 1, semester: "1st", category: "DEPARTMENTAL" },
    // Add more BSIE subjects as needed...
  ];

  for (const subject of bsieSubjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { ...subject, totalHours: subject.lecHours + subject.labHours },
      create: {
        ...subject,
        totalHours: subject.lecHours + subject.labHours,
        type: SubjectType.DEPARTMENTAL,
        college: "COTE",
        curriculum: "CMO No. 96, s. 2017 Effective as of A.Y. 2023-2024 BSIE August 2023 Revision: 0"
      }
    });
  }
}

async function createGECSubjects(prisma, cas) {
  const gecSubjects = [
    { code: "GEC-RPH", title: "Readings in Philippine History", units: 3, lecHours: 3, labHours: 0, category: "GEC" },
    { code: "GEC-MMW", title: "Mathematics in the Modern World", units: 3, lecHours: 3, labHours: 0, category: "GEC" },
    { code: "GEE-TEM", title: "The Entrepreneurial Mind", units: 3, lecHours: 3, labHours: 0, category: "GEE" },
    { code: "GEC-PC", title: "Purposive Communication", units: 3, lecHours: 3, labHours: 0, category: "GEC" },
    { code: "GEC-STS", title: "Science, Technology and Society", units: 3, lecHours: 3, labHours: 0, category: "GEC" },
    { code: "GEC-US", title: "Understanding the Self", units: 3, lecHours: 3, labHours: 0, category: "GEC" },
    { code: "GEE-GSPS", title: "Gender and Society with Peace Studies", units: 3, lecHours: 3, labHours: 0, category: "GEE" },
    { code: "GEC-E", title: "Ethics", units: 3, lecHours: 3, labHours: 0, category: "GEC" },
    { code: "GEE-ES", title: "Environmental Science", units: 3, lecHours: 3, labHours: 0, category: "GEE" },
    { code: "GEC-LWR", title: "Life and Works of Rizal", units: 3, lecHours: 3, labHours: 0, category: "GEC" },
    { code: "GEC-TCW", title: "The Contemporary World", units: 3, lecHours: 3, labHours: 0, category: "GEC" },
    { code: "GEE-LIE", title: "Living in the IT Era", units: 3, lecHours: 3, labHours: 0, category: "GEE" },
    { code: "GEE-FE", title: "Functional English", units: 3, lecHours: 3, labHours: 0, category: "GEE" },
    { code: "GEC-AA", title: "Art Appreciation", units: 3, lecHours: 3, labHours: 0, category: "GEC" },
    { code: "GEE-PEE", title: "People and the Earth's Ecosystems", units: 3, lecHours: 3, labHours: 0, category: "GEE" },
    // PATHFIT subjects
    { code: "PATHFit 1", title: "Physical Activities Towards Health and Fitness 1: Movement Competency Training", units: 2, lecHours: 2, labHours: 0, category: "PATHFIT" },
    { code: "PATHFit 2", title: "Physical Activities Towards Health and Fitness 2: Exercise-based Fitness Activities", units: 2, lecHours: 2, labHours: 0, category: "PATHFIT", prerequisite: "PATHFit 1" },
    { code: "PATHFit 3", title: "Physical Activities Towards Health and Fitness 3: Dance/Sports/Martial Arts", units: 2, lecHours: 2, labHours: 0, category: "PATHFIT", prerequisite: "PATHFit 1 and 2" },
    { code: "PATHFit 4", title: "Physical Activities Towards Health and Fitness 4: Sports Activities", units: 2, lecHours: 2, labHours: 0, category: "PATHFIT", prerequisite: "PATHFit 1 and 2" },
    // NSTP subjects
    { code: "NSTP 1", title: "National Service Training Program 1", units: 3, lecHours: 3, labHours: 0, category: "NSTP" },
    { code: "NSTP 2", title: "National Service Training Program 2", units: 3, lecHours: 3, labHours: 0, category: "NSTP", prerequisite: "NSTP 1" }
  ];

  for (const subject of gecSubjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { ...subject, totalHours: subject.lecHours + subject.labHours },
      create: {
        ...subject,
        totalHours: subject.lecHours + subject.labHours,
        type: SubjectType.GEC,
        college: "CAS"
      }
    });
  }
}

async function createRooms(prisma) {
  // BSIT department labs (auto-seed)
  await prisma.room.upsert({
    where: { code: "IT LAB 1" },
    update: {},
    create: { code: "IT LAB 1", building: "BSIT", floor: 1, capacity: 40, type: RoomType.LAB }
  });
  await prisma.room.upsert({
    where: { code: "IT LAB 2" },
    update: {},
    create: { code: "IT LAB 2", building: "BSIT", floor: 1, capacity: 40, type: RoomType.LAB }
  });
  await prisma.room.upsert({
    where: { code: "IT LAB 3" },
    update: {},
    create: { code: "IT LAB 3", building: "BSIT", floor: 2, capacity: 40, type: RoomType.LAB }
  });
  await prisma.room.upsert({
    where: { code: "IT LAB 4" },
    update: {},
    create: { code: "IT LAB 4", building: "BSIT", floor: 2, capacity: 40, type: RoomType.LAB }
  });

  // Electronics labs
  await prisma.room.upsert({
    where: { code: "ELEX LAB 1" },
    update: {},
    create: { code: "ELEX LAB 1", building: "Electronics", floor: 1, capacity: 30, type: RoomType.LAB }
  });
  await prisma.room.upsert({
    where: { code: "ELEX LAB 2" },
    update: {},
    create: { code: "ELEX LAB 2", building: "Electronics", floor: 2, capacity: 30, type: RoomType.LAB }
  });

  // Drafting labs
  await prisma.room.upsert({
    where: { code: "DRAFTING LAB 1" },
    update: {},
    create: { code: "DRAFTING LAB 1", building: "Drafting", floor: 1, capacity: 35, type: RoomType.LAB }
  });

  // Automotive labs
  await prisma.room.upsert({
    where: { code: "AUTO LAB 1" },
    update: {},
    create: { code: "AUTO LAB 1", building: "Automotive", floor: 1, capacity: 25, type: RoomType.LAB }
  });
  await prisma.room.upsert({
    where: { code: "AUTO LAB 2" },
    update: {},
    create: { code: "AUTO LAB 2", building: "Automotive", floor: 2, capacity: 25, type: RoomType.LAB }
  });

  // Garments labs
  await prisma.room.upsert({
    where: { code: "GARMENTS LAB 1" },
    update: {},
    create: { code: "GARMENTS LAB 1", building: "Garments", floor: 1, capacity: 30, type: RoomType.LAB }
  });

  // Lecture rooms
  await prisma.room.upsert({
    where: { code: "LR 101" },
    update: {},
    create: { code: "LR 101", building: "Main", floor: 1, capacity: 50, type: RoomType.LECTURE }
  });
  await prisma.room.upsert({
    where: { code: "LR 102" },
    update: {},
    create: { code: "LR 102", building: "Main", floor: 1, capacity: 50, type: RoomType.LECTURE }
  });
  await prisma.room.upsert({
    where: { code: "LR 201" },
    update: {},
    create: { code: "LR 201", building: "Main", floor: 2, capacity: 45, type: RoomType.LECTURE }
  });
  await prisma.room.upsert({
    where: { code: "LR 202" },
    update: {},
    create: { code: "LR 202", building: "Main", floor: 2, capacity: 45, type: RoomType.LECTURE }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
