# Developer Documentation

Welcome to the Nzila Gym Manager developer documentation. This guide provides comprehensive information for developers working on the codebase.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Architecture](#project-architecture)
3. [Development Workflow](#development-workflow)
4. [Code Style Guide](#code-style-guide)
5. [Testing](#testing)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Security Guidelines](#security-guidelines)
9. [Deployment](#deployment)

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm
- Git
- Supabase account
- VS Code (recommended)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/clrogon/nzila-gym-manager.git
   cd nzila-gym-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run database migrations**
   - Access Supabase Studio
   - Execute migrations from `supabase/migrations/` in order

5. **Start development server**
   ```bash
   npm run dev
   # Access at http://localhost:8080
   ```

---

## Project Architecture

### Technology Stack

| Component | Technology |
|-----------|-------------|
| **Frontend** | React 19.2.3 + TypeScript 5.9.3 |
| **Build Tool** | Vite 7.3.0 |
| **Styling** | Tailwind CSS 3.4.19 + shadcn/ui |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **State Management** | TanStack Query 5.90.16 + React Context |
| **Routing** | React Router DOM 7.11.0 |
| **Validation** | Zod 4.3.4 |

### Directory Structure

```
nzila-gym-manager/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/            # shadcn/ui base components
│   │   ├── common/         # Shared components
│   │   ├── auth/           # Authentication components
│   │   ├── calendar/        # Calendar components
│   │   ├── member/         # Member components
│   │   └── ...
│   ├── modules/             # Feature modules (21 total)
│   │   ├── auth/           # Authentication module
│   │   ├── members/        # Member management
│   │   ├── booking/        # Class booking
│   │   ├── payments/       # Payment processing
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── contexts/           # React context providers
│   ├── integrations/       # Supabase client & types
│   ├── pages/              # Route pages
│   └── types/             # TypeScript type definitions
├── supabase/
│   ├── migrations/          # Database migrations (70 files)
│   ├── functions/           # Edge Functions (8 functions)
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
├── docs/                   # User and admin documentation
└── workflows/              # GitHub Actions CI/CD
```

---

## Development Workflow

### Branch Strategy

```
main                    # Production-ready code
  └─ develop             # Integration branch
       └─ feature/*      # Feature branches
       └─ fix/*         # Bug fix branches
       └─ release/*     # Release preparation
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(module): add new feature
fix(module): fix bug
docs(module): update documentation
style(module): code formatting
refactor(module): code refactoring
test(module): add tests
chore(module): maintenance tasks
security(module): security fixes
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript validation

# Testing
npm run test             # Run tests (not implemented yet)
npm run test:ui          # Run tests with UI
npm run test:run          # Run tests in CI mode
```

---

## Code Style Guide

### TypeScript

- Use strict mode (already configured)
- Define explicit types, avoid `any`
- Use interfaces for object shapes
- Use type unions for literals
- Prefer `const` over `let`

**Example:**
```typescript
// ✅ Good
interface Member {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
}

const member: Member = {
  id: '123',
  name: 'John Doe',
  status: 'active'
};

// ❌ Bad
const member: any = {
  id: 123,
  name: 'John Doe',
  status: 'active'
};
```

### React

- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Use meaningful component names (PascalCase)
- Extract reusable logic into custom hooks
- Avoid prop drilling - use context when needed

**Example:**
```typescript
// ✅ Good
export function MemberCard({ member }: { member: Member }) {
  const { deleteMember } = useMembers();
  
  return (
    <Card>
      <CardHeader>{member.name}</CardHeader>
      <CardContent>{member.status}</CardContent>
    </Card>
  );
}

// ❌ Bad - too large
export function MemberDashboard() {
  // 500+ lines of code
}
```

### Naming Conventions

| Type | Convention | Example |
|-------|-------------|----------|
| **Components** | PascalCase | `MemberCard.tsx` |
| **Hooks** | camelCase with `use` prefix | `useMembers.ts` |
| **Utilities** | camelCase | `formatCurrency.ts` |
| **Constants** | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| **Types/Interfaces** | PascalCase | `MemberProfile` |
| **Functions** | camelCase | `calculateTotal()` |

### Styling

- Use Tailwind utility classes
- Follow shadcn/ui component patterns
- Keep custom CSS minimal
- Use CSS modules for component-specific styles
- Maintain responsive design (mobile-first)

**Example:**
```tsx
// ✅ Good
<div className="flex items-center gap-4 p-4 rounded-lg bg-white shadow-md">
  <span className="text-sm font-medium">Member Name</span>
</div>

// ❌ Bad
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
  <MemberName />
</div>
```

### Comments

- Write self-documenting code (clear variable/function names)
- Add comments for complex logic or business rules
- Use JSDoc for public API functions
- Avoid obvious comments

**Example:**
```typescript
// ✅ Good - complex logic needs explanation
/**
 * Calculates prorated membership fee based on days remaining in billing cycle.
 * Uses 30-day months for consistency across different month lengths.
 */
function calculateProratedFee(baseFee: number, daysRemaining: number): number {
  return (baseFee / 30) * daysRemaining;
}

// ✅ Good - self-documenting
const activeMembers = members.filter(member => member.status === 'active');

// ❌ Bad - unnecessary comment
const activeMembers = members.filter(m => m.s === 'active'); // filter active members
```

---

## Testing

### Test Configuration

The project is configured with Vitest but tests have not yet been implemented.

### Writing Tests

**Coming soon:** Comprehensive test suite implementation planned for v1.3.

---

## Database Schema

### Key Tables

#### Core Tables
- `gyms` - Gym/tenant information
- `members` - Member profiles
- `profiles` - User profiles
- `user_roles` - Role assignments (12 standard roles)

#### Class Management
- `classes` - Scheduled classes
- `class_bookings` - Member bookings
- `class_types` - Class type library
- `locations` - Gym locations
- `recurring_class_series` - Recurring class templates

#### Training
- `disciplines` - Martial arts disciplines
- `ranks` - Rank/belt system
- `exercises` - Exercise library
- `workout_templates` - Workout templates
- `assigned_workouts` - Member workout assignments
- `member_ranks` - Member rank progress

#### Financials
- `payments` - Payment records
- `invoices` - Invoices
- `invoice_line_items` - Invoice details
- `membership_plans` - Membership plan definitions
- `discounts` - Discount/coupon codes
- `bank_transactions` - Bank reconciliation

#### Security & Audit
- `member_sensitive_data` - Health/medical data (secure)
- `auth_events` - Authentication event logging
- `audit_logs` - Sensitive data access logging
- `sensitive_data_access_log` - Health data access tracking

### Row-Level Security (RLS)

All tables have RLS enabled. Key policies:

- **Anonymous access**: Blocked on all tables
- **User data**: Users can only view own profile
- **Gym data**: Staff can view gym members only
- **Sensitive data**: Restricted to admins/medical staff

### Migration Files

Database migrations are located in `supabase/migrations/` with timestamp-based naming:

```
20250129000000_comprehensive_security_fixes.sql
20250108000002_notification_system.sql
20260105060000_saas_administration.sql
```

---

## API Reference

### Supabase Client

The Supabase client is configured in `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

### Query Examples

#### Query Members
```typescript
const { data, error } = await supabase
  .from('members')
  .select('*')
  .eq('gym_id', currentGymId)
  .eq('status', 'active');
```

#### Insert Payment
```typescript
const { data, error } = await supabase
  .from('payments')
  .insert([{
    member_id: memberId,
    amount: amount,
    payment_method: 'multicaixa',
  }]);
```

#### Update Member
```typescript
const { data, error } = await supabase
  .from('members')
  .update({ status: 'suspended' })
  .eq('id', memberId);
```

### Edge Functions

Edge Functions are located in `supabase/functions/`:

#### auth-with-rate-limit
```typescript
// Handles authentication with server-side rate limiting
POST /functions/v1/auth-with-rate-limit
{
  "email": "user@example.com",
  "password": "securePassword123",
  "action": "signin" // or "signup"
}
```

#### send-email
```typescript
// Sends transactional emails
POST /functions/v1/send-email
{
  "to": "user@example.com",
  "subject": "Welcome",
  "template": "welcome",
  "data": { "name": "John" }
}
```

---

## Security Guidelines

### Critical Security Rules

1. **Never store sensitive data in client-side storage**
   - No API keys in localStorage/sessionStorage
   - No admin checks using client-side data

2. **Always use RLS policies**
   - All new tables must have Row-Level Security enabled
   - Create appropriate policies for each operation (SELECT, INSERT, UPDATE, DELETE)

3. **Separate sensitive data**
   - Health conditions, emergency contacts → `member_sensitive_data` table
   - Use established patterns in `Members.tsx`

4. **Use security definer functions**
   - For role checks: `has_gym_role()`, `is_super_admin()`
   - Prevents RLS recursion issues

5. **Validate all inputs**
   - Use Zod schemas for form validation
   - Sanitize before database operations

### Security Checklist

Before submitting code changes:

- [ ] RLS enabled on new tables
- [ ] Appropriate policies for all operations
- [ ] Sensitive data in separate secure tables
- [ ] No PII exposed in logs or error messages
- [ ] Uses existing security definer functions
- [ ] Audit logging for sensitive operations

For detailed security information, see [SECURITY.md](SECURITY.md) and [SECURITY_HARDENING.md](SECURITY_HARDENING.md).

---

## Deployment

### Build for Production

```bash
npm run build
```

Build output is created in `dist/` directory with:
- Code splitting
- Minification
- Gzip + Brotli compression
- Optimized for ES2020

### Environment Variables

Required environment variables for production:

```env
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

### Vercel Deployment

The project is configured for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker Deployment

Docker support coming in v1.4.

---

## Contributing

For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Support

- **Issues**: [GitHub Issues](https://github.com/clrogon/nzila-gym-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/clrogon/nzila-gym-manager/discussions)
- **Email**: support@nzila.ao

---

**Happy coding! 🚀**
