# Quick Action Items - Immediate Fixes

## Priority 1: Security (Do Today)

```bash
# Fix security vulnerabilities
npm audit fix
```

## Priority 2: Testing Setup (Do This Week)

```bash
# Install missing test dependencies
npm install --save-dev happy-dom @testing-library/react @testing-library/jest-dom

# Create example test file
mkdir -p src/components/auth/__tests__
touch src/components/auth/__tests__/Login.test.tsx
```

## Priority 3: Critical ESLint Fixes (This Week)

### Fix 1: Remove setState in effects (2 files)
```typescript
// src/components/member/MemberForm.tsx:48
// src/contexts/SecureAuthContext.tsx:311
// Use proper dependency arrays or refactor to avoid setState in effects
```

### Fix 2: Fix variable hoisting (2 files)
```typescript
// src/components/training/PolymorphicWodBuilder.tsx:48
// src/components/training/TrainingLibraryView.tsx:64
// Move useEffect after function declarations
```

### Fix 3: Remove Math.random from render (1 file)
```typescript
// src/components/ui/sidebar.tsx:536
// Move randomization outside component or use proper state
```

## Priority 4: Type Safety Improvements (Next Sprint)

### Replace 'any' types in critical files (Top 10 priority)

1. `src/modules/booking/bookingService.ts` - 6 instances
2. `src/components/training/GymContentCrud.tsx` - 6 instances
3. `src/components/training/WorkoutTemplateBuilder.tsx` - 6 instances
4. `src/components/calendar/ClassDetailDialog.tsx` - 5 instances
5. `src/modules/booking/MemberBookings.tsx` - 4 instances
6. `src/components/training/PolymorphicWodBuilder.tsx` - 2 instances
7. `src/components/training/TrainingLibraryView.tsx` - 2 instances
8. `src/components/training/RankPromotion.tsx` - 1 instance
9. `src/components/training/PromotionCriteria.tsx` - 1 instance
10. `src/modules/kiosk/components/KioskInterface.tsx` - 2 instances

**Action:** Create proper TypeScript interfaces or types for these components

## Priority 5: Dependency Updates (Next Sprint)

```bash
# Update core dependencies
npm install react@19 react-dom@19
npm install -D @types/react@19 @types/react-dom@19

# Update TypeScript
npm install -D typescript@latest

# Update Supabase
npm install @supabase/supabase-js@latest

# Test thoroughly after updates
npm run type-check
npm run build
npm run lint
```

## Priority 6: Code Cleanup (Ongoing)

### Remove unused imports (60+ files)

Use automated fix:
```bash
npx eslint . --fix
```

### Fix React hook dependencies (25+ instances)

Use automated fix:
```bash
npx eslint . --fix
# Or manually review each instance
```

## Quick Wins (Can be done in parallel)

1. **Remove unused variables** - 60+ instances
2. **Add JSDoc comments** to complex functions
3. **Set up Prettier** for consistent formatting
4. **Add pre-commit hooks** (husky + lint-staged)
5. **Remove console.log** from production code (already configured)

## Verification Commands

Run these after fixes to verify:

```bash
# Check for remaining issues
npm run type-check
npm run lint
npm run test:run
npm run build

# Check for security issues
npm audit

# Check for outdated packages
npm outdated
```

## Estimated Timeline

| Priority | Tasks | Time Estimate |
|----------|-------|----------------|
| 1 - Security | Fix vulnerabilities | 30 minutes |
| 2 - Testing | Setup + basic tests | 1-2 days |
| 3 - Critical ESLint | Fix React hooks issues | 1 day |
| 4 - Type Safety | Replace top 10 any types | 3-5 days |
| 5 - Dependencies | Update + test | 2-3 days |
| 6 - Cleanup | Remove unused code | 2-3 days |

**Total:** ~2 weeks for full cleanup

## Success Criteria

✅ 0 security vulnerabilities
✅ 0 ESLint errors
✅ < 10 ESLint warnings
✅ 70%+ test coverage
✅ All dependencies up to date
✅ Zero `any` types in business logic
✅ All tests passing
✅ Build successful without warnings
