/* eslint-disable no-console */
// Simple Prisma seed script for OptiCore (SQLite).
// NOTE: Replace demo data with full CTU–Argao lists from your capstone docs.

const { PrismaClient, Role, SubjectType, RoomType, DayOfWeek } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding OptiCore database...");

  const passwordHash = await bcrypt.hash("password", 10);

  // Users with roles
  const superSuperAdmin = await prisma.user.upsert({
    where: { email: "supersuperadmin@ctu.edu.ph" },
    update: {},
    create: {
      email: "supersuperadmin@ctu.edu.ph",
      name: "CTU SuperSuper Admin",
      role: Role.SUPERSUPERADMIN,
      passwordHash
    }
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@ctu.edu.ph" },
    update: {},
    create: {
      email: "superadmin@ctu.edu.ph",
      name: "CTU College SuperAdmin (G. Tangaro)",
      role: Role.SUPERADMIN,
      passwordHash
    }
  });

  const deptAdmin = await prisma.user.upsert({
    where: { email: "bsit.admin@ctu.edu.ph" },
    update: {},
    create: {
      email: "bsit.admin@ctu.edu.ph",
      name: "BSIT Department Admin (R. Albacite)",
      role: Role.DEPTADMIN,
      passwordHash
    }
  });

  const casAdmin = await prisma.user.upsert({
    where: { email: "cas.admin@ctu.edu.ph" },
    update: {},
    create: {
      email: "cas.admin@ctu.edu.ph",
      name: "CAS Admin (J.D. Geldore)",
      role: Role.CASADMIN,
      passwordHash
    }
  });

  const faculty1 = await prisma.user.upsert({
    where: { email: "almirante.a@ctu.edu.ph" },
    update: {},
    create: {
      email: "almirante.a@ctu.edu.ph",
      name: "Almirante, A",
      role: Role.FACULTY,
      passwordHash
    }
  });

  const faculty2 = await prisma.user.upsert({
    where: { email: "albarracin.cs@ctu.edu.ph" },
    update: {},
    create: {
      email: "albarracin.cs@ctu.edu.ph",
      name: "Albarracin, CS",
      role: Role.FACULTY,
      passwordHash
    }
  });

  const faculty3 = await prisma.user.upsert({
    where: { email: "gealon.c@ctu.edu.ph" },
    update: {},
    create: {
      email: "gealon.c@ctu.edu.ph",
      name: "Gealon, C",
      role: Role.FACULTY,
      passwordHash
    }
  });

  const faculty4 = await prisma.user.upsert({
    where: { email: "abapo.i@ctu.edu.ph" },
    update: {},
    create: {
      email: "abapo.i@ctu.edu.ph",
      name: "Abapo, I",
      role: Role.FACULTY,
      passwordHash
    }
  });

  const faculty5 = await prisma.user.upsert({
    where: { email: "otadoy.e@ctu.edu.ph" },
    update: {},
    create: {
      email: "otadoy.e@ctu.edu.ph",
      name: "Otadoy, E",
      role: Role.FACULTY,
      passwordHash
    }
  });

  const student = await prisma.user.upsert({
    where: { email: "student.bsit3a@ctu.edu.ph" },
    update: {},
    create: {
      email: "student.bsit3a@ctu.edu.ph",
      name: "BSIT 3A Student",
      role: Role.STUDENT,
      passwordHash: null
    }
  });

  // Majors & sections (extended using your examples)
  const bsit = await prisma.major.upsert({
    where: { code: "BSIT" },
    update: {},
    create: {
      code: "BSIT",
      name: "Bachelor of Science in Information Technology"
    }
  });

  const bit = await prisma.major.upsert({
    where: { code: "BIT" },
    update: {},
    create: {
      code: "BIT",
      name: "Bachelor of Industrial Technology"
    }
  });

  // BSIT 1A–4A and 1B–4B
  const bsit1a = await prisma.section.upsert({
    where: { majorId_name: { majorId: bsit.id, name: "1A" } },
    update: {},
    create: {
      majorId: bsit.id,
      name: "1A",
      yearLevel: 1,
      studentCount: 40
    }
  });

  const bsit1b = await prisma.section.upsert({
    where: { majorId_name: { majorId: bsit.id, name: "1B" } },
    update: {},
    create: {
      majorId: bsit.id,
      name: "1B",
      yearLevel: 1,
      studentCount: 40
    }
  });

  const bsit2a = await prisma.section.upsert({
    where: { majorId_name: { majorId: bsit.id, name: "2A" } },
    update: {},
    create: {
      majorId: bsit.id,
      name: "2A",
      yearLevel: 2,
      studentCount: 40
    }
  });

  const bsit2b = await prisma.section.upsert({
    where: { majorId_name: { majorId: bsit.id, name: "2B" } },
    update: {},
    create: {
      majorId: bsit.id,
      name: "2B",
      yearLevel: 2,
      studentCount: 40
    }
  });

  const bsit3a = await prisma.section.upsert({
    where: { majorId_name: { majorId: bsit.id, name: "3A" } },
    update: {},
    create: {
      majorId: bsit.id,
      name: "3A",
      yearLevel: 3,
      studentCount: 35
    }
  });

  const bsit3b = await prisma.section.upsert({
    where: { majorId_name: { majorId: bsit.id, name: "3B" } },
    update: {},
    create: {
      majorId: bsit.id,
      name: "3B",
      yearLevel: 3,
      studentCount: 32
    }
  });

  const bsit4a = await prisma.section.upsert({
    where: { majorId_name: { majorId: bsit.id, name: "4A" } },
    update: {},
    create: {
      majorId: bsit.id,
      name: "4A",
      yearLevel: 4,
      studentCount: 40
    }
  });

  const bsit4b = await prisma.section.upsert({
    where: { majorId_name: { majorId: bsit.id, name: "4B" } },
    update: {},
    create: {
      majorId: bsit.id,
      name: "4B",
      yearLevel: 4,
      studentCount: 40
    }
  });

  // BIT 1A–4B
  const bit1a = await prisma.section.upsert({
    where: { majorId_name: { majorId: bit.id, name: "1A" } },
    update: {},
    create: {
      majorId: bit.id,
      name: "1A",
      yearLevel: 1,
      studentCount: 40
    }
  });

  const bit1b = await prisma.section.upsert({
    where: { majorId_name: { majorId: bit.id, name: "1B" } },
    update: {},
    create: {
      majorId: bit.id,
      name: "1B",
      yearLevel: 1,
      studentCount: 40
    }
  });

  const bit2a = await prisma.section.upsert({
    where: { majorId_name: { majorId: bit.id, name: "2A" } },
    update: {},
    create: {
      majorId: bit.id,
      name: "2A",
      yearLevel: 2,
      studentCount: 40
    }
  });

  const bit2b = await prisma.section.upsert({
    where: { majorId_name: { majorId: bit.id, name: "2B" } },
    update: {},
    create: {
      majorId: bit.id,
      name: "2B",
      yearLevel: 2,
      studentCount: 40
    }
  });

  const bit3a = await prisma.section.upsert({
    where: { majorId_name: { majorId: bit.id, name: "3A" } },
    update: {},
    create: {
      majorId: bit.id,
      name: "3A",
      yearLevel: 3,
      studentCount: 40
    }
  });

  const bit3b = await prisma.section.upsert({
    where: { majorId_name: { majorId: bit.id, name: "3B" } },
    update: {},
    create: {
      majorId: bit.id,
      name: "3B",
      yearLevel: 3,
      studentCount: 40
    }
  });

  const bit4a = await prisma.section.upsert({
    where: { majorId_name: { majorId: bit.id, name: "4A" } },
    update: {},
    create: {
      majorId: bit.id,
      name: "4A",
      yearLevel: 4,
      studentCount: 40
    }
  });

  const bit4b = await prisma.section.upsert({
    where: { majorId_name: { majorId: bit.id, name: "4B" } },
    update: {},
    create: {
      majorId: bit.id,
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

