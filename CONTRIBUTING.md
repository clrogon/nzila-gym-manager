# Contributing to Nzila Gym Manager

Thank you for your interest in contributing to Nzila Gym Manager! We welcome contributions from the community and are grateful for your support.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Security Guidelines](#security-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to https://github.com/clrogon/nzila-gym-manager/issues.

---

## How Can I Contribute?

### **Reporting Bugs**
- Check if the bug has already been reported in [Issues](https://github.com/clrogon/nzila-gym-manager/issues)
- If not, create a new issue using the bug report template
- Include detailed steps to reproduce, expected behavior, and actual behavior
- Add screenshots or screen recordings if applicable

### **Suggesting Features**
- Review existing feature requests in [Discussions](https://github.com/clrogon/nzila-gym-manager/discussions)
- Create a new discussion with the "Feature Request" category
- Clearly describe the problem you're trying to solve
- Explain how your suggestion would benefit users

### **Contributing Code**
- Fix bugs listed in the Issues tracker
- Implement features from the roadmap
- Improve documentation
- Add or improve tests
- Refactor existing code for better maintainability

### **Improving Documentation**
- Fix typos or unclear explanations
- Add missing documentation
- Translate documentation to other languages
- Create tutorials or guides

---

## Development Setup

### **Prerequisites**
- Node.js 18+ (LTS recommended)
- npm or pnpm
- Git
- Supabase account (for database access)
- Code editor (VS Code recommended)

### **Initial Setup**

1. **Fork the repository**
   - Click "Fork" on the [GitHub repository](https://github.com/clrogon/nzila-gym-manager)

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nzila-gym-manager.git
   cd nzila-gym-manager
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/clrogon/nzila-gym-manager.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

6. **Run database migrations**
   - Access Supabase Studio
   - Execute migrations from `supabase/migrations/` in order

7. **Start development server**
   ```bash
   npm run dev
   ```

### **Recommended VS Code Extensions**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript + JavaScript
- GitLens
- Error Lens

---

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Write clean, maintainable code
   - Follow the coding standards below
   - Add tests for new features
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run lint        # Check for linting errors
   npm run type-check  # Validate TypeScript
   npm run test        # Run unit tests
   npm run build       # Ensure production build works
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add member export functionality"
   ```

5. **Keep your branch updated**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

---

## Coding Standards

### **TypeScript**
- Use strict mode (already configured)
- Define explicit types, avoid `any`
- Use interfaces for object shapes
- Use type unions for literals
- Prefer `const` over `let`, avoid `var`

### **React**
- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Use meaningful component names (PascalCase)
- Extract reusable logic into custom hooks
- Avoid prop drilling - use context when needed

### **File Organization**
```
src/
├── components/
│   └── members/
│       ├── MemberCard.tsx        # Component
│       ├── MemberCard.test.tsx   # Tests
│       └── index.ts              # Barrel export
├── hooks/
│   └── useMembers.ts             # Custom hooks
├── lib/
│   └── utils.ts                  # Utility functions
└── types/
    └── member.ts                 # Type definitions
```

### **Naming Conventions**
- **Components**: `PascalCase` (e.g., `MemberCard.tsx`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useMembers.ts`)
- **Utilities**: `camelCase` (e.g., `formatCurrency.ts`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_UPLOAD_SIZE`)
- **Types/Interfaces**: `PascalCase` (e.g., `MemberProfile`)

### **Styling**
- Use Tailwind utility classes
- Follow shadcn/ui component patterns
- Keep custom CSS minimal
- Use CSS modules for component-specific styles
- Maintain responsive design (mobile-first)

### **Comments**
- Write self-documenting code (clear variable/function names)
- Add comments for complex logic or business rules
- Use JSDoc for public API functions
- Avoid obvious comments

```typescript
// Bad
const m = members.filter(x => x.s === 'active'); // filter active members

// Good
const activeMembers = members.filter(member => member.status === 'active');

// Good (complex logic needs explanation)
/**
 * Calculates prorated membership fee based on days remaining in billing cycle.
 * Uses 30-day months for consistency across different month lengths.
 */
function calculateProratedFee(baseFee: number, daysRemaining: number): number {
  return (baseFee / 30) * daysRemaining;
}
```

---

## Security Guidelines

### **Critical Security Rules**

1. **Never store sensitive data in client-side storage**
   - No API keys in localStorage/sessionStorage
   - No admin checks using client-side data

2. **Always use RLS policies**
   - All new tables must have Row-Level Security enabled
   - Create appropriate policies for each operation (SELECT, INSERT, UPDATE, DELETE)

3. **Separate sensitive data**
   - Health conditions, emergency contacts → `member_sensitive_data` table
   - Use the established patterns in `Members.tsx`

4. **Use security definer functions**
   - For role checks: `has_gym_role()`, `is_super_admin()`
   - Prevents RLS recursion issues

5. **Validate all inputs**
   - Use Zod schemas for form validation
   - Sanitize before database operations

### **Security Review Checklist**

Before submitting a PR with database changes:

- [ ] RLS enabled on new tables
- [ ] Appropriate policies for all operations
- [ ] Sensitive data in separate secure tables
- [ ] No PII exposed in logs or error messages
- [ ] Uses existing security definer functions
- [ ] Audit logging for sensitive operations

See [SECURITY_HARDENING.md](SECURITY_HARDENING.md) for detailed security implementation patterns.

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### **Format**
```
<type>(<scope>): <subject>

<body>

<footer>
```

### **Types**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, config, etc.)
- `ci`: CI/CD changes
- `security`: Security fixes or improvements

### **Examples**
```bash
feat(members): add member export to CSV functionality

fix(calendar): resolve class overlap detection bug

docs(readme): update installation instructions

refactor(payments): simplify Multicaixa integration logic

test(auth): add unit tests for login flow

security(rls): add policies to member_sensitive_data table
```

### **Rules**
- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit first line to 72 characters
- Reference issues/PRs in footer when applicable

---

## Pull Request Process

1. **Ensure all checks pass**
   - Linting (ESLint)
   - Type checking (TypeScript)
   - Tests (Vitest)
   - Build (Vite)

2. **Update documentation**
   - Update README if adding features
   - Add JSDoc comments to new functions
   - Update CHANGELOG.md

3. **Fill out PR template**
   - Describe what changed and why
   - Link related issues
   - Add screenshots for UI changes
   - List breaking changes if any
   - Include security considerations if applicable

4. **Request review**
   - Tag relevant maintainers
   - Address review feedback promptly
   - Keep discussions professional

5. **Merge requirements**
   - At least 1 approval from maintainer
   - All CI checks passing
   - No merge conflicts
   - Up-to-date with main branch

---

## Reporting Bugs

### **Before Submitting**
- Check if the bug is already reported
- Test on the latest version
- Verify it's reproducible

### **Bug Report Template**
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable

## Environment
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120, Safari 17]
- Version: [e.g., 1.2.0]

## Additional Context
Any other relevant information
```

---

## Suggesting Features

### **Feature Request Template**
```markdown
## Problem Statement
Describe the problem this feature would solve

## Proposed Solution
Describe your proposed solution

## Alternatives Considered
What other solutions did you consider?

## Additional Context
Mockups, examples, or references

## Impact
Who would benefit from this feature?
```

---

## Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Please email security concerns to: **[your-security-email@example.com]**

See [SECURITY.md](SECURITY.md) for our security policy.

---

## Questions?

- **General Discussion**: [GitHub Discussions](https://github.com/clrogon/nzila-gym-manager/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/clrogon/nzila-gym-manager/issues)
- **Email**: [your-support-email@example.com]

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Nzila Gym Manager! 🎉**
