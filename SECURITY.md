# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues via email to:

📧 **security@nzila.ao**

### What to Include

- Type of vulnerability
- Full paths of affected source files
- Location of the affected source code (tag/branch/commit/URL)
- Step-by-step instructions to reproduce
- Proof-of-concept or exploit code (if possible)
- Impact of the issue

### Response Timeline

- **24 hours:** Initial response acknowledging receipt
- **7 days:** Detailed response with assessment
- **30 days:** Resolution or mitigation plan

## Security Best Practices for Contributors

1. **Never commit API keys, tokens, or credentials.** The `.env` file is ignored by Git for this reason.
2. Always use `.env.example` for environment templates.
3. Validate all user inputs with Zod schemas.
4. Enable Supabase Row Level Security (RLS) on all tables.
5. Use parameterized queries (Supabase handles this).
6. Follow OWASP Top 10 guidelines.
7. Avoid `console.log` in production code; use conditional logging for development.

## Known Security Considerations

### Authentication
- Uses Supabase Auth with JWT tokens.
- Tokens expire after 1 hour (configurable).
- Refresh tokens stored in secure, httpOnly cookies.
- Rate limiting implemented on authentication endpoints.

### Database
- PostgreSQL via Supabase.
- Row Level Security (RLS) enabled on all tables to ensure multi-tenant isolation.
- Parameterized queries prevent SQL injection.

### Frontend
- Input validation via Zod schemas.
- XSS prevention via React's built-in escaping.
- CSRF protection via Supabase session tokens.
- Sanitization of dynamic CSS and HTML injection points.

## Recent Security Fixes (v1.1.0 - January 2026)

### Fixed Vulnerabilities

| Issue | Severity | Description | Fix |
| :--- | :--- | :--- | :--- |
| PUBLIC_USER_DATA | High | Profiles table was publicly readable | Blocked anonymous access, users can only view own profile + same-gym members |
| EXPOSED_SENSITIVE_DATA | Critical | Health conditions exposed in members table | Created separate `member_sensitive_data` table with strict RLS |
| MISSING_RLS_PROTECTION | Medium | `members_safe` view lacked RLS | Added proper RLS policies with `security_invoker` mode |
| HARDCODED_SECRETS | High | `.env` file was committed to the repository | Removed `.env` from history and updated `.gitignore` |
| INSECURE_LOGGING | Low | Sensitive info potentially logged to console | Wrapped production logs in environment checks |

### Compliance Improvements

- **GDPR Compliance**: Sensitive health data now stored separately with audit logging.
- **HIPAA-like Protection**: Medical information restricted to authorized personnel only.
- **Audit Trail**: All sensitive data access is logged for compliance.

## Security Architecture

### Data Protection Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  - Input validation (Zod schemas)                           │
│  - Permission checks (useRBAC hook)                         │
│  - Secure component rendering                               │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                                 │
│  - Supabase client with auth tokens                         │
│  - Rate limiting on auth endpoints                          │
│  - HTTPS encryption                                         │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                            │
│  - Row Level Security (RLS) on all tables                   │
│  - Security definer functions                               │
│  - Audit logging triggers                                   │
│  - Separate sensitive data storage                          │
└─────────────────────────────────────────────────────────────┘
```

### Sensitive Data Handling

| Data Type | Table | Access Level |
| :--- | :--- | :--- |
| Profile info | `profiles` | Own profile + same-gym staff |
| Member info | `members` | Gym staff with role permissions |
| Health conditions | `member_sensitive_data` | Admins/Owners only |
| Emergency contacts | `member_sensitive_data` | Admins/Owners only |
| Payment info | `payments` | Admin roles only |
| Audit logs | `audit_logs` | Gym owner/admin only |

## Security Disclosure

We believe in responsible disclosure and will:
- Credit security researchers (unless anonymity requested).
- Publish security advisories after patches are released.
- Maintain a security changelog.

Thank you for helping keep Nzila Gym Manager secure! 🔒
