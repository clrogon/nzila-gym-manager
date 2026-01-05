# Changelog | Registo de Alterações

All notable changes to Nzila Gym Manager will be documented in this file.
Todas as alterações notáveis ao Nzila Gym Manager serão documentadas neste ficheiro.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.2] - 2025-01-05

### Added | Adicionado

#### Email Notification System | Sistema de Notificações por Email
- **send-email Edge Function**: Generic email sending with HTML template support via Resend
- **send-welcome-email Edge Function**: Specialized welcome emails for new users with multiple scenarios:
  - Self-signup welcome confirmation
  - Admin-created accounts with temporary password
  - Password reset instructions
- **create-user-account Edge Function**: Complete user account creation with:
  - Automatic role assignment (staff_assignments)
  - Secure temporary password generation
  - Welcome email dispatch with credentials
  - Gym owner pre-registration support
- **Database trigger**: `on_profile_created_send_welcome` for automatic email on profile creation
- **Notification queue**: `email_notifications` table for audit logging and retry tracking

#### Infrastructure | Infraestrutura
- Email service integration via Resend API
- Notification event bus for decoupled email dispatch
- Email provider factory pattern for future provider support

### Changed | Alterado
- Updated `emailService.ts` with helper functions for edge function invocation
- Enhanced booking notification system with email integration

---

## [1.0.1] - 2025-01-29

### Security Fixes | Correções de Segurança

#### Critical Security Enhancements | Melhorias Críticas de Segurança
- **PUBLIC_USER_DATA Fix**: Blocked anonymous access to profiles table, users can only view their own profile + same-gym members
- **EXPOSED_SENSITIVE_DATA Fix**: Created separate `member_sensitive_data` table for health conditions, restricted to admins/medical staff only
- **MISSING_RLS_PROTECTION Fix**: Added proper RLS policies and `security_invoker` mode to `members_safe` view

#### Database Changes | Alterações de Base de Dados
- Created `member_sensitive_data` table with strict RLS policies
- Migrated existing `health_conditions` data from `members` to new secure table
- Added audit logging for sensitive data access via `audit_sensitive_data_access` trigger
- Strengthened `auth_rate_limits` with deny-all policy
- Added `cleanup_expired_rate_limits` function for maintenance

#### Application Updates | Actualizações da Aplicação
- Updated Members page to handle sensitive data separately
- Added `MemberSensitiveData` interface and state management
- Modified member creation/editing to use new secure data flow

### Fixed | Corrigido
- React ref warnings in Index page (forwardRef implementation)

---

## [1.0.0-beta] - 2024-12-24

### Added | Adicionado

#### Authentication & Security | Autenticação & Segurança
- Email/password authentication with Supabase Auth
- 12 international standard roles (Super Admin, Gym Owner, Manager, Admin, Coach, Trainer, Instructor, Physiotherapist, Nutritionist, Receptionist, Staff, Member)
- Role-based access control (RBAC) with granular permissions
- Row-Level Security (RLS) policies on all database tables
- Protected routes with permission checks
- Secure session management

#### Member Management | Gestão de Membros
- Complete member profiles with photos, emergency contacts, health conditions
- Membership plans with duration and auto-expiration
- Family/dependent relationships with tutor tracking
- Member status management (Active, Suspended, Pending, Cancelled)
- Minor member support with guardian requirements
- GDPR consent tracking fields

#### Check-In System | Sistema de Check-In
- Quick check-in/out functionality
- Real-time attendance tracking
- Check-in history and reports
- Notes support for each check-in

#### Calendar & Scheduling | Calendário & Agendamento
- Visual weekly calendar with drag-and-drop
- Class creation with type, location, and coach assignment
- Recurring class series with flexible recurrence rules
- Coach and location conflict detection
- Capacity management with booking limits
- Waitlist with automatic promotion
- Discipline integration for classes

#### Training & Progress | Treino & Progresso
- Exercise library with categories and muscle groups
- Workout template builder with sets/reps/duration
- Workout assignment to members with scheduling
- Discipline management (martial arts, CrossFit, etc.)
- Rank/belt system per discipline
- Promotion criteria configuration
- Promotion history with certificates
- Member progress dashboard with performance records

#### Financial Management | Gestão Financeira
- Payment processing (Multicaixa Express, Cash, Bank Transfer)
- Invoice generation with line items
- Invoice PDF export
- Discount/coupon system with usage limits
- Bank reconciliation with file import (CSV/TXT)
- Multicaixa proof parsing and validation
- Financial reports with PDF export

#### Sales CRM | CRM de Vendas
- Lead pipeline with Kanban board
- Lead source tracking (Walk-in, Website, Social, Referral)
- Lead status management (New, Contacted, Qualified, etc.)
- Task assignment and follow-up tracking
- Lead-to-member conversion workflow

#### Inventory & POS | Inventário & PDV
- Product catalog with categories
- Stock quantity management
- Low stock threshold alerts
- Point-of-sale interface
- Asset tracking with maintenance scheduling

#### Staff Management | Gestão de Staff
- Staff role assignment per gym
- Trainer flag for specialized permissions
- Staff listing with search and filtering
- Multi-gym staff support for Super Admins

#### Infrastructure | Infraestrutura
- React 18 + TypeScript + Vite frontend
- Tailwind CSS + shadcn/ui component library
- Supabase backend (Lovable Cloud)
- TanStack Query for server state
- React Router v7 for navigation
- Zod for validation
- date-fns for date handling

### Security | Segurança
- Row-Level Security (RLS) on all tables
- Secure database functions (SECURITY DEFINER)
- Audit logging for sensitive operations
- Input validation with Zod schemas
- Environment variable configuration
- No PII in console logs

### Known Issues | Problemas Conhecidos
- GDPR module UI pending (database tables ready)
- Kiosk mode is in development

---

## [0.1.0] - 2024-12-01

### Added | Adicionado
- Initial project setup with React + TypeScript + Vite
- Supabase integration for backend
- Basic authentication flow
- Dashboard layout and navigation
- Member management foundation
- Mock-first development strategy

---

[1.0.2]: https://github.com/clrogon/nzila-gym-manager/releases/tag/v1.0.2
[1.0.1]: https://github.com/clrogon/nzila-gym-manager/releases/tag/v1.0.1
[1.0.0-beta]: https://github.com/clrogon/nzila-gym-manager/releases/tag/v1.0.0-beta
[0.1.0]: https://github.com/clrogon/nzila-gym-manager/releases/tag/v0.1.0
