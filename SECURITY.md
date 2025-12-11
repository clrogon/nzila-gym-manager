# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues via email to:

📧 **security@gymmanager.local** (or your actual contact)

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

1. Never commit API keys, tokens, or credentials
2. Always use `.env.example` for environment templates
3. Validate all user inputs with Zod schemas
4. Enable Supabase Row Level Security (RLS) on all tables
5. Use parameterized queries (Supabase handles this)
6. Follow OWASP Top 10 guidelines

## Known Security Considerations

### Authentication
- Uses Supabase Auth with JWT tokens
- Tokens expire after 1 hour (configurable)
- Refresh tokens stored in httpOnly cookies

### Database
- PostgreSQL via Supabase
- Row Level Security (RLS) enabled on all tables
- Parameterized queries prevent SQL injection

### Frontend
- Input validation via Zod schemas
- XSS prevention via React's built-in escaping
- CSRF protection via Supabase session tokens

## Security Disclosure

We believe in responsible disclosure and will:
- Credit security researchers (unless anonymity requested)
- Publish security advisories after patches are released
- Maintain a security changelog

Thank you for helping keep Nzila Gym Manager secure! 🔒
