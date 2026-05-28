-- Opervia PDF changes migration

-- StaffProfile: location, remove hourlyRate
ALTER TABLE "StaffProfile" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "StaffProfile" DROP COLUMN IF EXISTS "hourlyRate";

-- FreelancerProfile: location, rename hourlyRate to dayRate
ALTER TABLE "FreelancerProfile" ADD COLUMN IF NOT EXISTS "location" TEXT;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'FreelancerProfile' AND column_name = 'hourlyRate'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'FreelancerProfile' AND column_name = 'dayRate'
  ) THEN
    ALTER TABLE "FreelancerProfile" RENAME COLUMN "hourlyRate" TO "dayRate";
  END IF;
END $$;

-- Equipment quantity
ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "totalQuantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "EquipmentAllocation" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;

-- SkillCatalog
CREATE TABLE IF NOT EXISTS "SkillCatalog" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SkillCatalog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SkillCatalog_organizationId_name_key" ON "SkillCatalog"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "SkillCatalog_organizationId_idx" ON "SkillCatalog"("organizationId");
ALTER TABLE "SkillCatalog" DROP CONSTRAINT IF EXISTS "SkillCatalog_organizationId_fkey";
ALTER TABLE "SkillCatalog" ADD CONSTRAINT "SkillCatalog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WorkforceDocument
CREATE TABLE IF NOT EXISTS "WorkforceDocument" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "blobUrl" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "organizationId" TEXT NOT NULL,
  "staffProfileId" TEXT,
  "freelancerProfileId" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkforceDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "WorkforceDocument_organizationId_idx" ON "WorkforceDocument"("organizationId");
CREATE INDEX IF NOT EXISTS "WorkforceDocument_staffProfileId_idx" ON "WorkforceDocument"("staffProfileId");
CREATE INDEX IF NOT EXISTS "WorkforceDocument_freelancerProfileId_idx" ON "WorkforceDocument"("freelancerProfileId");

-- Availability
CREATE TYPE "AvailabilityResponseStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

CREATE TABLE IF NOT EXISTS "AvailabilityRequest" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requiredSkills" TEXT[],
  "message" TEXT,
  CONSTRAINT "AvailabilityRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AvailabilityRequest_token_key" ON "AvailabilityRequest"("token");
CREATE INDEX IF NOT EXISTS "AvailabilityRequest_organizationId_idx" ON "AvailabilityRequest"("organizationId");
CREATE INDEX IF NOT EXISTS "AvailabilityRequest_jobId_idx" ON "AvailabilityRequest"("jobId");

CREATE TABLE IF NOT EXISTS "AvailabilityResponse" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "freelancerProfileId" TEXT NOT NULL,
  "status" "AvailabilityResponseStatus" NOT NULL,
  "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvailabilityResponse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AvailabilityResponse_requestId_freelancerProfileId_key" ON "AvailabilityResponse"("requestId", "freelancerProfileId");

CREATE INDEX IF NOT EXISTS "Equipment_organizationId_name_idx" ON "Equipment"("organizationId", "name");
