# JSDoc Documentation

## Table of Contents

1. [Custom Hooks](#custom-hooks)
   - [useMembersData](#useMembersData)
   - [useDisciplinesData](#useDisciplinesData)
   - [useRBAC](#useRBAC)
   - [useGym](#useGym)
   - [useAuth](#useAuth)
   - [useToast](#useToast)
   - [useMobile](#useMobile)

2. [Reusable Components](#reusable-components)
   - [MemberForm](#MemberForm)
   - [MemberList](#MemberList)
   - [MemberFiltersBar](#MemberFiltersBar)
   - [DisciplineForm](#DisciplineForm)
   - [DisciplineListItem](#DisciplineListItem)
   - [ErrorBoundary](#ErrorBoundary)
   - [ModuleLoader](#ModuleLoader)

3. [Service Functions](#service-functions)
   - [Error Handling](#error-handling)
   - [Tenant Isolation](#tenant-isolation)
   - [Schedule Validation](#schedule-validation)
   - [Recurring Class Service](#recurring-class-service)

---

## Custom Hooks

---

### useMembersData

**File:** `src/hooks/useMembersData.ts`

**Description:**
Custom hook for member data management using TanStack Query. Provides efficient caching, automatic refetching, and optimistic updates.

**Import:**
```typescript
import { useMembersData } from '@/hooks/useMembersData';
```

**Usage:**
```typescript
function MembersPage() {
  const { 
    members, 
    plans, 
    sensitiveDataMap, 
    loading,
    createMember, 
    updateMember, 
    deleteMember 
  } = useMembersData(currentGym?.id);

  const handleCreate = async (memberData: MemberFormData) => {
    await createMember(memberData);
  };

  const handleDelete = async (memberId: string) => {
    await deleteMember(memberId);
  };

  return (
    <div>
      <button onClick={() => createMember({ ...memberData })}>
        Create Member
      </button>
      <MemberList members={members} />
    </div>
  );
}
```

**API:**

| Property | Type | Description |
|----------|------|-------------|
| `members` | `Member[]` | Array of member objects (cached) |
| `plans` | `MembershipPlan[]` | Available membership plans (cached) |
| `sensitiveDataMap` | `Record<string, MemberSensitiveData>` | Sensitive data by member ID (cached) |
| `loadingMembers` | `boolean` | Members data loading state |
| `loadingPlans` | `boolean` | Plans data loading state |
| `loadingSensitive` | `boolean` | Sensitive data loading state |
| `loading` | `boolean` | Combined loading state |
| `createMember` | `Mutation` | Mutation to create new member |
| `updateMember` | `Mutation` | Mutation to update existing member |
| `deleteMember` | `Mutation` | Mutation to delete member |
| `refetchAll` | `Function` | Function to refetch all data |
| `membersError` | `Error | null` | Members error state |
| `plansError` | `Error | null` | Plans error state |
| `sensitiveError` | `Error | null` | Sensitive data error state |
| `cacheKeys` | `CacheKeys` | Cache key exposure for advanced use |

**Features:**
- TanStack Query caching (5 minutes for members, 10 for plans)
- Optimistic updates for instant UI feedback
- Automatic cache invalidation after mutations
- Toast notifications for all operations
- Error handling with typed errors
- Permission-aware data fetching

---

### useDisciplinesData

**File:** `src/hooks/useDisciplinesData.ts`

**Description:**
Custom hook for discipline and rank data management using TanStack Query. Provides efficient caching, automatic refetching, and optimistic updates.

**Import:**
```typescript
import { useDisciplinesData } from '@/hooks/useDisciplinesData';
```

**Usage:**
```typescript
function DisciplinesPage() {
  const { 
    disciplines, 
    ranks, 
    ranksByDiscipline, 
    loading, 
    createDiscipline, 
    createRank, 
    deleteDiscipline, 
    seedRanks 
  } = useDisciplinesData(currentGym?.id);

  return (
    <div>
      <button onClick={() => createDiscipline({ 
        name: 'Brazilian Jiu-Jitsu',
        category: 'Combat Sports / Martial Arts'
      })}>
        Add Discipline
      </button>
      <DisciplineList disciplines={disciplines} ranks={ranks} />
    </div>
  );
}
```

**API:**

| Property | Type | Description |
|----------|------|-------------|
| `disciplines` | `Discipline[]` | Array of discipline objects (cached) |
| `ranks` | `Rank[]` | Array of rank objects (cached) |
| `ranksByDiscipline` | `Record<string, Rank[]>` | Ranks indexed by discipline ID (memoized) |
| `loadingDisciplines` | `boolean` | Disciplines data loading state |
| `loadingRanks` | `boolean` | Ranks data loading state |
| `loading` | `boolean` | Combined loading state |
| `createDiscipline` | `Mutation` | Mutation to create new discipline |
| `updateDiscipline` | `Mutation` | Mutation to update existing discipline |
| `deleteDiscipline` | `Mutation` | Mutation to delete discipline |
| `toggleDisciplineStatus` | `Mutation` | Mutation` to toggle discipline active status |
| `createRank` | `Mutation` | Mutation to create new rank |
| `updateRank` | `Mutation` | Mutation to update existing rank |
| `deleteRank` | `Mutation` | Mutation to delete rank |
| `seedRanks` | `Mutation` | Mutation to seed default ranks for discipline |
| `refetchAll` | `Function` | Function to refetch all data |

**Features:**
- TanStack Query caching (10 minutes for disciplines, 15 for ranks)
- Optimistic updates for instant UI feedback
- Automatic cache invalidation after mutations
- Memoized `ranksByDiscipline` for efficient lookups
- Toast notifications for all operations
- Error handling with typed errors
- Support for seeding default rank systems (BJJ, Judo, etc.)

---

### useRBAC

**File:** `src/hooks/useRBAC.ts`

**Description:**
Role-Based Access Control (RBAC) system following international gym management standards (IHRSA, ACE, NASM). Provides role checking, permission verification, and role hierarchy access.

**Import:**
```typescript
import { useRBAC } from '@/hooks/useRBAC';
```

**Usage:**
```typescript
function AdminPanel() {
  const { isAdmin, hasPermission, currentRole } = useRBAC();
  
  if (!isAdmin) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      {hasPermission('members:delete') && (
        <DeleteButton />
      )}
      {hasPermission('members:read') && (
        <MembersList />
      )}
    </div>
  );
}
```

**API:**

| Property | Type | Description |
|----------|------|-------------|
| `isSuperAdmin` | `boolean` | User is platform super admin |
| `isGymOwner` | `boolean` | User owns current gym |
| `isAdmin` | `boolean` | User has admin privileges |
| `isStaff` | `boolean` | User has staff privileges |
| `isTrainer` | `boolean` | User has trainer permissions |
| `currentRole` | `AppRole \|\`null\` | User's current role in selected gym |
| `allRoles` | `Array<{ gymId: string \|\`null\`, role: AppRole, isTrainer: boolean }>\` | All roles user has across gyms |
| `hasPermission(permission: string): boolean` | Check if user has specific permission |
| `hasAnyPermission(permissions: string[]): boolean` | Check if user has ANY of specified permissions |
| `hasAllPermissions(permissions: string[]): boolean` | Check if user has ALL of specified permissions |
| `hasRole(roles: AppRole[]): boolean` | Check if user has ANY of specified roles |
| `hasMinimumRole(minimumRole: AppRole): boolean` | Check if user meets minimum role level |
| `loading` | `boolean` | Initial role data loading state |

**Supported Roles:**
- `super_admin` - Platform administrator
- `gym_owner` - Gym owner
- `manager` - Gym manager
- `admin` - Admin
- `coach` - Coach (can create classes, train members)
- `trainer` - Trainer (can update member workouts)
- `instructor` - Instructor (can teach classes)
- `physiotherapist` - Physiotherapist (can view medical data)
- `nutritionist` - Nutritionist (can view diet plans)
- `receptionist` - Receptionist (can manage check-ins)
- `staff` - Staff member
- `member` - Regular gym member

**Permissions:**
- `members:create`, `members:read`, `members:update`, `members:delete`
- `checkins:create`, `checkins:read`, `checkins:update`, `checkins:delete`
- `payments:create`, `payments:read`, `payments:update`
- `classes:create`, `classes:read`, `classes:update`, `classes:delete`
- `training:create`, `training:read`, `training:update`, `training:delete`
- `finance:create`, `finance:read`, `finance:update`, `finance:delete`
- `staff:create`, `staff:read`, `staff:update`, `staff:delete`
- `settings:read`, `settings:update`
- `reports:read`
- `audit:read`

---

### useGym

**File:** `src/contexts/GymContext.tsx`

**Description:**
Gym context provider for multi-tenant SaaS architecture. Manages current gym selection and user's assigned gyms.

**Import:**
```typescript
import { useGym } from '@/contexts/GymContext';
```

**Usage:**
```typescript
function Dashboard() {
  const { currentGym, gyms, userRoles, setCurrentGym } = useGym();
  
  return (
    <div>
      <GymSelector 
        currentGym={currentGym}
        gyms={gyms}
        onSelect={setCurrentGym}
      />
      <DashboardContent gymId={currentGym?.id} />
    </div>
  );
}
```

**API:**

| Property | Type | Description |
|----------|------|-------------|
| `currentGym` | `Gym \|\`null\`` | Currently selected gym |
| `gyms` | `Gym[]` | All gyms user has access to |
| `userRoles` | `UserRole[]` | User's roles across gyms |
| `loading` | `boolean` | Gyms loading state |
| `setCurrentGym(gym: Gym)` | `Function` | Set current gym |
| `hasRole(roles: string[]): boolean` | Check if user has role in current gym |
| `refreshGyms()` | `Function` | Refresh gyms list |

---

### useAuth

**File:** `src/contexts/AuthContext.tsx`

**Description:**
Authentication context manager handling sign in, sign up, and session management with rate limiting and session expiry tracking.

**Import:**
```typescript
import { useAuth } from '@/contexts/AuthContext';
```

**Usage:**
```typescript
function LoginPage() {
  const { user, session, signIn, signUp, signOut, sessionExpiresIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
```

**API:**

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \|\`null\`` | Authenticated user object |
| `session` | `Session \|\`null\`` | Supabase session object |
| `loading` | `boolean` | Auth loading state |
| `signIn(email, password)` | `Promise<{ error: Error \|\`null\`\` | Sign in with email and password |
| `signUp(email, password, fullName)` | `Promise<{ error: Error \|\` null\`\` | Sign up new user |
| `signInWithMagicLink(email)` | `Promise<{ error: Error \|\`null\`\` | Sign in with magic link |
| `signInWithGoogle()` | `Promise<{ error: Error \|\` null\`\` | Sign in with Google OAuth |
| `signOut()` | `Promise<void>` | Sign out user |
| `refreshSession()` | `Promise<boolean>` | Refresh session token |
| `sessionExpiresIn` | `number \|\`null\`\` | Milliseconds until session expires |

**Features:**
- Rate limiting on sign in attempts (5 attempts per 15 minutes)
- Automatic token refresh
- Session expiry tracking with warnings
- Auth event logging
- Password strength validation

---

### useToast

**File:** `src/hooks/use-toast.ts`

**Description:**
Toast notification hook using Sonner for beautiful, accessible toast notifications.

**Import:**
```typescript
import { useToast } from '@/hooks/use-toast';
```

**Usage:**
```typescript
function MyComponent() {
  const { toast } = useToast();
  
  const showSuccess = () => {
    toast({
      title: 'Success',
      description: 'Operation completed successfully',
    });
  };

  return (
    <button onClick={showSuccess}>
      Show Success Toast
    </button>
  );
}
```

**API:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `toast({ title, description, variant, ... })` | Toast options object |

**Variants:**
- `default` - Default toast
- `destructive` - Error toast (red)

---

### useMobile

**File:** `src/hooks/use-mobile.tsx`

**Description:**
Responsive design hook for detecting mobile devices.

**Import:**
```typescript
import { useMobile } from '@/hooks/use-mobile';
```

**Usage:**
```typescript
function ResponsiveComponent() {
  const isMobile = useMobile();
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
}
```

---

## Reusable Components

---

### MemberForm

**File:** `src/components/member/MemberForm.tsx`

**Description:**
Reusable form component for creating and editing gym members with proper typing and validation.

**Import:**
```typescript
import { MemberForm } from '@/components/member/MemberForm';
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `memberData` | `MemberFormData` | No | Member data to pre-fill form |
| `onSave` | `(data: MemberFormData) => Promise<void>` | Yes | Callback when form is submitted |
| `onCancel` | `() => void` | Yes | Callback when cancel is clicked |
| `isEditing` | `boolean` | No | Whether form is in edit mode |

**Usage:**
```typescript
import { MemberForm } from '@/components/member/MemberForm';

function CreateMemberDialog() {
  const handleSave = async (data: MemberFormData) => {
    await createMember(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <MemberForm
        onSave={handleSave}
        onCancel={onClose}
      />
    </Dialog>
  );
}
```

**Features:**
- Complete form with all member fields
- Proper TypeScript typing
- Integrated with form validation
- Responsive layout
- Error display
- Two-column grid for basic info
- Emergency contact section
- Membership selection
- Dependent member support

---

### MemberList

**File:** `src/components/member/MemberList.tsx` (original)  
**File:** `src/components/member/MemberList.virtual.tsx` (with virtual scrolling)

**Description:**
Display members in a table format. Two versions available:
- Original: Renders all members
- Virtual: Only renders visible items (recommended for 1000+ members)

**Import:**
```typescript
import { MemberList } from '@/components/member/MemberList';
// Or for virtual scrolling:
import { MemberList } from '@/components/member/MemberList.virtual';
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `members` | `Member[]` | Yes | Array of member objects |
| `onEdit` | `(member: Member) => void` | Yes | Edit button click handler |
| `onView` | `(member: Member) => void` | Yes | View button click handler |
| `onDelete` | `(memberId: string) => void` | Yes | Delete button click handler |
| `loading` | `boolean` | No | Loading state |

**Usage:**
```typescript
function MembersPage() {
  const { members, loading, onEdit, onDelete } = useMembersData(currentGym?.id);

  return (
    <MemberList
      members={members}
      onEdit={onEdit}
      onView={(member) => console.log('View', member)}
      onDelete={onDelete}
      loading={loading}
    />
  );
}
```

**Features:**
- Table display with sorting
- Avatar display with initials
- Status badges with colors
- Action buttons (View, Edit, Delete)
- Loading state
- Empty state
- React.memo on list items (prevents re-renders)
- Virtual scrolling version for large lists (97% fewer DOM nodes)

---

### MemberFiltersBar

**File:** `src/components/member/MemberFilters.tsx`

**Description:**
Filter component for searching and filtering members with debounced search.

**Import:**
```typescript
import { MemberFiltersBar } from '@/components/member/MemberFilters';
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `filters` | `MemberFilters` | Yes | Current filter values |
| `onFilterChange` | `(filters: MemberFilters) => void` | Yes | Filter change callback |
| `memberCount` | `number` | Yes | Total member count to display |

**Usage:**
```typescript
function MembersPage() {
  const [filters, setFilters] = useState<MemberFilters>({
    searchQuery: '',
    statusFilter: 'all',
  });

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (filters.statusFilter !== 'all' && m.status !== filters.statusFilter) {
        return false;
      }
      if (filters.searchQuery && !m.full_name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [members, filters]);

  return (
    <MemberFiltersBar
      filters={filters}
      onFilterChange={setFilters}
      memberCount={filteredMembers.length}
    />
  );
}
```

**Features:**
- Debounced search (300ms delay)
- Status dropdown filter
- Member count display
- React.memo (prevents unnecessary re-renders)
- Responsive layout

---

### ErrorBoundary

**File:** `src/components/common/ErrorBoundary.tsx`

**Description:**
React error boundary that catches JavaScript errors in component tree and displays fallback UI.

**Import:**
```typescript
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | Child components to wrap |
| `fallback` | `ReactNode` | No | Custom fallback UI |
| `moduleName` | `string` | No | Module name for error context |
| `onReset` | `() => void` | No | Callback when user clicks "Try Again" |

**Usage:**
```typescript
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary moduleName="App">
      <Dashboard />
    </ErrorBoundary>
  );
}
```

**Features:**
- Catches React errors
- Displays user-friendly error messages
- "Try Again" button to retry
- Sentry integration ready
- Development mode shows error details
- Rest of app continues to work (error isolation)

---

### ModuleLoader

**File:** `src/components/common/ModuleLoader.tsx`

**Description:**
Loading spinner component for indicating async operations.

**Import:**
```typescript
import { ModuleLoader } from '@/components/common/ModuleLoader';
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `message` | `string` | No | Loading message to display |

**Usage:**
```typescript
function DataFetchingComponent() {
  const { data, loading } = useMembersData(currentGym?.id);
  
  if (loading) {
    return <ModuleLoader message="Loading data..." />;
  }
  
  return <div>{/* data */}</div>;
}
```

**Features:**
- Animated loading spinner
- Custom message support
- Consistent styling
- Lightweight (~45 lines)

---

## Service Functions

---

### Error Handling

**File:** `src/types/errors.ts`

**Description:**
Centralized error type system with typed error classes and error handling utilities.

**Functions:**

| Function | Description |
|----------|-------------|
| `handleError(error: unknown, context?: string): AppError` | Converts unknown errors to typed AppError instances |
| `isSupabaseError(error: unknown): error is SupabaseError` | Type guard for Supabase errors |
| `getUserErrorMessage(error: AppError): string` | Returns user-friendly error messages |
| `logError(error: AppError, context?: string): void` | Logs error to monitoring service (Sentry-ready) |

**Error Classes:**
- `AppError` - Base error class with code, statusCode, details
- `NetworkError` - Network-related errors
- `ValidationError` - Form/input validation failures
- `AuthError` - Authentication/login/signup failures
- `AuthorizationError` - Permission denials
- `NotFoundError` - Missing resources
- `RateLimitError` - Rate limit exceeded

**Usage:**
```typescript
import { handleError, logError } from '@/types/errors';

try {
  await someOperation();
} catch (error) {
  const appError = handleError(error, 'someOperation');
  logError(appError);
  toast({
    title: 'Error',
    description: getUserErrorMessage(appError),
    variant: 'destructive'
  });
}
```

---

### Tenant Isolation

**File:** `src/utils/tenantIsolation.ts`

**Description:**
Utilities for enforcing tenant isolation in multi-tenant SaaS architecture.

**Functions:**

| Function | Description |
|----------|-------------|
| `validateTenantAccess(gymId: string)` | Validates if user has access to gym |
| `logPlatformAction(action: string, metadata?: any)` | Logs platform-level audit events |

**Usage:**
```typescript
import { validateTenantAccess, logPlatformAction } from '@/utils/tenantIsolation';

async function deleteGym(gymId: string) {
  // Validate user has access
  await validateTenantAccess(gymId);
  
  // Delete gym
  await deleteGymById(gymId);
  
  // Log action for audit
  logPlatformAction('GYM_DELETED', { gymId });
}
```

---

### Schedule Validation

**File:** `src/utils/scheduleValidation.ts`

**Description:**
Utility functions for validating class schedules and preventing overlaps.

**Functions:**

| Function | Description |
|----------|-------------|
| `checkLocationOverlap(schedules: Schedule[])` | Checks for location conflicts |
| `checkCoachOverlap(schedules: Schedule[])` | Checks for coach availability |

**Usage:**
```typescript
import { checkLocationOverlap, checkCoachOverlap } from '@/utils/scheduleValidation';

const hasConflict = checkLocationOverlap(newClass, existingClasses);
if (hasConflict) {
  showErrorMessage('Location conflict detected');
}
```

---

### Recurring Class Service

**File:** `src/services/recurringClassService.ts`

**Description:**
Service for managing recurring class schedules and series.

**Functions:**

| Function | Description |
|----------|-------------|
| `createRecurringSeries(schedule)` | Creates a recurring class series |
| `deleteSeries(seriesId)` | Deletes an entire series |
| `updateSingleClass(classId, data)` | Updates a single class in a series |
| `getUpcomingClasses()` | Gets all upcoming classes |

**Usage:**
```typescript
import { createRecurringSeries } from '@/services/recurringClassService';

const schedule = {
  title: 'Morning Yoga',
  startTime: '08:00',
  recurrenceRule: 'FREQ=DAILY',
};

await createRecurringSeries(schedule);
```

---

## Best Practices

### When Using These Hooks:

1. **useMembersData / useDisciplinesData:**
   - Always use the `loading` state to show loading indicators
   - Use optimistic updates for better UX
   - Let TanStack Query handle caching automatically
   - Use the returned `membersError` state for error display

2. **useRBAC:**
   - Always check permissions before showing sensitive data
   - Use `hasPermission()` for granular permission checks
   - Use `hasMinimumRole()` for role-based access

3. **useAuth:**
   - Monitor `sessionExpiresIn` for session warnings
   - Implement logout on session expiry
   - Use `signInWithMagicLink` for passwordless auth

4. **Error Handling:**
   - Always wrap operations in try-catch
   - Use `handleError()` to convert errors
   - Use `getUserErrorMessage()` for user-facing messages
   - Use `logError()` for logging

### When Using These Components:

1. **MemberList:**
   - Use virtual scrolling version for 1000+ members
   - Use original version for smaller lists
   - Wrap in ErrorBoundary

2. **MemberForm:**
   - Always provide `onCancel` handler
   - Always provide `onSave` with error handling
   - Use proper validation schemas

3. **ErrorBoundary:**
   - Wrap entire feature sections
   - Provide clear error messages
   - Include "Try Again" button
   - Use descriptive `moduleName` prop

---

## TypeScript Type System

### Type Definitions Location:

All type definitions are organized in:
- `src/types/errors.ts` - Error types
- `src/hooks/useMembersData.ts` - Member-related types
- `src/hooks/useDisciplinesData.ts` - Discipline/rank types
- `src/integrations/supabase/types.ts` - Database types (auto-generated)

### Type Naming Conventions:

- **Interfaces:** PascalCase (e.g., `Member`, `Discipline`, `MembershipPlan`)
- **Form Types:** `[Entity]FormData` (e.g., `MemberFormData`)
- **Props:** `[ComponentName]Props` (e.g., `MemberFormProps`)
- **Hook Returns:** `use[HookName]Return` (e.g., `useMembersDataReturn`)

### Common Patterns:

```typescript
// Data type
export interface Entity {
  id: string;
  created_at: string;
  updated_at: string;
  // ... fields
}

// Form data type
export interface EntityFormData {
  name: string;
  // ... form fields
}

// Component props
export interface ComponentProps {
  data: Entity[];
  onSave: (data: EntityFormData) => Promise<void>;
  onCancel: () => void;
}

// Hook return type
export interface UseHookReturn {
  data: Entity[];
  loading: boolean;
  create: (data: EntityFormData) => Promise<void>;
  update: (id: string, data: Partial<Entity>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}
```

---

## Performance Considerations

### Virtual Scrolling:

Use `MemberList.virtual` when:
- List size > 500 items
- Rendering is slow (check React DevTools Profiler)
- Memory usage is high

### Caching with TanStack Query:

All data fetching hooks use these cache settings:
- `staleTime: 5 * 60 * 1000` (5 minutes)
- `gcTime: 10 * 60 * 1000` (10 minutes)
- `refetchOnWindowFocus: false` (reduces unnecessary requests)
- `retry: 1` (only retry once on failure)

### Memoization:

Components use these patterns:
- `React.memo` for list items
- `useMemo` for expensive calculations
- `useCallback` for event handlers
- Proper dependency arrays

---

## Examples

### Example 1: Complete Member Management Page

```typescript
import { MembersManagementPage } from '@/pages/staff/MembersManagement';
import { useDisciplinesData } from '@/hooks/useDisciplinesData';
import { useRBAC } from '@/hooks/useRBAC';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary moduleName="App">
      <MembersManagementPage />
    </ErrorBoundary>
  );
}
```

### Example 2: Optimized Data Fetching

```typescript
import { useMembersData } from '@/hooks/useMembersData';

function MembersPage() {
  const { 
    members, 
    loading, 
    createMember, 
    updateMember, 
    deleteMember 
  } = useMembersData(currentGym?.id);

  // TanStack Query handles:
  // - Automatic caching
  // - Automatic refetching
  // - Optimistic updates
  // - Error handling
  // - Toast notifications

  const handleCreate = async (memberData: MemberFormData) => {
    await createMember(memberData);
    // No need to manually refetch - TanStack Query handles it
    // No need to show loading state - use the returned loading state
  };

  return (
    <MemberList 
      members={members}
      onCreate={handleCreate}
      loading={loading}
    />
  );
}
```

### Example 3: Virtual Scrolling for Large Lists

```typescript
import { MemberList } from '@/components/member/MemberList.virtual';

function LargeMembersPage() {
  const { members } = useMembersData(currentGym?.id);
  
  // This automatically implements virtual scrolling
  // Renders only ~25 items regardless of total count
  // Provides constant 60fps scrolling
  // Uses 97% less DOM nodes
  
  return <MemberList members={members} />;
}
```

---

## Troubleshooting

### Common Issues and Solutions:

**Issue:** "Data not updating after mutation"  
**Solution:** TanStack Query automatically refetches after mutations. If manual refresh needed, use `refetchAll()`.

**Issue:** "Too many re-renders"  
**Solution:** Use React.memo on list items and proper dependency arrays.

**Issue:** "Slow initial load"  
**Solution:** Lazy loading is enabled in App.tsx. Routes load on-demand.

**Issue:** "Virtual scrolling not working"  
**Solution:** Ensure parent container has fixed height and `overflow: auto`.

**Issue:** "Cache not invalidating"  
**Solution:** Use the provided mutations (`createMember`, `updateMember`, `deleteMember`) - they handle cache invalidation automatically.

---

## Migration Guide

### From useState to useQuery:

**Before:**
```typescript
const [members, setMembers] = useState<Member[]>([]);
const [loading, setLoading] = useState(true);

const fetchMembers = async () => {
  setLoading(true);
  const { data } = await supabase.from('members').select('*');
  setMembers(data || []);
  setLoading(false);
};
```

**After:**
```typescript
const { members, loading, refetch } = useQuery({
  queryKey: ['members', gymId],
  queryFn: async () => {
    const { data } = await supabase.from('members').select('*');
    return data || [];
  },
});

// To refetch:
const handleRefresh = () => refetch();
```

### From Manual Error Handling to Typed Errors:

**Before:**
```typescript
} catch (error: any) {
  console.error('Error:', error);
  toast({ title: 'Error', description: error.message });
}
```

**After:**
```typescript
} catch (error) {
  const appError = handleError(error, 'operationName');
  logError(appError);
  toast({ 
    title: 'Error', 
    description: getUserErrorMessage(appError),
    variant: 'destructive' 
  });
}
```

---

## Additional Resources

### Internal Documentation:
- `SECURITY.md` - Security best practices
- `SECURITY_HARDENING.md` - Security hardening guide
- `SECURITY_IMPLEMENTATION.md` - Security implementation details

### External Documentation:
- [React](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/)
- [Supabase](https://supabase.com/docs)
- [Radix UI](https://www.radix-ui.com/)

---

**Last Updated:** January 7, 2026  
**Version:** 1.0.0
**Maintainer:** Development Team
