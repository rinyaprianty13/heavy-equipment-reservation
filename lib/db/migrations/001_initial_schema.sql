-- EMCL Heavy Equipment Reservation System
-- Schema extracted from v0 project (heavy-equipment-reservation-lvhoBnery9w)
-- PostgreSQL-compatible version

-- Better Auth Tables
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);

-- User Roles and Permissions
CREATE TABLE IF NOT EXISTS "user_role" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL CHECK (role IN ('REQUESTOR', 'APPROVER', 'ADMIN')),
  "equipmentType" TEXT,
  "site" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "role", "equipmentType", "site")
);

-- Equipment Inventory
CREATE TABLE IF NOT EXISTS "equipment" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL CHECK (type IN ('CRANE', 'FORKLIFT', 'MANLIFT', 'OTHER')),
  "description" TEXT,
  "site" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'MAINTENANCE', 'RETIRED')) DEFAULT 'AVAILABLE',
  "capacity" INTEGER,
  "capacityUnit" TEXT,
  "lastMaintenanceDate" TIMESTAMP,
  "nextMaintenanceDate" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id")
);

-- Equipment Availability Windows
CREATE TABLE IF NOT EXISTS "equipment_availability" (
  "id" TEXT PRIMARY KEY,
  "equipmentId" TEXT NOT NULL REFERENCES "equipment"("id") ON DELETE CASCADE,
  "dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6),
  "startTime" TIME NOT NULL,
  "endTime" TIME NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("equipmentId", "dayOfWeek")
);

-- Reservation Requests
CREATE TABLE IF NOT EXISTS "reservation" (
  "id" TEXT PRIMARY KEY,
  "requestNumber" TEXT NOT NULL UNIQUE,
  "equipmentId" TEXT NOT NULL REFERENCES "equipment"("id"),
  "requestorId" TEXT NOT NULL REFERENCES "user"("id"),
  "approverId" TEXT REFERENCES "user"("id"),
  "status" TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')) DEFAULT 'PENDING',
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "purpose" TEXT NOT NULL,
  "costCode" TEXT,
  "notes" TEXT,
  "approvalDate" TIMESTAMP,
  "approvalNotes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Conflict Detection Log
CREATE TABLE IF NOT EXISTS "reservation_conflict" (
  "id" TEXT PRIMARY KEY,
  "reservationId" TEXT NOT NULL REFERENCES "reservation"("id") ON DELETE CASCADE,
  "conflictingReservationId" TEXT NOT NULL REFERENCES "reservation"("id") ON DELETE CASCADE,
  "overlapType" TEXT NOT NULL CHECK ("overlapType" IN ('FULL_OVERLAP', 'PARTIAL_OVERLAP', 'ADJACENT')),
  "detectedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "resolution" TEXT,
  UNIQUE("reservationId", "conflictingReservationId")
);

-- Alternative Equipment Suggestions
CREATE TABLE IF NOT EXISTS "alternative_equipment" (
  "id" TEXT PRIMARY KEY,
  "originalReservationId" TEXT NOT NULL REFERENCES "reservation"("id") ON DELETE CASCADE,
  "suggestedEquipmentId" TEXT NOT NULL REFERENCES "equipment"("id"),
  "availableStartDate" TIMESTAMP NOT NULL,
  "availableEndDate" TIMESTAMP NOT NULL,
  "suggestedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP
);

-- Approval Audit Trail
CREATE TABLE IF NOT EXISTS "approval_audit" (
  "id" TEXT PRIMARY KEY,
  "reservationId" TEXT NOT NULL REFERENCES "reservation"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'REASSIGNED', 'CANCELLED', 'COMPLETED')),
  "actorId" TEXT NOT NULL REFERENCES "user"("id"),
  "oldStatus" TEXT,
  "newStatus" TEXT NOT NULL,
  "comments" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS "notification_preference" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
  "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
  "phoneNumber" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification Queue
CREATE TABLE IF NOT EXISTS "notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "reservationId" TEXT REFERENCES "reservation"("id") ON DELETE SET NULL,
  "type" TEXT NOT NULL CHECK (type IN ('APPROVAL_PENDING', 'APPROVED', 'REJECTED', 'CONFLICT_DETECTED', 'REMINDER', 'REASSIGNED')),
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED')) DEFAULT 'PENDING',
  "sentAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_dates ON "reservation" ("equipmentId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_requestor ON "reservation" ("requestorId");
CREATE INDEX IF NOT EXISTS idx_status ON "reservation" ("status");
CREATE INDEX IF NOT EXISTS idx_dates ON "reservation" ("startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_reservation_approver ON "reservation" ("approverId");
CREATE INDEX IF NOT EXISTS idx_audit_reservation ON "approval_audit" ("reservationId");
CREATE INDEX IF NOT EXISTS idx_audit_actor ON "approval_audit" ("actorId");
CREATE INDEX IF NOT EXISTS idx_notification_user ON "notification" ("userId");
CREATE INDEX IF NOT EXISTS idx_notification_status ON "notification" ("status");
CREATE INDEX IF NOT EXISTS idx_equipment_site ON "equipment" ("site");
CREATE INDEX IF NOT EXISTS idx_equipment_type ON "equipment" ("type");
CREATE INDEX IF NOT EXISTS idx_user_role ON "user_role" ("role");
