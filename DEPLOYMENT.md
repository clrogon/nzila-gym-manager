# Nzila Gym Manager - Deployment Guide

This guide covers all deployment tasks for the Nzila Gym Manager application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Migrations](#database-migrations)
- [Edge Functions Deployment](#edge-functions-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Post-Deployment](#post-deployment)

## Prerequisites

### Required Tools
- Node.js 20+
- Supabase CLI
- Git
- Vercel CLI (optional, for deployment)

### Install Supabase CLI
```bash
npm install -g supabase
```

### Login to Supabase
```bash
supabase login
```

## Environment Setup

### 1. Set Supabase Environment Variables

These variables are required for Edge Functions:

```bash
# From your Resend.com dashboard
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
supabase secrets set SITE_URL=https://your-app-url.com
```

### 2. Client-Side Environment Variables

Create `.env` file in project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

⚠️ **Important**: Never commit `.env` to git!

## Database Migrations

### Apply All Migrations

```bash
# Push all migrations to remote database
supabase db push
```

### Apply Specific Migration

```bash
# Apply only recent migrations
supabase migration up
```

### New Migrations in This Deployment

1. **20250108000000_atomic_pos_sale_transaction.sql**
   - Atomic POS transaction function
   - Prevents race conditions in sales
   - Updates stock atomically

2. **20250108000001_kiosk_pin_auth.sql**
   - Kiosk PIN-based authentication
   - PIN validation and lockout
   - Security enhancements for kiosk mode

3. **20250108000002_notification_system.sql**
   - Notification tables and functions
   - Booking confirmations
   - Payment reminders
   - Class cancellation alerts

## Edge Functions Deployment

### Automated Deployment Script

Use the provided deployment script:

```bash
# Make script executable
chmod +x deploy-edge-functions.sh

# Run deployment
./deploy-edge-functions.sh
```

### Manual Deployment

Deploy all functions:

```bash
# Deploy all edge functions
supabase functions deploy
```

Deploy specific function:

```bash
# Deploy single function
supabase functions deploy send-email
```

### Edge Functions to Deploy

1. **auth-with-rate-limit** - Rate-limited authentication
2. **create-user-account** - User account creation with email
3. **pre-register-gym-owner** - Gym owner pre-registration
4. **seed-super-admin** - Seed super admin account
5. **seed-test-users** - Seed test data
6. **send-email** - Email sending via Resend
7. **send-welcome-email** - Welcome emails

### Verify Deployment

```bash
# List all deployed functions
supabase functions list

# View logs for a function
supabase functions logs send-email
```

## Frontend Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build production bundle
npm run build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Vercel Configuration

The `vercel.json` file includes:

- **CSP Headers**: Content-Security-Policy for XSS protection
- **Security Headers**: X-Frame-Options, X-XSS-Protection
- **Rewrites**: SPA routing support

## Post-Deployment

### 1. Verify Database

```bash
# Connect to Supabase dashboard
# Verify tables exist
# Check RLS policies
# Test RPC functions
```

### 2. Test Edge Functions

Test each function locally:

```bash
# Serve functions locally
supabase functions serve

# Test in another terminal
curl http://localhost:54321/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome_self_signup",
    "to": "test@example.com",
    "userName": "Test User",
    "gymName": "Test Gym"
  }'
```

### 3. Test Frontend

- [ ] Login flow
- [ ] Member registration
- [ ] POS sale with atomic transaction
- [ ] Kiosk PIN check-in
- [ ] Booking notifications
- [ ] GDPR data export
- [ ] Email notifications

### 4. Monitor Logs

```bash
# Edge function logs
supabase functions logs --all

# Database logs
supabase db logs
```

## Troubleshooting

### Migration Failed

```bash
# Reset and retry
supabase db reset
supabase db push
```

### Edge Function Error

```bash
# Check function logs
supabase functions logs <function-name>

# Redeploy function
supabase functions deploy <function-name>
```

### Build Failed

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run type check
npm run type-check
```

## Security Checklist

- [ ] All secrets are set in Supabase
- [ ] `.env` is in `.gitignore`
- [ ] CSP headers are configured
- [ ] RLS policies are enabled
- [ ] API keys are not committed
- [ ] HTTPS is enforced
- [ ] Rate limiting is active

## Performance Checklist

- [ ] Code splitting is enabled
- [ ] Lazy loading is implemented
- [ ] Images are optimized
- [ ] Gzip/Brotli compression is enabled
- [ ] CDN is configured (Vercel)
- [ ] Database indexes are created

## Support

For issues:
- Check logs: `supabase functions logs --all`
- Review documentation: `/docs`
- Create issue: https://github.com/clrogon/nzila-gym-manager/issues

---

**Last Updated**: January 8, 2026
**Version**: 1.3.0
