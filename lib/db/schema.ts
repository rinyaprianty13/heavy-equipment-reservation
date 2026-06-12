import {
  text,
  timestamp,
  pgTable,
  primaryKey,
  boolean,
  integer,
  unique,
  index,
  time,
} from 'drizzle-orm/pg-core'

// Better Auth Tables (DO NOT MODIFY)
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
})

// EMCL Reservation System Tables

// User Roles
export const userRole = pgTable(
  'user_role',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').$type<'REQUESTOR' | 'APPROVER' | 'ADMIN'>().notNull(),
    equipmentType: text('equipmentType'),
    site: text('site'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueRole: unique('unique_user_role').on(
      table.userId,
      table.role,
      table.equipmentType,
      table.site
    ),
  })
)

// Equipment Inventory
export const equipment = pgTable(
  'equipment',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    type: text('type').$type<'CRANE' | 'FORKLIFT' | 'MANLIFT' | 'OTHER'>().notNull(),
    description: text('description'),
    site: text('site').notNull(),
    status: text('status')
      .$type<'AVAILABLE' | 'MAINTENANCE' | 'RETIRED'>()
      .notNull()
      .default('AVAILABLE'),
    capacity: integer('capacity'),
    capacityUnit: text('capacityUnit'),
    lastMaintenanceDate: timestamp('lastMaintenanceDate'),
    nextMaintenanceDate: timestamp('nextMaintenanceDate'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: text('createdBy')
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    siteIdx: index('idx_equipment_site').on(table.site),
    typeIdx: index('idx_equipment_type').on(table.type),
  })
)

// Equipment Availability Windows
export const equipmentAvailability = pgTable(
  'equipment_availability',
  {
    id: text('id').primaryKey(),
    equipmentId: text('equipmentId')
      .notNull()
      .references(() => equipment.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('dayOfWeek').notNull(),
    startTime: time('startTime').notNull(),
    endTime: time('endTime').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueWindow: unique('unique_equipment_day').on(
      table.equipmentId,
      table.dayOfWeek
    ),
  })
)

// Reservations
export const reservation = pgTable(
  'reservation',
  {
    id: text('id').primaryKey(),
    requestNumber: text('requestNumber').notNull().unique(),
    equipmentId: text('equipmentId')
      .notNull()
      .references(() => equipment.id),
    requestorId: text('requestorId')
      .notNull()
      .references(() => user.id),
    approverId: text('approverId').references(() => user.id),
    status: text('status')
      .$type<'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'>()
      .notNull()
      .default('PENDING'),
    startDate: timestamp('startDate').notNull(),
    endDate: timestamp('endDate').notNull(),
    purpose: text('purpose').notNull(),
    costCode: text('costCode'),
    notes: text('notes'),
    approvalDate: timestamp('approvalDate'),
    approvalNotes: text('approvalNotes'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    equipmentDatesIdx: index('idx_equipment_dates').on(
      table.equipmentId,
      table.startDate,
      table.endDate
    ),
    requestorIdx: index('idx_requestor').on(table.requestorId),
    statusIdx: index('idx_status').on(table.status),
    datesIdx: index('idx_dates').on(table.startDate, table.endDate),
    approverIdx: index('idx_reservation_approver').on(table.approverId),
  })
)

// Conflict Detection
export const reservationConflict = pgTable(
  'reservation_conflict',
  {
    id: text('id').primaryKey(),
    reservationId: text('reservationId')
      .notNull()
      .references(() => reservation.id, { onDelete: 'cascade' }),
    conflictingReservationId: text('conflictingReservationId')
      .notNull()
      .references(() => reservation.id, { onDelete: 'cascade' }),
    overlapType: text('overlapType')
      .$type<'FULL_OVERLAP' | 'PARTIAL_OVERLAP' | 'ADJACENT'>()
      .notNull(),
    detectedAt: timestamp('detectedAt').notNull().defaultNow(),
    resolvedAt: timestamp('resolvedAt'),
    resolution: text('resolution'),
  },
  (table) => ({
    uniqueConflict: unique('unique_conflict').on(
      table.reservationId,
      table.conflictingReservationId
    ),
  })
)

// Alternative Equipment Suggestions
export const alternativeEquipment = pgTable('alternative_equipment', {
  id: text('id').primaryKey(),
  originalReservationId: text('originalReservationId')
    .notNull()
    .references(() => reservation.id, { onDelete: 'cascade' }),
  suggestedEquipmentId: text('suggestedEquipmentId')
    .notNull()
    .references(() => equipment.id),
  availableStartDate: timestamp('availableStartDate').notNull(),
  availableEndDate: timestamp('availableEndDate').notNull(),
  suggestedAt: timestamp('suggestedAt').notNull().defaultNow(),
  acceptedAt: timestamp('acceptedAt'),
})

// Approval Audit Trail
export const approvalAudit = pgTable(
  'approval_audit',
  {
    id: text('id').primaryKey(),
    reservationId: text('reservationId')
      .notNull()
      .references(() => reservation.id, { onDelete: 'cascade' }),
    action: text('action')
      .$type<'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REASSIGNED' | 'CANCELLED' | 'COMPLETED'>()
      .notNull(),
    actorId: text('actorId')
      .notNull()
      .references(() => user.id),
    oldStatus: text('oldStatus'),
    newStatus: text('newStatus').notNull(),
    comments: text('comments'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    reservationIdx: index('idx_audit_reservation').on(table.reservationId),
    actorIdx: index('idx_audit_actor').on(table.actorId),
  })
)

// Notification Preferences
export const notificationPreference = pgTable('notification_preference', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  emailNotifications: boolean('emailNotifications').notNull().default(true),
  smsNotifications: boolean('smsNotifications').notNull().default(false),
  pushNotifications: boolean('pushNotifications').notNull().default(true),
  phoneNumber: text('phoneNumber'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// Notifications
export const notification = pgTable(
  'notification',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    reservationId: text('reservationId').references(() => reservation.id, {
      onDelete: 'set null',
    }),
    type: text('type')
      .$type<'APPROVAL_PENDING' | 'APPROVED' | 'REJECTED' | 'CONFLICT_DETECTED' | 'REMINDER' | 'REASSIGNED'>()
      .notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    status: text('status')
      .$type<'PENDING' | 'SENT' | 'FAILED'>()
      .notNull()
      .default('PENDING'),
    sentAt: timestamp('sentAt'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_notification_user').on(table.userId),
    statusIdx: index('idx_notification_status').on(table.status),
  })
)
