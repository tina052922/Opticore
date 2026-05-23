-- AlterTable
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "registrationOtp" TEXT;
ALTER TABLE "User" ADD COLUMN "registrationOtpExpires" DATETIME;

-- AlterTable
ALTER TABLE "ScheduleChangeRequest" ADD COLUMN "newDay" TEXT;
ALTER TABLE "ScheduleChangeRequest" ADD COLUMN "conflictsResolved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScheduleChangeRequest" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
