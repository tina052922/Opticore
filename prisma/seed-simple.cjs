/* eslint-disable no-console */
// Simple Prisma seed script for OptiCore (SQLite compatible)

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
    update: {},
    create: {
      email: "visitor@ctu.edu.ph",
      name: "Campus Visitor",
      role: Role.VISITOR,
      passwordHash
    }
  });

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

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
