# EMCL Heavy Equipment Reservation System

A production-ready web application for managing heavy equipment reservations with automated conflict detection, approval workflows, and role-based access control. Built for ExxonMobil Cepu Limited (EMCL) to replace legacy lifting plan software.

## Features

- **Equipment Request Management**: Submit and track reservation requests for cranes, forklifts, manlifts, and other heavy equipment
- **Automated Conflict Detection**: Real-time double-booking prevention with alternative equipment suggestions
- **Approval Workflow**: Multi-level approval process with audit trail and compliance logging
- **Role-Based Access**: REQUESTOR, APPROVER, and ADMIN roles with granular permissions
- **Real-Time Notifications**: In-app alerts for all request status changes
- **Admin Dashboard**: Equipment inventory management and user role assignment
- **Equipment Calendar**: Visual availability overview across all sites
- **PWA Ready**: Responsive design works seamlessly on web, iOS, and Android

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM with type safety
- **Authentication**: Better Auth with email/password
- **UI**: shadcn/ui components + Tailwind CSS
- **Styling**: Tailwind CSS v4
- **Hosting**: Vercel (recommended)

## Quick Start

### Prerequisites
- Node.js 18.17 or later
- PostgreSQL database (Neon account recommended)
- npm, yarn, pnpm, or bun

### Installation

