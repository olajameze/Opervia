-- Idempotent patch for databases that existed before MFA fields were added.
-- Fresh installs receive these columns from 20250522120000_init; IF NOT EXISTS keeps this safe.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpEnabledAt" TIMESTAMP(3);
