# EMCL Heavy Equipment Reservation System - Implementation Guide

## Overview

This is a production-ready heavy equipment reservation system built with Next.js 16, React, Neon PostgreSQL, and Better Auth. The system handles equipment requests, automated conflict detection, approval workflows, and real-time notifications for ExxonMobil Cepu Limited.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 + React 19 + shadcn/ui + Tailwind CSS
- **Backend**: Next.js Server Actions + Drizzle ORM
- **Database**: Neon PostgreSQL
- **Authentication**: Better Auth + Neon
- **Mobile**: PWA-first responsive design

### Database Schema

**Better Auth Tables**
- `user` - User accounts with email/password auth
- `session` - User sessions
- `account` - OAuth integration (if enabled)
- `verification` - Email verification tokens

**Application Tables**
- `equipment` - Heavy equipment inventory (cranes, forklifts, manlifts)
- `equipment_availability` - Weekly availability windows per equipment
- `reservation` - Equipment reservation requests
- `user_role` - Role-based access control (REQUESTOR, APPROVER, ADMIN)
- `reservation_conflict` - Tracks booking conflicts
- `alternative_equipment` - Suggested alternatives when conflicts occur
- `approval_audit` - Complete audit trail of approval actions
- `notification_preference` - User notification preferences
- `notification` - In-app notifications queue

## Project Structure

```
app/
├── page.tsx                 # Landing page
├── dashboard/              # User dashboard
│   └── page.tsx
├── sign-in/               # Authentication
├── sign-up/
├── admin/
│   └── equipment/page.tsx  # Admin equipment management
├── api/
│   ├── auth/[...all]/     # Better Auth handler
│   └── seed/route.ts      # Database seeding endpoint
└── actions/               # Server actions
    ├── reservations.ts    # Reservation CRUD
    ├── equipment.ts       # Equipment management
    ├── admin.ts          # Admin actions
    └── notifications.ts  # Notification handling

components/
├── dashboard-client.tsx    # Main dashboard UI (tabs)
├── reservation-form.tsx    # Create new reservation
├── reservation-list.tsx    # View user's reservations
├── approval-queue.tsx      # Approver view
├── equipment-calendar.tsx  # Visual equipment view
├── notifications.tsx       # Notification bell + panel
└── admin/
    └── equipment-management.tsx  # Admin CRUD

lib/
├── auth.ts                # Better Auth config
├── auth-client.ts         # Frontend auth client
├── db/
│   ├── index.ts          # Drizzle setup
│   └── schema.ts         # Complete schema
├── reservation-utils.ts   # Conflict detection logic
└── seed.ts               # Seed data generator
```

## Key Features

### 1. Request Workflow
- Users submit equipment reservation requests with date range
- System automatically checks for conflicts
- Suggests alternative equipment if needed
- Admin can approve/reject with notes

### 2. Conflict Detection
- Real-time double-booking prevention
- Checks against PENDING and APPROVED reservations
- Detects FULL_OVERLAP, PARTIAL_OVERLAP, ADJACENT conflicts
- Automatically suggests available alternatives

### 3. Role-Based Access Control
- **REQUESTOR**: Can submit and view their requests
- **APPROVER**: Can approve/reject pending requests
- **ADMIN**: Full system access including equipment management

### 4. Notifications
- In-app notifications for all request status changes
- Audit trail of all approval actions
- Extensible for email/SMS (implement in Phase 2)

### 5. Admin Dashboard
- Equipment inventory management (CRUD)
- User role assignment
- Request approval workflow
- System statistics and reporting (Phase 2)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- npm/pnpm/yarn

### Environment Setup

```bash
# Required environment variables
DATABASE_URL=postgresql://...  # From Neon
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=http://localhost:3000  # Or production URL
```

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Database Seeding

```bash
# Call the seed API endpoint (if SEED_KEY is set)
curl http://localhost:3000/api/seed

# Or programmatically:
import { seedDatabase } from '@/lib/seed'
await seedDatabase()
```

This creates:
- Admin user (admin@emcl.com)
- 6 sample equipment items across 2 sites

## User Flows

### Requestor Flow
1. Sign up / Sign in
2. Dashboard → New Request tab
3. Select equipment, dates, purpose
4. System detects conflicts (if any)
5. Submit request
6. View status in "My Requests" tab
7. Receive notifications on approval/rejection

### Approver Flow
1. Sign in (must have APPROVER role)
2. Dashboard → Approvals tab
3. Review pending requests
4. Add approval notes
5. Approve or Reject
6. Requestor receives notification

