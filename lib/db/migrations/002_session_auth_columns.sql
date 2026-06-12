-- Better Auth requires ipAddress and userAgent on session
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
