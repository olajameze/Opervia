-- AlterTable Client
ALTER TABLE "Client" ADD COLUMN "notes" TEXT;

-- AlterTable Job
ALTER TABLE "Job" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN "endsAt" TIMESTAMP(3);

UPDATE "Job" SET "startsAt" = "scheduledAt", "endsAt" = "scheduledAt" WHERE "scheduledAt" IS NOT NULL;

-- AlterTable Shift
ALTER TABLE "Shift" ADD COLUMN "jobId" TEXT;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Assignment
ALTER TABLE "Assignment" ADD COLUMN "startTime" TIMESTAMP(3);
ALTER TABLE "Assignment" ADD COLUMN "endTime" TIMESTAMP(3);
