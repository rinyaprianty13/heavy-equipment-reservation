# EMCL Reservation System - Setup Checklist

Complete this checklist to get the system running in your environment.

## Phase 1: Local Development Setup (20 minutes)

- [ ] Clone repository to local machine
- [ ] Install Node.js 18+ (verify: `node --version`)
- [ ] Install pnpm globally: `npm install -g pnpm`
- [ ] Install dependencies: `pnpm install`
- [ ] Create Neon PostgreSQL database
  - [ ] Visit https://neon.tech and create account
  - [ ] Create new project
  - [ ] Copy connection string (DATABASE_URL)
- [ ] Create `.env.local` file:
  ```
  DATABASE_URL=postgresql://...
  BETTER_AUTH_SECRET=<generated-secret>
  BETTER_AUTH_URL=http://localhost:3000
  ```
- [ ] Generate BETTER_AUTH_SECRET:
  ```bash
  openssl rand -base64 32
  ```
- [ ] Start development server: `pnpm dev`
- [ ] Open http://localhost:3000
- [ ] Verify landing page loads

## Phase 2: Database Setup (10 minutes)

Database schema is already created in Neon. Just verify:

- [ ] Connect to Neon database via psql or UI
- [ ] Verify these tables exist:
  - [ ] `user`
  - [ ] `session`
  - [ ] `equipment`
  - [ ] `reservation`
  - [ ] `user_role`
  - [ ] `approval_audit`
  - [ ] `notification`
- [ ] Seed initial data (optional):
  ```bash
  curl http://localhost:3000/api/seed
  ```
- [ ] Verify data:
  ```bash
  # Connect to database and run:
  SELECT COUNT(*) FROM equipment;  -- Should return 6
  SELECT * FROM "user" LIMIT 1;    -- Should show admin user
  ```

## Phase 3: User & Role Setup (15 minutes)

### Create Admin User
- [ ] Navigate to http://localhost:3000/sign-up
- [ ] Sign up with email and password
- [ ] Manually assign ADMIN role in database:
  ```sql
  INSERT INTO user_role (id, "userId", role)
  VALUES (
    gen_random_uuid(),
    (SELECT id FROM "user" WHERE email = 'your-email@example.com'),
    'ADMIN'
  );
  ```

### Create Approvers
- [ ] Have approvers sign up at /sign-up
- [ ] Assign APPROVER role:
  ```sql
  INSERT INTO user_role (id, "userId", role)
  VALUES (
    gen_random_uuid(),
    (SELECT id FROM "user" WHERE email = 'approver@example.com'),
    'APPROVER'
  );
  ```

### Create Requestors
- [ ] Have requestors sign up at /sign-up
- [ ] They automatically get REQUESTOR role

## Phase 4: Testing (20 minutes)

### Test Requestor Flow
- [ ] Sign in as requestor
- [ ] Go to Dashboard → New Request
- [ ] Select equipment (e.g., "Mobile Crane 50T")
- [ ] Enter dates (future dates, 2-3 days apart)
- [ ] Click Submit
- [ ] Verify "Request submitted successfully" message
- [ ] Go to "My Requests" tab
- [ ] Verify request appears with PENDING status

### Test Approver Flow
- [ ] Sign in as approver
- [ ] Go to Dashboard → Approvals
- [ ] Verify pending requests appear
- [ ] Click on a request to expand
- [ ] Add optional notes
- [ ] Click "Approve"
- [ ] Verify success message
- [ ] Sign in as requestor
- [ ] Verify request status changed to APPROVED

### Test Admin Flow
- [ ] Sign in as admin
- [ ] Navigate to http://localhost:3000/admin/equipment
- [ ] Verify 6 equipment items listed
- [ ] Click "Add Equipment"
- [ ] Fill in form (Code, Name, Type, Site required)
- [ ] Click "Create Equipment"
- [ ] Verify new equipment appears in table
- [ ] Click edit/delete buttons

### Test Conflict Detection
- [ ] Create 2 overlapping requests for same equipment
- [ ] Both should show conflict warnings
- [ ] Alternative equipment suggestions should appear
- [ ] Verify system prevents double-booking

## Phase 5: Deployment to Vercel (15 minutes)

### Connect to GitHub
- [ ] Create GitHub repository
- [ ] Push code: `git push origin main`
- [ ] Visit https://vercel.com/new
- [ ] Select "Import from GitHub"
- [ ] Choose your repository

