# Support

Thank you for using Nzila Gym Manager! Here's how to get help.

## 📚 Documentation

- **README.md** — Quick start and overview
- **CONTRIBUTING.md** — Development setup
- **SECURITY.md** — Security policy and recent fixes
- **SECURITY_HARDENING.md** — Comprehensive security implementation guide
- **[Wiki](https://github.com/clrogon/nzila-gym-manager/wiki)** — Detailed guides (when available)

## 🔐 Security Documentation

For security-related questions:

- **Security Policy**: [SECURITY.md](SECURITY.md)
- **Hardening Guide**: [SECURITY_HARDENING.md](SECURITY_HARDENING.md)
- **Recent Fixes**: See [CHANGELOG.md](CHANGELOG.md) v1.0.1

### Security Implementation Guide

If you're implementing security fixes:

1. Review the migration in `supabase/migrations/`
2. Follow the implementation steps in [SECURITY_HARDENING.md](SECURITY_HARDENING.md)
3. Update application code per the Members.tsx patterns
4. Test with different user roles

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/clrogon/nzila-gym-manager/issues/new) with:

- **Environment:** OS, browser, Node version
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)

## 💡 Feature Requests

Have an idea? [Create a feature request](https://github.com/clrogon/nzila-gym-manager/issues/new) with:

- **Problem statement:** What problem does this solve?
- **Proposed solution:** How would it work?
- **Alternatives considered:** What else did you think about?

## 💬 Community Support

- **GitHub Discussions:** [Ask questions](https://github.com/clrogon/nzila-gym-manager/discussions)
- **Discord:** [Join our server](#) *(add link when available)*

## 🚀 Commercial Support

For enterprise deployments and custom development:

📧 **support@gymmanager.local**  
🌐 **https://gymmanager.local**

## ⏱️ Response Times

- **Bug reports:** 1-3 business days
- **Feature requests:** 1-2 weeks for review
- **Security issues:** See [SECURITY.md](SECURITY.md) (24 hour response)

## ✅ Before Asking for Help

1. Search [existing issues](https://github.com/clrogon/nzila-gym-manager/issues)
2. Check [documentation](#)
3. Verify your `.env` configuration
4. Try with the latest version
5. Review [SECURITY_HARDENING.md](SECURITY_HARDENING.md) for security-related issues

## 🔍 Troubleshooting Common Issues

### Database/RLS Issues

If you're seeing "row-level security policy" errors:

1. Verify user has correct role in `user_roles` table
2. Check RLS policies are correctly applied
3. Ensure user is authenticated
4. Review the specific table's policies

### Sensitive Data Access

If health conditions or emergency contacts aren't visible:

1. User must have `admin` or `gym_owner` role
2. Data is now in `member_sensitive_data` table
3. Check `fetchMembers` in Members.tsx for implementation pattern

### Authentication Issues

1. Check Supabase auth configuration
2. Verify session tokens
3. Review rate limiting in `auth_rate_limits` table

Thank you for helping us improve Nzila! 💪
