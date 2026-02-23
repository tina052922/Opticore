/* eslint-disable no-console */
// Simple Prisma seed script for OptiCore (PostgreSQL).
// NOTE: Replace demo data with full CTU–Argao lists from your capstone docs.

const { PrismaClient, Role, SubjectType, RoomType, DayOfWeek } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding OptiCore database...");

  const passwordHash = await bcrypt.hash("password", 10);

  // Core colleges
  const cote = await prisma.college.upsert({
    where: { code: "COTE" },
    update: {},
    create: {
      code: "COTE",
      name: "College of Technology"
    }
  });

  const cafe = await prisma.college.upsert({
    where: { code: "CAFE" },
    update: {},
    create: {
      code: "CAFE",
      name: "College of Agriculture and Food Engineering"
    }
  });

  const coed = await prisma.college.upsert({
    where: { code: "COED" },
    update: {},
    create: {
      code: "COED",
      name: "College of Education"
    }
  });

  const cas = await prisma.college.upsert({
    where: { code: "CAS" },
    update: {},
    create: {
      code: "CAS",
      name: "College of Arts and Sciences"
    }
  });

  const chtm = await prisma.college.upsert({
    where: { code: "CHTM" },
    update: {},
    create: {
      code: "CHTM",
      name: "College of Hospitality and Tourism Management"
    }
  });

  // Programs / majors
  const bsit = await prisma.program.upsert({
    where: { code: "BSIT" },
    update: {},
    create: {
      code: "BSIT",
      name: "Bachelor of Science in Information Technology",
      collegeId: cote.id
    }
  });

  const bsie = await prisma.program.upsert({
    where: { code: "BSIE" },
    update: {},
    create: {
      code: "BSIE",
      name: "Bachelor of Science in Industrial Education",
      collegeId: cote.id
    }
  });

  const bitAuto = await prisma.program.upsert({
    where: { code: "BIT-AUTO" },
    update: {},
    create: {
      code: "BIT-AUTO",
      name: "Bachelor of Industrial Technology - Automotive",
      collegeId: cote.id
    }
  });

  const bitGarments = await prisma.program.upsert({
    where: { code: "BIT-GARM" },
    update: {},
    create: {
      code: "BIT-GARM",
      name: "Bachelor of Industrial Technology - Garments",
      collegeId: cote.id
    }
  });

  const bitCompTech = await prisma.program.upsert({
    where: { code: "BIT-COMPTECH" },
    update: {},
    create: {
      code: "BIT-COMPTECH",
      name: "Bachelor of Industrial Technology - Computer Technology",
      collegeId: cote.id
    }
  });

  const casGec = await prisma.program.upsert({
    where: { code: "CAS-GEC" },
    update: {},
    create: {
      code: "CAS-GEC",
      name: "CAS General Education Courses",
      collegeId: cas.id
    }
  });

  // Users with CTU-specific roles and scoping
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

  const bitCompTechChair = await prisma.user.upsert({
    where: { email: "chair.bitcomptech@ctu.edu.ph" },
    update: {},
    create: {
      email: "chair.bitcomptech@ctu.edu.ph",
      name: "BIT-CompTech Chairman Admin",
      role: Role.CHAIRMAN_ADMIN,
      collegeId: cote.id,
      programId: bitCompTech.id,
      passwordHash
    }
  });

  const instructor1 = await prisma.user.upsert({
    where: { email: "almirante.a@ctu.edu.ph" },
    update: {},
    create: {
      email: "almirante.a@ctu.edu.ph",
      name: "Almirante, A",
      role: Role.INSTRUCTOR,
      collegeId: cote.id,
      programId: bsit.id,
      passwordHash
    }
  });

  const instructor2 = await prisma.user.upsert({
    where: { email: "geldore.jd@ctu.edu.ph" },
    update: {},
    create: {
      email: "geldore.jd@ctu.edu.ph",
      name: "Geldore, JD",
      role: Role.INSTRUCTOR,
      collegeId: cas.id,
      programId: casGec.id,
      passwordHash
    }
  });

  // Aliases to match existing demo data below
  // (chairs/admins can still have teaching profiles in this seed)
  const faculty1 = instructor1;
  const faculty2 = instructor2;
  const faculty3 = coteAdmin;
  const faculty4 = bsitChair;
  const faculty5 = bitCompTechChair;

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

  // Academic period (current)
  const currentPeriod = await prisma.academicPeriod.upsert({
    where: {
      // simple fixed key
      id: "CURRENT_PERIOD_1"
    },
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

  // BSIT 1A–4A and 1B–4B (sections now tied to Program)
  const bsit1a = await prisma.section.upsert({
    where: { programId_name: { programId: bsit.id, name: "1A" } },
    update: {},
    create: {
      programId: bsit.id,
      name: "1A",
      yearLevel: 1,
      studentCount: 40
    }
  });

  const bsit1b = await prisma.section.upsert({
    where: { programId_name: { programId: bsit.id, name: "1B" } },
    update: {},
    create: {
      programId: bsit.id,
      name: "1B",
      yearLevel: 1,
      studentCount: 40
    }
  });

  const bsit2a = await prisma.section.upsert({
    where: { programId_name: { programId: bsit.id, name: "2A" } },
    update: {},
    create: {
      programId: bsit.id,
      name: "2A",
      yearLevel: 2,
      studentCount: 40
    }
  });

  const bsit2b = await prisma.section.upsert({
    where: { programId_name: { programId: bsit.id, name: "2B" } },
    update: {},
    create: {
      programId: bsit.id,
      name: "2B",
      yearLevel: 2,
      studentCount: 40
    }
  });

  const bsit3a = await prisma.section.upsert({
    where: { programId_name: { programId: bsit.id, name: "3A" } },
    update: {},
    create: {
      programId: bsit.id,
      name: "3A",
      yearLevel: 3,
      studentCount: 35
    }
  });

  // Link demo student to BSIT 3A section for personal timetable
  await prisma.user.update({
    where: { email: "student.bsit3a@ctu.edu.ph" },
    data: { sectionId: bsit3a.id }
  });

  const bsit3b = await prisma.section.upsert({
    where: { programId_name: { programId: bsit.id, name: "3B" } },
    update: {},
    create: {
      programId: bsit.id,
      name: "3B",
      yearLevel: 3,
      studentCount: 32
    }
  });

  const bsit4a = await prisma.section.upsert({
    where: { programId_name: { programId: bsit.id, name: "4A" } },
    update: {},
    create: {
      programId: bsit.id,
      name: "4A",
      yearLevel: 4,
      studentCount: 40
    }
  });

  const bsit4b = await prisma.section.upsert({
    where: { programId_name: { programId: bsit.id, name: "4B" } },
    update: {},
    create: {
      programId: bsit.id,
      name: "4B",
      yearLevel: 4,
      studentCount: 40
    }
  });

  // BIT-AUTO 1A–4B
  const bit1a = await prisma.section.upsert({
    where: { programId_name: { programId: bitAuto.id, name: "1A" } },
    update: {},
    create: {
      programId: bitAuto.id,
      name: "1A",
      yearLevel: 1,
      studentCount: 40
    }
  });

  const bit1b = await prisma.section.upsert({
    where: { programId_name: { programId: bitAuto.id, name: "1B" } },
    update: {},
    create: {
      programId: bitAuto.id,
      name: "1B",
      yearLevel: 1,
      studentCount: 40
    }
  });

  const bit2a = await prisma.section.upsert({
    where: { programId_name: { programId: bitAuto.id, name: "2A" } },
    update: {},
    create: {
      programId: bitAuto.id,
      name: "2A",
      yearLevel: 2,
      studentCount: 40
    }
  });

  const bit2b = await prisma.section.upsert({
    where: { programId_name: { programId: bitAuto.id, name: "2B" } },
    update: {},
    create: {
      programId: bitAuto.id,
      name: "2B",
      yearLevel: 2,
      studentCount: 40
    }
  });

  const bit3a = await prisma.section.upsert({
    where: { programId_name: { programId: bitAuto.id, name: "3A" } },
    update: {},
    create: {
      programId: bitAuto.id,
      name: "3A",
      yearLevel: 3,
      studentCount: 40
    }
  });

  const bit3b = await prisma.section.upsert({
    where: { programId_name: { programId: bitAuto.id, name: "3B" } },
    update: {},
    create: {
      programId: bitAuto.id,
      name: "3B",
      yearLevel: 3,
      studentCount: 40
    }
  });

  const bit4a = await prisma.section.upsert({
    where: { programId_name: { programId: bitAuto.id, name: "4A" } },
    update: {},
    create: {
      programId: bitAuto.id,
      name: "4A",
      yearLevel: 4,
      studentCount: 40
    }
  });

  const bit4b = await prisma.section.upsert({
    where: { programId_name: { programId: bitAuto.id, name: "4B" } },
    update: {},
    create: {
      programId: bitAuto.id,
      name: "4B",
      yearLevel: 4,
      studentCount: 40
    }
  });

  // Subjects (sample third-year + GEC/core using your examples)
  const dtech122 = await prisma.subject.upsert({
    where: { code: "DTECH 122" },
    update: {},
    create: {
      code: "DTECH 122",
      title: "Digital Technology 2",
      units: 3,
      lecHours: 2,
      labHours: 3,
      type: SubjectType.DEPARTMENTAL,
      college: "CIT",
      prerequisite: "DTECH 121"
    }
  });

  const draw122 = await prisma.subject.upsert({
    where: { code: "DRAW 122" },
    update: {},
    create: {
      code: "DRAW 122",
      title: "Engineering Drawing 2",
      units: 3,
      lecHours: 2,
      labHours: 3,
      type: SubjectType.DEPARTMENTAL,
      college: "CIT",
      prerequisite: "DRAW 121"
    }
  });

  const comp1 = await prisma.subject.upsert({
    where: { code: "COMP 1" },
    update: {},
    create: {
      code: "COMP 1",
      title: "Introduction to Computing",
      units: 3,
      lecHours: 3,
      labHours: 0,
      type: SubjectType.DEPARTMENTAL,
      college: "CIT",
      prerequisite: null
    }
  });

  const ast122 = await prisma.subject.upsert({
    where: { code: "AST 122" },
    update: {},
    create: {
      code: "AST 122",
      title: "Applied Science and Technology 2",
      units: 3,
      lecHours: 3,
      labHours: 0,
      type: SubjectType.DEPARTMENTAL,
      college: "CIT",
      prerequisite: "AST 121"
    }
  });

  const gecRph = await prisma.subject.upsert({
    where: { code: "GEC-RPH" },
    update: {},
    create: {
      code: "GEC-RPH",
      title: "Readings in Philippine History",
      units: 3,
      lecHours: 3,
      labHours: 0,
      type: SubjectType.GEC,
      college: "CAS",
      prerequisite: null
    }
  });

  const psychElfc = await prisma.subject.upsert({
    where: { code: "PSYCH-ELFC 6" },
    update: {},
    create: {
      code: "PSYCH-ELFC 6",
      title: "Current Issues in Psychology",
      units: 3,
      lecHours: 3,
      labHours: 0,
      type: SubjectType.GEC,
      college: "CAS",
      prerequisite: null
    }
  });

  const pathfit = await prisma.subject.upsert({
    where: { code: "PATHFIT" },
    update: {},
    create: {
      code: "PATHFIT",
      title: "Physical Activities Toward Health and Fitness",
      units: 2,
      lecHours: 1,
      labHours: 2,
      type: SubjectType.GEC,
      college: "CAS",
      prerequisite: null
    }
  });

  // Faculty profiles (use join table for canTeach)
  const faculty1Profile = await prisma.facultyProfile.upsert({
    where: { userId: faculty1.id },
    update: {
      fullName: "Roselyn T. Albacite",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "BSIT Faculty"
    },
    create: {
      userId: faculty1.id,
      fullName: "Roselyn T. Albacite",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "BSIT Faculty"
    }
  });

  const faculty2Profile = await prisma.facultyProfile.upsert({
    where: { userId: faculty2.id },
    update: {
      fullName: "Jethro Dave P. Geldore",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "CAS GEC Faculty"
    },
    create: {
      userId: faculty2.id,
      fullName: "Jethro Dave P. Geldore",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "CAS GEC Faculty"
    }
  });

  const faculty3Profile = await prisma.facultyProfile.upsert({
    where: { userId: faculty3.id },
    update: {
      fullName: "George Tangaro",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "College SuperAdmin"
    },
    create: {
      userId: faculty3.id,
      fullName: "George Tangaro",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "College SuperAdmin"
    }
  });

  const faculty4Profile = await prisma.facultyProfile.upsert({
    where: { userId: faculty4.id },
    update: {
      fullName: "Abapo, Iris C.",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "BIT Faculty"
    },
    create: {
      userId: faculty4.id,
      fullName: "Abapo, Iris C.",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "BIT Faculty"
    }
  });

  const faculty5Profile = await prisma.facultyProfile.upsert({
    where: { userId: faculty5.id },
    update: {
      fullName: "Otadoy, Edgar B.",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "BIT Faculty"
    },
    create: {
      userId: faculty5.id,
      fullName: "Otadoy, Edgar B.",
      bsDegree: "Bachelor of Science in Industrial Technology (Major 1)",
      msDegree: null,
      status: "FULLTIME",
      designation: "BIT Faculty"
    }
  });

  await prisma.facultyCanTeach.createMany({
    data: [
      { facultyProfileId: faculty1Profile.id, subjectId: dtech122.id },
      { facultyProfileId: faculty1Profile.id, subjectId: draw122.id },
      { facultyProfileId: faculty1Profile.id, subjectId: comp1.id },
      { facultyProfileId: faculty2Profile.id, subjectId: gecRph.id },
      { facultyProfileId: faculty2Profile.id, subjectId: psychElfc.id },
      { facultyProfileId: faculty2Profile.id, subjectId: pathfit.id },
      { facultyProfileId: faculty3Profile.id, subjectId: ast122.id },
      { facultyProfileId: faculty4Profile.id, subjectId: comp1.id },
      { facultyProfileId: faculty5Profile.id, subjectId: dtech122.id }
    ],
    skipDuplicates: true
  });

  // Rooms (DT and CT labs – multiple)
  const dtLab1 = await prisma.room.upsert({
    where: { code: "DT Lab1" },
    update: {},
    create: {
      code: "DT Lab1",
      building: "DT",
      floor: 1,
      capacity: 40,
      type: RoomType.LAB
    }
  });

  const dtLab2 = await prisma.room.upsert({
    where: { code: "DT Lab2" },
    update: {},
    create: {
      code: "DT Lab2",
      building: "DT",
      floor: 2,
      capacity: 40,
      type: RoomType.LAB
    }
  });

  const dtLab3 = await prisma.room.upsert({
    where: { code: "DT Lab3" },
    update: {},
    create: {
      code: "DT Lab3",
      building: "DT",
      floor: 3,
      capacity: 40,
      type: RoomType.LAB
    }
  });

  const ctLab1 = await prisma.room.upsert({
    where: { code: "CT Lab1" },
    update: {},
    create: {
      code: "CT Lab1",
      building: "CT",
      floor: 1,
      capacity: 40,
      type: RoomType.LAB
    }
  });

  const ctLab2 = await prisma.room.upsert({
    where: { code: "CT Lab2" },
    update: {},
    create: {
      code: "CT Lab2",
      building: "CT",
      floor: 2,
      capacity: 40,
      type: RoomType.LAB
    }
  });

  const cl1 = await prisma.room.upsert({
    where: { code: "CL1" },
    update: {},
    create: { code: "CL1", building: "Main", floor: 1, capacity: 40, type: RoomType.LECTURE }
  });
  const cl3 = await prisma.room.upsert({
    where: { code: "CL3" },
    update: {},
    create: { code: "CL3", building: "Main", floor: 1, capacity: 40, type: RoomType.LECTURE }
  });
  const cl4 = await prisma.room.upsert({
    where: { code: "CL4" },
    update: {},
    create: { code: "CL4", building: "Main", floor: 1, capacity: 40, type: RoomType.LECTURE }
  });
  const st202 = await prisma.room.upsert({
    where: { code: "ST 202" },
    update: {},
    create: { code: "ST 202", building: "ST", floor: 2, capacity: 40, type: RoomType.LECTURE }
  });

  // Sample schedules using predefined slots (07:00–12:00, 12:00–17:00, 17:00–21:00)
  await prisma.schedule.createMany({
    data: [
      {
        subjectId: dtech122.id,
        instructorId: faculty1.id,
        sectionId: bsit3a.id,
        roomId: dtLab1.id,
        day: DayOfWeek.MONDAY,
        startTime: "07:00",
        endTime: "12:00",
        status: "APPROVED",
        semester: "1st",
        academicYear: "2025-2026"
      },
      {
        subjectId: draw122.id,
        instructorId: faculty1.id,
        sectionId: bsit3b.id,
        roomId: dtLab2.id,
        day: DayOfWeek.TUESDAY,
        startTime: "12:00",
        endTime: "17:00",
        status: "APPROVED",
        semester: "1st",
        academicYear: "2025-2026"
      },
      {
        subjectId: comp1.id,
        instructorId: faculty2.id,
        sectionId: bsit1a.id,
        roomId: ctLab1.id,
        day: DayOfWeek.WEDNESDAY,
        startTime: "07:00",
        endTime: "12:00",
        status: "APPROVED",
        semester: "1st",
        academicYear: "2025-2026"
      },
      {
        subjectId: gecRph.id,
        instructorId: faculty2.id,
        sectionId: bsit1b.id,
        roomId: ctLab2.id,
        day: DayOfWeek.THURSDAY,
        startTime: "12:00",
        endTime: "17:00",
        status: "APPROVED",
        semester: "1st",
        academicYear: "2025-2026"
      },
      {
        subjectId: psychElfc.id,
        instructorId: faculty2.id,
        sectionId: bit3a.id,
        roomId: dtLab3.id,
        day: DayOfWeek.FRIDAY,
        startTime: "17:00",
        endTime: "21:00",
        status: "APPROVED",
        semester: "1st",
        academicYear: "2025-2026"
      },
      {
        subjectId: pathfit.id,
        instructorId: faculty4.id,
        sectionId: bit1a.id,
        roomId: dtLab1.id,
        day: DayOfWeek.SATURDAY,
        startTime: "07:00",
        endTime: "12:00",
        status: "APPROVED",
        semester: "1st",
        academicYear: "2025-2026"
      }
    ]
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