### Configure Environment
- [ ] Add environment variables in Vercel:
  - [ ] `DATABASE_URL` (from Neon)
  - [ ] `BETTER_AUTH_SECRET` (same as development)
  - [ ] `BETTER_AUTH_URL` (your Vercel domain)
- [ ] Deploy
- [ ] Wait for build to complete
- [ ] Test deployed URL

### Post-Deployment
- [ ] Verify landing page loads
- [ ] Test sign-up
- [ ] Test sign-in
- [ ] Test creating reservation
- [ ] Setup monitoring (optional)

## Phase 6: Production Setup (varies)

### Email Integration (Phase 2+)
- [ ] Set up SMTP provider (e.g., SendGrid, AWS SES)
- [ ] Add email templates
- [ ] Configure notification service

### Backups
- [ ] Enable automated Neon backups
- [ ] Test backup restoration
- [ ] Document backup procedure

### Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation (optional)

### Custom Domain (if needed)
- [ ] Purchase domain
- [ ] Add to Vercel project settings
- [ ] Update `BETTER_AUTH_URL` environment variable
- [ ] Test HTTPS

## Testing Checklist

### Functional Testing
- [ ] Sign up works
- [ ] Sign in works
- [ ] Create reservation works
- [ ] Conflict detection works
- [ ] Approval workflow works
- [ ] Equipment management works
- [ ] Notifications appear
- [ ] Audit trail logs actions

### Performance Testing
- [ ] Landing page loads < 2s
- [ ] Dashboard loads < 1s
- [ ] Create reservation < 500ms
- [ ] No memory leaks (check DevTools)

### Security Testing
- [ ] Cannot access /admin without role
- [ ] Cannot approve others' requests
- [ ] Cannot delete other users' requests
- [ ] Session expires properly
- [ ] CSRF token present

### Cross-Browser Testing
- [ ] Chrome/Chromium ✓
- [ ] Firefox ✓
- [ ] Safari ✓
- [ ] Mobile browsers ✓

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution:**
```bash
pnpm install
pnpm dev
```

### Issue: Database connection fails
**Solution:**
1. Verify DATABASE_URL is correct
2. Check Neon database is running
3. Test connection: `psql $DATABASE_URL`
4. Check IP whitelist in Neon

### Issue: Authentication not working
**Solution:**
1. Regenerate BETTER_AUTH_SECRET
2. Clear browser cookies
3. Check BETTER_AUTH_URL matches deployment

### Issue: Requests not appearing
**Solution:**
1. Verify you're signed in
2. Check user has REQUESTOR role
3. Inspect browser console for errors
4. Check database has equipment

### Issue: Approvals tab not showing
**Solution:**
1. Verify user has APPROVER role
2. Check pending reservations exist
3. Verify equipment is available

## Quick Reference

### Important URLs
- Development: http://localhost:3000
- Database: Neon console at https://neon.tech
- Deployment: https://your-domain.vercel.app

### Important Files
- Configuration: `.env.local`
- Database schema: `lib/db/schema.ts`
- API actions: `app/actions/`
- UI components: `components/`

### Key Roles
- **REQUESTOR**: Submit and view their requests
- **APPROVER**: Approve/reject pending requests
- **ADMIN**: Full system access

### Database Admin Commands
```bash
# Connect to database
psql $DATABASE_URL

# List all users
SELECT email, id FROM "user";

# Assign ADMIN role
INSERT INTO user_role (id, "userId", role)
SELECT gen_random_uuid(), id, 'ADMIN' FROM "user" WHERE email = 'admin@example.com';

# List all equipment
SELECT code, name, type, site FROM equipment;

# Count reservations
SELECT status, COUNT(*) FROM reservation GROUP BY status;
```

## Next Steps

1. Complete all items in Phases 1-5
2. Run comprehensive testing
3. Document any customizations
4. Plan Phase 2 enhancements:
   - Email notifications
   - Advanced analytics
   - Integration with ERP systems
   - Native mobile apps

## Support

Refer to:
- README.md - General overview
- IMPLEMENTATION.md - Technical details
- Database schema - lib/db/schema.ts
- API actions - app/actions/*.ts

---

**Setup Complete!** Your EMCL Heavy Equipment Reservation System is ready for use.
