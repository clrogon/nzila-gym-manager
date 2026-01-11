# Deployment Guide

Complete deployment guide for Nzila Gym Manager.

---

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Vercel Deployment](#vercel-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Database Setup](#database-setup)
7. [Edge Functions Deployment](#edge-functions-deployment)
8. [Post-Deployment Checklist](#post-deployment-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Deployment Options

| Platform | Recommended For | Status |
|----------|------------------|--------|
| **Vercel** | Production deployment | ✅ Fully Supported |
| **Docker** | Self-hosted, enterprise | ⚠️ Planned for v1.4 |
| **AWS** | Enterprise deployment | 📋 Planned for v2.0 |
| **Google Cloud** | Enterprise deployment | 📋 Planned for v2.0 |

---

## Prerequisites

### System Requirements

| Resource | Minimum | Recommended |
|-----------|----------|--------------|
| **Node.js** | 18.x LTS | 20.x LTS |
| **npm** | 9.x | 10.x |
| **RAM** | 2 GB | 4 GB |
| **Disk Space** | 5 GB | 10 GB |
| **CPU** | 2 cores | 4 cores |

### Required Accounts

- Supabase account (for database, auth, storage, edge functions)
- Vercel account (for deployment)
- Resend account (for email notifications)
- Git repository (GitHub recommended)

### Required Domains

- Production domain (e.g., `gym.yourdomain.com`)
- SSL certificate (auto-provided by Vercel)

---

## Environment Configuration

### Environment Variables

Create `.env.production` or configure in hosting platform:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_URL=https://your-project.supabase.co

# Application Settings
VITE_APP_URL=https://gym.yourdomain.com
VITE_APP_NAME=Nzila Gym Manager
VITE_APP_ENV=production

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxx

# Optional: Multicaixa (Angola)
MULTICAIXA_API_KEY=your-multicaixa-key

# Optional: Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Security Note

⚠️ **Never commit environment variables to git repository**

Use `.env.example` as template:
```env
# Template only - do not use real values
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
RESEND_API_KEY=
```

---

## Vercel Deployment

### Step 1: Prepare Repository

1. Ensure all code is pushed to GitHub
2. Verify `.gitignore` includes `.env` and `dist/`
3. Confirm `vercel.json` exists in repository root

### Step 2: Connect Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select **"Continue with GitHub"**
4. Select `nzila-gym-manager` repository
5. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Configure Environment Variables

In Vercel Project Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_PROJECT_ID` | Your project ID | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your publishable key | Production, Preview, Development |
| `VITE_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `VITE_APP_URL` | Your production URL | Production |
| `RESEND_API_KEY` | Your Resend API key | Production |

### Step 4: Deploy

1. Vercel automatically deploys on push to `main` branch
2. Deployments available at:
   - Production: `https://nzila-gym-manager.vercel.app`
   - Preview: `https://nzila-gym-manager-*.vercel.app`

### Step 5: Configure Custom Domain

1. In Vercel Project Settings → Domains
2. Add your custom domain (e.g., `gym.yourdomain.com`)
3. Update DNS records as instructed by Vercel
4. SSL certificate is automatically provisioned

### Vercel Configuration File

Your `vercel.json` should contain:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

---

## Docker Deployment

### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
```

### Step 2: Create docker-compose.yml

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  nzila-gym-manager:
    build: .
    ports:
      - "8080:8080"
    environment:
      - VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}
      - VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_APP_URL=${VITE_APP_URL}
      - RESEND_API_KEY=${RESEND_API_KEY}
    restart: unless-stopped
```

### Step 3: Build and Run

```bash
# Build image
docker build -t nzila-gym-manager .

# Run container
docker run -p 8080:8080 \
  -e VITE_SUPABASE_PROJECT_ID=your-project-id \
  -e VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key \
  -e VITE_SUPABASE_URL=https://your-project.supabase.co \
  -e VITE_APP_URL=https://your-domain.com \
  nzila-gym-manager

# Or use docker-compose
docker-compose up -d
```

---

## Database Setup

### Step 1: Create Supabase Project

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Configure:
   - **Name**: `Nzila Gym Manager`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users (e.g., `Africa South (Johannesburg)`)
4. Click **"Create new project"** (takes 1-2 minutes)

### Step 2: Get Credentials

From Supabase Project Settings → API:

| Key | Usage |
|-----|-------|
| `Project URL` | Add to `VITE_SUPABASE_URL` |
| `anon/public` key | Add to `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `service_role` key | Add to environment (for Edge Functions) |

### Step 3: Run Migrations

1. Access Supabase SQL Editor
2. Execute migrations in order from `supabase/migrations/`:
   ```
   -- Start with earliest migration
   20250108000001_initial_schema.sql
   20250108000002_authentication_tables.sql
   ...
   -- End with latest migration
   20260105060000_saas_administration.sql
   ```
3. Verify all tables created

### Step 4: Enable RLS

Most migrations automatically enable Row-Level Security. Verify:

```sql
-- Check RLS is enabled on all tables
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Result should show `rowsecurity = true` for all tables
```

### Step 5: Create Supabase Auth Users

1. Access Supabase Dashboard → Authentication
2. Create initial admin user:
   - Email: `admin@yourgym.com`
   - Password: Generate strong password
3. Note: The `seed-super-admin` Edge Function can create super admin for platform setup

---

## Edge Functions Deployment

### Step 1: Configure Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-id
```

### Step 2: Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy auth-with-rate-limit
supabase functions deploy send-email
supabase functions deploy send-welcome-email
supabase functions deploy create-user-account
```

### Step 3: Set Function Secrets

```bash
# Set Resend API key
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxx

# Set other secrets as needed
supabase secrets set MULTICAIXA_API_KEY=your-key
```

### Step 4: Verify Functions

Access Supabase Dashboard → Edge Functions to verify all functions deployed:

- `auth-with-rate-limit` ✅
- `send-email` ✅
- `send-welcome-email` ✅
- `create-user-account` ✅
- `seed-super-admin` ✅

---

## Post-Deployment Checklist

### Security Verification

- [ ] Environment variables configured (no hardcoded secrets)
- [ ] HTTPS enabled (SSL certificate valid)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] RLS policies active on all database tables
- [ ] CORS configured to specific domains (no wildcards)
- [ ] Rate limiting enabled on auth endpoints
- [ ] Secrets managed via platform (not `.env` files in production)

### Functional Verification

- [ ] User registration works
- [ ] Email verification received
- [ ] User login successful
- [ ] Member creation works
- [ ] Class booking works
- [ ] Payment processing works
- [ ] Email notifications sent
- [ ] Check-in system functional
- [ ] All pages load without errors

### Performance Verification

- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] Bundle size optimized
- [ ] Code splitting working
- [ ] Caching enabled

### Monitoring Setup

- [ ] Vercel Analytics configured
- [ ] Google Analytics configured (if used)
- [ ] Error tracking (Sentry, etc.) configured
- [ ] Uptime monitoring configured
- [ ] Database backups verified

---

## Troubleshooting

### Build Fails

**Error:** `Build failed with exit code 1`

**Solutions:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build

# Check TypeScript errors
npm run type-check

# Fix lint errors
npm run lint
```

---

### Environment Variables Not Available

**Error:** `VITE_SUPABASE_URL is not defined`

**Solutions:**
- Verify environment variables are set in platform
- Check variable names match exactly (case-sensitive)
- Restart deployment after adding variables
- Check `.env.example` for correct variable names

---

### Database Connection Failed

**Error:** `Failed to connect to Supabase`

**Solutions:**
1. Verify Supabase URL is correct
2. Check network connectivity
3. Verify `VITE_SUPABASE_PUBLISHABLE_KEY` is valid
4. Check Supabase dashboard for service status
5. Verify RLS policies allow access

---

### Email Not Sending

**Error:** `Email delivery failed`

**Solutions:**
1. Verify Resend API key is valid
2. Check Resend dashboard for quota limits
3. Verify email templates exist in database
4. Check `email_audit_log` table for error details
5. Confirm email addresses are valid

---

### Edge Function Fails

**Error:** `Edge Function returned 500 error`

**Solutions:**
1. Check Edge Function logs in Supabase Dashboard
2. Verify function secrets are set
3. Check JWT verification is working
4. Test function locally using Supabase CLI
5. Verify function dependencies are correct

---

### CORS Errors

**Error:** `CORS policy blocked request`

**Solutions:**
1. Check CORS configuration in Edge Functions
2. Verify allowed origins include your domain
3. Remove wildcard `*` origin (security risk)
4. Check preflight OPTIONS requests
5. Verify headers are properly configured

---

### Performance Issues

**Symptoms:** Slow page loads, high LCP

**Solutions:**
1. Enable code splitting (already configured)
2. Use lazy loading for images
3. Optimize bundle size
4. Enable compression (gzip + brotli)
5. Check network speed
6. Use CDN for static assets

---

## Rollback Procedure

### Vercel Rollback

1. Access Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click **"..."** menu → **"Promote to Production"**

### Database Rollback

```sql
-- Check migration history
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC;

-- Revert problematic migration
-- Manually run reversal SQL if needed
```

---

## Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Check deployment logs for errors
   - Review performance metrics
   - Verify backup completion

2. **Monthly**
   - Review and update dependencies
   - Check database size and performance
   - Review security audit logs
   - Test disaster recovery procedures

3. **Quarterly**
   - Full security audit
   - Load testing
   - Performance optimization review
   - Update documentation

---

## Scaling

### Horizontal Scaling

- Use Vercel's automatic scaling
- Enable Vercel Pro plan for higher limits
- Configure CDN for static assets
- Use Supabase's auto-scaling for database

### Database Scaling

- Monitor Supabase dashboard for resource usage
- Upgrade plan if approaching limits
- Add read replicas if needed
- Enable connection pooling for high traffic

---

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **GitHub Issues**: https://github.com/clrogon/nzila-gym-manager/issues
- **Email**: [your-support-email@example.com]

---

**Last Updated:** January 11, 2026
