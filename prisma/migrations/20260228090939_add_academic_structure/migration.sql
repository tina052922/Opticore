/*
  Warnings:

  - Added the required column `hourlyRate` to the `FacultyProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rank` to the `FacultyProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalHours` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "TeachingAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instructorId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "assignedUnits" REAL NOT NULL,
    "lectureHours" REAL NOT NULL,
    "labHours" REAL NOT NULL,
    "totalHours" REAL NOT NULL,
    "preparationHours" INTEGER NOT NULL DEFAULT 1,
    "isOverload" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeachingAssignment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeachingAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeachingAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeachingAssignment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "FacultyProfile" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OverloadJustification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instructorId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "totalUnits" REAL NOT NULL,
    "standardLoad" REAL NOT NULL,
    "excessUnits" REAL NOT NULL,
    "justification" TEXT NOT NULL,
    "supportingDoc" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OverloadJustification_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrossCollegeChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedBy" TEXT NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "scheduleId" TEXT,
    "changeType" TEXT NOT NULL,
    "subjectCode" TEXT,
    "sectionName" TEXT,
    "roomCode" TEXT,
    "timeSlot" TEXT,
    "instructor" TEXT,
    "reason" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "proposedSolution" TEXT,
    "hasConflicts" BOOLEAN NOT NULL DEFAULT false,
    "conflictDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrossCollegeChangeRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CrossCollegeChangeRequest_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CrossCollegeChangeRequest_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FacultyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "bsDegree" TEXT NOT NULL,
    "msDegree" TEXT,
    "phdDegree" TEXT,
    "status" TEXT NOT NULL,
    "designation" TEXT,
    "rank" TEXT NOT NULL,
    "experience" INTEGER,
    "trainingHours" INTEGER,
    "eligibility" TEXT,
    "hourlyRate" REAL NOT NULL,
    "standardLoad" INTEGER NOT NULL DEFAULT 24,
    "maxPreparations" INTEGER NOT NULL DEFAULT 3,
    CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FacultyProfile" ("bsDegree", "designation", "fullName", "id", "msDegree", "status", "userId") SELECT "bsDegree", "designation", "fullName", "id", "msDegree", "status", "userId" FROM "FacultyProfile";
DROP TABLE "FacultyProfile";
ALTER TABLE "new_FacultyProfile" RENAME TO "FacultyProfile";
CREATE UNIQUE INDEX "FacultyProfile_userId_key" ON "FacultyProfile"("userId");
CREATE TABLE "new_Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "units" REAL NOT NULL,
    "lecHours" REAL NOT NULL,
    "labHours" REAL NOT NULL,
    "totalHours" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'DEPARTMENTAL',
    "college" TEXT,
    "prerequisite" TEXT,
    "yearLevel" INTEGER,
    "semester" TEXT,
    "curriculum" TEXT
);
INSERT INTO "new_Subject" ("code", "college", "id", "labHours", "lecHours", "prerequisite", "title", "type", "units") SELECT "code", "college", "id", "labHours", "lecHours", "prerequisite", "title", "type", "units" FROM "Subject";
DROP TABLE "Subject";
ALTER TABLE "new_Subject" RENAME TO "Subject";
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TeachingAssignment_instructorId_subjectId_sectionId_semester_academicYear_key" ON "TeachingAssignment"("instructorId", "subjectId", "sectionId", "semester", "academicYear");