### Admin Flow
1. Sign in (must have ADMIN role)
2. Navigate to /admin/equipment
3. Create/edit/delete equipment
4. Manage user roles
5. Monitor system usage

## API Actions

All operations use Next.js Server Actions:

### Reservations (`app/actions/reservations.ts`)
- `createReservation(data)` - Submit new request
- `getUserReservations()` - Fetch user's requests
- `getPendingApprovals()` - Get requests needing approval
- `approveReservation(id, notes)` - Approve request
- `rejectReservation(id, reason)` - Reject request
- `getAllEquipment()` - List available equipment

### Equipment (`app/actions/equipment.ts`)
- `createEquipment(data)` - Add equipment (admin)
- `updateEquipment(id, data)` - Modify equipment
- `deleteEquipment(id)` - Remove equipment
- `getAllEquipmentWithStatus(filters)` - Query equipment

### Admin (`app/actions/admin.ts`)
- `assignApprover(reservationId, approverId)` - Reassign approver
- `reassignEquipment(reservationId, newEquipmentId)` - Change equipment
- `assignRoleToUser(userId, role)` - Grant role
- `removeRoleFromUser(userId, role)` - Revoke role
- `getAllApprovers()` - List all approvers

### Notifications (`app/actions/notifications.ts`)
- `getUserNotifications(limit)` - Fetch notifications
- `getUnreadNotificationCount()` - Count pending
- `markNotificationAsSent(id)` - Mark as read
- `deleteNotification(id)` - Remove notification

## Customization

### Adding Equipment Types
Edit `lib/db/schema.ts` - equipment table:
```typescript
type: text('type').$type<'CRANE' | 'FORKLIFT' | 'MANLIFT' | 'OTHER' | 'NEW_TYPE'>()
```

### Custom Approval Rules
Modify `app/actions/reservations.ts` - `getPendingApprovals()` to filter by:
- Equipment type
- Site
- User department
- Custom business rules

### Email Notifications
Add email service in Phase 2:
```typescript
// In createReservation, approveReservation, etc.
await sendEmailNotification({
  to: user.email,
  subject: 'Equipment Request Status',
  template: 'request-approved'
})
```

## Performance Optimization

### Database Queries
- Indexed on: equipment + dates, requestor, status, approver
- Pagination supported for large result sets
- Connection pooling via Neon

### Frontend
- Server-side rendering for initial page load
- Client-side form handling with optimistic updates
- Lazy loading of dashboard components

### Caching
- Next.js automatic caching with `revalidatePath()`
- 30-second notification refresh interval

## Security

### Authentication
- Better Auth handles password hashing and session management
- Secure HTTP-only cookies
- CSRF protection built-in

### Authorization
- `getUserId()` wrapper enforces authentication
- Role checks before sensitive operations
- Per-user data scoping in all queries

### Data Protection
- No passwords returned in API responses
- Audit trail for all approval actions
- Encrypted database connection (Neon TLS)

## Monitoring & Logging

### Audit Trail
- Every approval action logged to `approval_audit`
- Includes: who, what, when, comments
- Queryable for compliance reports

### Error Handling
- Try-catch in all server actions
- User-friendly error messages
- Server logs for debugging

## Phase 2 Enhancements

Planned for future versions:

1. **Email Notifications**
   - SMTP integration
   - HTML email templates
   - Delivery tracking

2. **Advanced Analytics**
   - Equipment utilization reports
   - Approval time statistics
   - User activity dashboards

3. **Integrations**
   - SAP/ERP sync for cost codes
   - LDAP/Active Directory SSO
   - iCal calendar exports

4. **Mobile Apps**
   - Native iOS/Android with React Native
   - Offline request caching
   - Push notifications

5. **Enhanced Conflict Resolution**
   - ML-based duration predictions
   - Smart alternative suggestions
   - Dynamic pricing based on availability

## Support & Troubleshooting

### Common Issues

**"Unauthorized" error**
- Check user has appropriate role assigned
- Verify session cookie is set

**Conflict detection not working**
- Ensure dates overlap correctly
- Check equipment ID matches

**Notifications not appearing**
- Verify `notificationPreferences` has `emailNotifications: true`
- Check notification creation in approval action

## Database Backup

```bash
# Export Neon database
pg_dump postgresql://... > backup.sql

# Restore from backup
psql postgresql://... < backup.sql
```

## Contact & Support

For questions about the implementation, refer to:
- Better Auth docs: https://www.better-auth.com
- Neon docs: https://neon.tech/docs
- Next.js docs: https://nextjs.org/docs