1. **Clone/download the project**
   ```bash
   git clone <repository>
   cd v0-project
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or: npm install, yarn install, bun install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local
   cp .env.example .env.local
   
   # Add these variables:
   DATABASE_URL=postgresql://user:password@host/database
   BETTER_AUTH_SECRET=$(openssl rand -base64 32)
   BETTER_AUTH_URL=http://localhost:3000
   ```

   Generate `BETTER_AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

4. **Run database migrations**
   ```bash
   # The schema is already created in Neon
   # Just ensure DATABASE_URL is correct
   ```

5. **Seed initial data (optional)**
   ```bash
   curl http://localhost:3000/api/seed
   ```
   This creates an admin user and sample equipment.

6. **Start development server**
   ```bash
   pnpm dev
   ```

7. **Open browser**
   ```
   http://localhost:3000
   ```

## Default Test Users

After seeding, use these credentials to test:

- **Admin**: admin@emcl.com (created via seed)
- **Create new users**: Sign up at /sign-up
- **Assign roles**: Admin dashboard

## Project Structure

```
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/                  # User dashboard
│   ├── admin/equipment/            # Equipment management
│   ├── api/auth/[...all]/          # Authentication endpoints
│   └── actions/                    # Server actions
│       ├── reservations.ts         # Reservation CRUD
│       ├── equipment.ts            # Equipment management
│       ├── admin.ts               # Admin operations
│       └── notifications.ts        # Notifications
│
├── components/
│   ├── dashboard-client.tsx        # Main dashboard
│   ├── reservation-form.tsx        # New request form
│   ├── reservation-list.tsx        # User's requests
│   ├── approval-queue.tsx          # Approval workflow
│   ├── equipment-calendar.tsx      # Equipment view
│   ├── notifications.tsx           # Notification bell
│   └── admin/                      # Admin components
│
├── lib/
│   ├── auth.ts                     # Better Auth config
│   ├── db/                         # Database setup
│   │   ├── index.ts               # Drizzle client
│   │   └── schema.ts              # Database schema
│   ├── reservation-utils.ts        # Conflict detection
│   └── seed.ts                     # Seed data
│
└── public/                         # Static assets
```

## Database Schema Overview

### Core Tables
- **user**: User accounts with email/password
- **session**: User sessions (Better Auth)
- **equipment**: Heavy equipment inventory
- **reservation**: Equipment requests
- **user_role**: Role assignments (REQUESTOR, APPROVER, ADMIN)

### Operational Tables
- **reservation_conflict**: Booking conflicts tracking
- **alternative_equipment**: Suggested alternatives
- **approval_audit**: Complete approval audit trail
- **notification**: User notifications queue
- **notification_preference**: User notification settings

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Select your GitHub repository
   - Add environment variables in Settings
   - Deploy

3. **Set environment variables on Vercel**
   ```
   DATABASE_URL=<from-neon>
   BETTER_AUTH_SECRET=<generated-secret>
   BETTER_AUTH_URL=https://your-domain.vercel.app
   ```

4. **Configure Neon PostgreSQL**
   - Ensure DATABASE_URL has region closest to your users
   - Enable SSL/TLS (required by Neon)

## Usage Guide

### For Requestors
1. Sign up or sign in
2. Go to Dashboard → New Request
3. Select equipment and dates
4. Review conflicts (if any)
5. Submit request
6. Track status in "My Requests"

### For Approvers
1. Sign in (must have APPROVER role)
2. Go to Dashboard → Approvals
3. Review pending requests
4. Add notes and approve/reject
5. System notifies requestor automatically

### For Admins
1. Sign in (must have ADMIN role)
2. Navigate to /admin/equipment
3. Create/edit/delete equipment
4. Manage user roles
5. Monitor system usage

## API Endpoints

### Public
- `GET /` - Landing page
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Protected (requires authentication)
- `POST /api/reservations/create` - Submit request
- `GET /api/reservations/user` - List user's requests
- `POST /api/reservations/approve` - Approve request (approvers only)
- `POST /api/reservations/reject` - Reject request (approvers only)

All endpoints use Server Actions for type safety.

## Conflict Resolution

The system automatically detects booking conflicts:
- **Overlap detection**: Checks against PENDING and APPROVED reservations
- **Conflict types**: FULL_OVERLAP, PARTIAL_OVERLAP, ADJACENT
- **Smart suggestions**: Recommends available alternatives for the same dates/equipment type

## Security

- ✓ Password hashing with Better Auth
- ✓ Secure session management (HTTP-only cookies)
- ✓ Row-level authorization checks
- ✓ CSRF protection built-in
- ✓ SQL injection prevention (Drizzle ORM)
- ✓ Audit trail of all approvals
- ✓ SSL/TLS encryption in transit

## Performance

- Server-side rendering for fast initial load
- Database connection pooling (Neon)
- Optimized queries with indexes
- 30-second notification refresh interval
- Responsive design for all devices

## Troubleshooting

### "Module not found" errors
```bash
pnpm install
pnpm dev
```

### Database connection errors
- Verify `DATABASE_URL` in `.env.local`
- Check Neon database is running
- Ensure network allows PostgreSQL port 5432

### Authentication issues
- Regenerate `BETTER_AUTH_SECRET`
- Clear browser cookies
- Check `BETTER_AUTH_URL` matches deployment URL

### Conflicts not detecting
- Verify dates overlap correctly
- Check equipment ID is correct
- Inspect browser console for errors

## Development

### Code Style
- TypeScript for type safety
- ESLint configured
- Prettier for formatting

### Running tests
```bash
# Currently no automated tests
# Manual testing recommended for Phase 1
```

### Database migrations
```bash
# Schema updates: use Neon MCP tool
# Or execute SQL directly:
psql $DATABASE_URL < migration.sql
```

## Performance Optimization

### Database
- Indexed on: (equipmentId, startDate, endDate)
- Connection pooling enabled
- Query optimization with select()

### Frontend
- Server-side rendering (SSR)
- Lazy loading components
- Image optimization

### Caching
- Next.js automatic cache invalidation
- `revalidatePath()` for fresh data

## Phase 2 Roadmap

- [ ] Email notifications (SMTP integration)
- [ ] Advanced analytics dashboard
- [ ] ERP/SAP integration
- [ ] LDAP/Active Directory SSO
- [ ] Mobile native apps (React Native)
- [ ] SMS notifications
- [ ] Calendar integrations (iCal)
- [ ] Cost tracking and reporting

## Support

For issues or questions:
1. Check IMPLEMENTATION.md for detailed technical docs
2. Review database schema in lib/db/schema.ts
3. Check error logs in browser console
4. Verify environment variables are set correctly

## License

Internal EMCL use only.

## Contact

ExxonMobil Cepu Limited Operations Team
