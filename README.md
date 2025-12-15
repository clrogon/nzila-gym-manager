# Nzila Gym Manager

> A production-grade, multi-tenant gym management system built with modern web technologies. Designed for martial arts studios, CrossFit boxes, and fitness centers in Angola and beyond.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com)

## 🎯 Overview

**Nzila Gym Manager** is a comprehensive SaaS platform for managing modern fitness facilities. Built with security, scalability, and user experience as core principles, Nzila handles everything from member check-ins to financial reporting, class scheduling to rank promotions.

**Live Demo**: [nzila-gym-manager.vercel.app](https://nzila-gym-manager.vercel.app)

---

## ✨ Core Features

### **Member Management**
- Complete member profiles with photo, emergency contacts, health conditions
- Family billing with tutor relationships for minors
- GDPR-compliant data handling with consent tracking
- Membership plans with automatic expiration tracking
- Status management (Active, Suspended, Pending)

### **Check-In System**
- Fast member check-in/check-out logging
- Real-time attendance tracking
- Kiosk mode for self-service (coming soon)

### **Class Scheduling & Calendar**
- Visual calendar with drag-drop class creation
- Recurring class support with flexible recurrence rules
- Coach assignment with automatic conflict detection
- Location-based scheduling (multiple rooms/areas)
- Class type library (Muay Thai, BJJ, CrossFit, etc.)
- Member booking system with capacity limits

### **Training & Progress**
- Workout template builder with exercise library
- Discipline-specific rank/belt system
- Promotion history with certificate tracking
- Performance records and personal bests
- Assigned workout tracking

### **Financial Management**
- Payment processing (Multicaixa, cash, bank transfer)
- Invoice generation with line items
- Discount/coupon system
- Revenue reporting and analytics
- Family billing consolidation

### **Sales CRM**
- Lead pipeline management (Kanban board)
- Lead source tracking (Instagram, Facebook, referral, walk-in)
- Task assignment for follow-ups
- Conversion tracking to members

### **Inventory & POS**
- Product catalog (supplements, gear, apparel)
- Stock management with low-stock alerts
- Point-of-sale transactions
- Asset tracking (equipment maintenance)

### **Staff Management**
- Role-based access control (5 roles: Super Admin, Gym Owner, Admin, Staff, Member)
- Staff certifications with expiry tracking
- Absence/leave management
- Coach scheduling and availability

### **Audit & Compliance**
- Immutable audit logs for sensitive operations
- GDPR data protection features
- Field-level security (sensitive data restricted to admins)
- Secure view patterns for member data

---

## 🏗️ Architecture

### **Multi-Tenant Design**
Nzila is architected as a true multi-tenant SaaS:
- Each gym is an isolated tenant with separate data
- Row-Level Security (RLS) enforces tenant boundaries
- Super Admin role provides platform-wide management
- Users can belong to multiple gyms with different roles

### **Technology Stack**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Type-safe UI components |
| **Build Tool** | Vite | Fast development + HMR |
| **Styling** | Tailwind CSS + Flowbite | Utility-first design system |
| **Backend** | Supabase | PostgreSQL + Auth + Edge Functions |
| **State Management** | TanStack Query (React Query) | Server state caching |
| **Routing** | React Router v6 | Client-side navigation |
| **Validation** | Zod | Schema validation |
| **Date Handling** | date-fns | Timezone-aware dates |

### **Security Model**

**Role Hierarchy**:
1. **Super Admin** - Platform-wide access, gym owner onboarding
2. **Gym Owner** - Full gym management, billing, staff assignment
3. **Admin** - Operations management, member data, financials
4. **Staff** - Check-ins, class management, member interactions
5. **Member** - Self-service profile, class bookings (coming soon)

**Security Features**:
- Row-Level Security (RLS) on all database tables
- Parameterized queries to prevent SQL injection
- Zod validation on all inputs
- GDPR-compliant data handling
- Audit logging for sensitive operations
- Field-level restrictions (health data only for admins)

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ (LTS recommended)
- npm or pnpm
- Supabase account ([supabase.com](https://supabase.com))

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/clrogon/nzila-gym-manager.git
   cd nzila-gym-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Database setup**
   
   Run migrations in Supabase Studio SQL Editor:
   - Navigate to your Supabase project
   - Go to SQL Editor
   - Execute migrations from `supabase/migrations/` in order

5. **Seed test data (optional)**
   
   Deploy and invoke the Edge Function:
   ```bash
   # Via Supabase Studio > Edge Functions > seed-test-users > Invoke
   ```
   
   This creates 10 test users (2 per role) with credentials:
   - Email: `[role]@nzila.ao` (e.g., `admin1@nzila.ao`)
   - Password: `!12345678#`

6. **Start development server**
   ```bash
   npm run dev
   ```
   
   Access the app at `http://localhost:5173`

---

## 📁 Project Structure

```
nzila-gym-manager/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── calendar/      # Calendar and scheduling
│   │   ├── members/       # Member management
│   │   ├── training/      # Workouts and exercises
│   │   └── ui/            # Base UI components (shadcn/ui)
│   ├── pages/             # Route pages
│   │   ├── Dashboard/     # Main dashboard
│   │   ├── Members/       # Member directory
│   │   ├── Calendar/      # Class scheduling
│   │   ├── Training/      # Workout management
│   │   ├── Financials/    # Payments and invoices
│   │   └── Leads/         # Sales CRM
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   │   ├── supabase.ts    # Supabase client
│   │   └── api/           # API service layer
│   ├── contexts/          # React context providers
│   └── types/             # TypeScript type definitions
├── supabase/
│   ├── migrations/        # Database schema versions
│   └── functions/         # Edge Functions (serverless)
├── public/                # Static assets
└── workflows/             # GitHub Actions CI/CD
```

---

## 🔐 Security & Compliance

### **GDPR Compliance**
- Explicit consent tracking (`gdpr_consent_at`)
- Data anonymization support (`gdpr_anonymized_at`)
- Right to erasure (delete member data)
- Audit trail for data access

### **Data Protection**
- Sensitive fields (health conditions, emergency contacts) restricted to admin roles
- Secure views for member data (`members_safe` view)
- Encrypted connections (Supabase enforces TLS)
- No PII in logs or error messages

### **Authentication**
- Supabase Auth with email/password
- JWT-based session management
- Automatic session refresh
- Secure password reset flow

---

## 🛠️ Development

### **Available Scripts**

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### **Code Standards**
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Conventional commits encouraged
- Pre-commit hooks with Husky (optional)

### **Testing**
```bash
npm run test         # Run Vitest unit tests
npm run test:ui      # Vitest UI mode
```

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code of Conduct
- Development workflow
- Pull request process
- Coding standards

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/clrogon/nzila-gym-manager/wiki)
- **Issues**: [GitHub Issues](https://github.com/clrogon/nzila-gym-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/clrogon/nzila-gym-manager/discussions)
- **Email**: support@nzila.ao

---

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com) - Open-source Firebase alternative
- UI components from [Flowbite](https://flowbite.com) and [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide React](https://lucide.dev)
- Inspired by the fitness community in Luanda, Angola

---

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and timeline.

**Upcoming features**:
- Mobile app (React Native)
- Member self-service portal
- WhatsApp integration for reminders
- Advanced analytics dashboard
- Multi-location gym chains support

---

**Made with ❤️ for the fitness community**
