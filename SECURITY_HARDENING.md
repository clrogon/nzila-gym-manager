# Nzila Gym Manager - Security Hardening Guide

Este documento reúne **todas as medidas de segurança** aplicáveis ao projeto Nzila Gym Manager (Vite + React + TypeScript + Tailwind + Shadcn), detalhando **o que corrigir, onde e como**.

---

## Security Fixes Applied (v1.0.1 - January 2025)

### ✅ Implemented Fixes

| Issue | Status | Description |
|-------|--------|-------------|
| PUBLIC_USER_DATA | ✅ Fixed | Profiles table now properly protected |
| EXPOSED_SENSITIVE_DATA | ✅ Fixed | Health data moved to secure table |
| MISSING_RLS_PROTECTION | ✅ Fixed | members_safe view has RLS |

### Migration Applied

```sql
-- File: supabase/migrations/20250129000000_comprehensive_security_fixes.sql
-- Key changes:
-- 1. Created member_sensitive_data table with strict RLS
-- 2. Migrated health_conditions from members table
-- 3. Added audit_sensitive_data_access trigger
-- 4. Recreated members_safe view with security_invoker
-- 5. Strengthened auth_rate_limits policies
```

---

## 1. Dependências e Supply Chain

**Problema:** Dependências desatualizadas ou mal auditadas.

**Ação:**
1. Habilitar Dependabot:
   ```yaml
   # .github/dependabot.yml
   version: 2
   updates:
     - package-ecosystem: "npm"
       directory: "/"
       schedule:
         interval: "weekly"
       open-pull-requests-limit: 10
       labels:
         - "dependencies"
       reviewers:
         - "clrogon"
       commit-message:
         prefix: "deps"
         include: "scope"
   ```
2. Rodar auditoria automatizada:
   ```bash
   npm audit fix
   ```
3. Criar workflow no GitHub Actions:
```yaml
name: Security Audit
on:
  push:
  pull_request:
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm audit --omit=dev
```

---

## 2. Supabase - Row Level Security (RLS)

**Status:** ✅ Implemented on all tables

**Current Policies:**

### profiles table
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (id = auth.uid());

-- Gym staff can view profiles of gym members
CREATE POLICY "Gym staff can view profiles of gym members" ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles ur_viewer
    WHERE ur_viewer.user_id = auth.uid()
    AND ur_viewer.role = ANY(ARRAY['gym_owner', 'admin', 'staff'])
    AND EXISTS (
      SELECT 1 FROM user_roles ur_target
      WHERE ur_target.user_id = profiles.id
      AND ur_target.gym_id = ur_viewer.gym_id
    )
  ));

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON profiles FOR SELECT
  USING (is_super_admin(auth.uid()));
```

### member_sensitive_data table (NEW)
```sql
-- Only admins/owners can manage sensitive data
CREATE POLICY "Admins can manage sensitive data" ON member_sensitive_data FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = member_sensitive_data.member_id
    AND has_gym_role(auth.uid(), m.gym_id, ARRAY['gym_owner', 'admin'])
  ));

-- Staff can view (read-only) sensitive data
CREATE POLICY "Staff can view sensitive data" ON member_sensitive_data FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = member_sensitive_data.member_id
    AND has_gym_role(auth.uid(), m.gym_id, ARRAY['gym_owner', 'admin', 'staff'])
  ));
```

---

## 3. Proteção de rotas

**Status:** ✅ Implemented

**Implementation:**
```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useSecureAuth } from "@/contexts/SecureAuthContext";

export function ProtectedRoute({ children, requiredRoles }) {
  const { user, loading, hasRole } = useSecureAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRoles && !hasRole(requiredRoles)) return <Navigate to="/unauthorized" replace />;
  
  return children;
}
```

---

## 4. Sanitização de Inputs e XSS

**Problema:** Conteúdo dinâmico pode gerar XSS.

**Ação:**
1. Instalar DOMPurify:
```bash
npm i dompurify
```
2. Sempre sanitizar:
```tsx
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```
3. Para inputs:
```tsx
export function SafeInput({ value, onChange, ...props }) {
  const safeValue = typeof value === "string" ? value.replace(/\</g, "") : value;
  return <input {...props} value={safeValue} onChange={onChange} />;
}
```

---

## 5. Variáveis de ambiente e segredos

**Status:** ✅ Properly configured

**Current Setup:**
- `.env` contains only public/publishable keys (VITE_*)
- Service role keys stored in Supabase secrets
- Edge Functions use server-side secrets

---

## 6. Headers de segurança

**Ação (Vercel):**
1. Criar `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src * blob: data:; style-src 'self' 'unsafe-inline'; script-src 'self';" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 7. Tailwind e UI Layer

**Status:** ✅ Using cn() utility

**Implementation:**
```ts
// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
```

---

## 8. Logging e Audit Trail

**Status:** ✅ Implemented

**Current Setup:**
```sql
-- Audit log table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  gym_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Trigger for sensitive data access
CREATE TRIGGER audit_sensitive_data
  AFTER INSERT OR UPDATE OR DELETE ON member_sensitive_data
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_data_access();
```

---

## Security Implementation Checklist

### Database Security
- [x] RLS enabled on all tables
- [x] Sensitive data in separate table
- [x] Audit logging for sensitive operations
- [x] Security definer functions
- [x] Rate limiting on auth

### Application Security
- [x] Protected routes
- [x] Permission-based UI rendering
- [x] Input validation with Zod
- [x] Secure auth context

### Infrastructure Security
- [x] Environment variables properly configured
- [x] No secrets in client code
- [ ] CSP headers (pending deployment config)
- [ ] Rate limiting on API (pending Edge Function)

---

## Monitoring Recommendations

### Daily Checks
```sql
-- Check for suspicious access patterns
SELECT 
  user_id,
  COUNT(*) as access_count,
  MIN(created_at) as first_access,
  MAX(created_at) as last_access
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
AND entity_type = 'member_sensitive_data'
GROUP BY user_id
HAVING COUNT(*) > 50
ORDER BY access_count DESC;
```

### Weekly Audit Report
```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  entity_type,
  action,
  COUNT(*) as total_actions
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at), entity_type, action
ORDER BY date DESC, total_actions DESC;
```

---

## Next Steps

1. **Enable Leaked Password Protection** in Supabase Auth settings
2. **Configure MFA** for admin accounts
3. **Set up alerts** for suspicious access patterns
4. **Implement rate limiting** on API endpoints via Edge Functions
5. **Regular security audits** of user roles

---

# Fim do Security Hardening
Seguindo estas instruções, o Nzila Gym Manager estará **fortemente protegido** em frontend, backend (Supabase), dependências e UI layer.
