# Default Data Seeding Issue - Analysis & Solution

## 🔴 Problem Summary

**Issue:** Disciplines table is empty, need to seed default data and connect all entities back together.

**Root Cause:** TypeScript errors in `useDisciplinesData.tanstack.tsx` prevent the hook from working correctly.

---

## 🔍 Findings

### 1. Database Schema Mismatch

**Hook expects:** `ranks` table
**Database has:** `discipline_ranks` table

```typescript
// Database actual table:
discipline_ranks: {
  discipline_id: string;
  level: number;
  color: string;
  // ...
}

// Hook interface:
Rank {
  discipline_id: string;
  level: number;
  color: string;
  // ...
}
```

**Result:** Hook has 30+ TypeScript errors because table names don't match.

---

### 2. Default Data Already Exists ✅

**File:** `src/lib/seedData.ts` (757 lines)

**Contains:**
- `DISCIPLINE_RANKS` - 9 martial arts with belt systems (BJJ, Judo, Muay Thai, etc.)
- `DEFAULT_WORKOUT_CATEGORIES` - 10 categories with:
  - 50+ disciplines
  - 50+ workouts
  - 50+ classes
  - 50+ exercises
- Helper functions:
  - `getAllDisciplines()` - Get all 50+ disciplines
  - `getDisciplineRanks()` - Get ranks for a discipline
  - `getAllWorkouts()`, `getAllClasses()`, `getAllExercises()`

---

### 3. GymSetupWizard Already Seeds Disciplines ✅

**File:** `src/modules/onboarding/components/GymSetupWizard.tsx`

**Lines 168-185:**
```typescript
// Seed default disciplines for the gym
const disciplines = getAllDisciplines();
const disciplineInserts = disciplines.map(d => ({
  gym_id: gym.id,
  name: d.name,
  description: d.description,
  category: d.category,
  is_active: true,
}));

await supabase.from('disciplines').insert(disciplineInserts);
```

**So disciplines SHOULD be seeded when gym is created!**

---

## 📋 Why Disciplines Are Empty

**Possible reasons:**
1. Gym was created BEFORE this feature existed
2. Onboarding didn't complete successfully (error thrown)
3. Disciplines were deleted manually
4. Database has no data at all (new database)

---

## ✅ Solution: Two-Part Fix

### Part 1: Fix TypeScript Errors in Hook

**File:** `src/hooks/useDisciplinesData.tanstack.tsx`

**Changes needed:**
1. Update Rank interface to match database schema
2. Change all `ranks` table references to `discipline_ranks`
3. Fix queryKey to use correct table name
4. Update mutation to use correct table

**Before:**
```typescript
export interface Rank {
  id: string;
  discipline_id: string;
  name: string;
  level: number;
  color: string;
  requirements: string | null;
  gym_id: string;
}

// Query uses wrong table
const { data: ranks } = await supabase
  .from('ranks') // ❌ Wrong table name
  .select('*')
```

**After:**
```typescript
export interface DisciplineRank {
  id: string;
  discipline_id: string;
  name: string;
  level: number;
  color: string;
  requirements: string | null;
  gym_id: string; // Remove if not in DB
  criteria: string | null; // Add this (DB has criteria)
}

// Query uses correct table
const { data: ranks } = await supabase
  .from('discipline_ranks') // ✅ Correct table name
  .select('*')
```

---

### Part 2: Add "Seed Default Disciplines" Feature

**File:** `src/hooks/useDisciplinesData.tanstack.tsx`

**Add mutation:**
```typescript
const seedAllDisciplines = useMutation({
  mutationFn: async () => {
    if (!gymId) throw new Error('Gym ID is required');

    // Get all default disciplines from seedData
    const defaultDisciplines = getAllDisciplines();

    // Get existing disciplines
    const { data: existing } = await supabase
      .from('disciplines')
      .select('name')
      .eq('gym_id', gymId);

    const existingNames = new Set(existing?.map(d => d.name) || []);

    // Only insert disciplines that don't exist
    const disciplinesToInsert = defaultDisciplines
      .filter(d => !existingNames.has(d.name))
      .map(d => ({
        gym_id: gymId,
        name: d.name,
        description: d.description,
        category: d.category,
        equipment: d.equipment,
        instructor_profile: d.instructorProfile,
        is_active: true,
      }));

    if (disciplinesToInsert.length === 0) {
      return { inserted: 0, message: 'All disciplines already exist' };
    }

    // Insert disciplines
    const { data: insertedDisciplines, error } = await supabase
      .from('disciplines')
      .insert(disciplinesToInsert)
      .select();

    if (error) throw error;

    // Auto-seed ranks for disciplines that have belt systems
    const disciplinesWithRanks = defaultDisciplines.filter(d =>
      hasBeltSystem(d.name)
    );

    for (const discipline of disciplinesWithRanks) {
      const createdDiscipline = insertedDisciplines?.find(
        d => d.name === discipline.name
      );

      if (createdDiscipline) {
        const defaultRanks = getDisciplineRanks(discipline.name);
        const ranksToInsert = defaultRanks.map(r => ({
          discipline_id: createdDiscipline.id,
          name: r.name,
          level: r.level,
          color: r.color,
          requirements: r.requirements,
        }));

        await supabase
          .from('discipline_ranks')
          .insert(ranksToInsert);
      }
    }

    return { inserted: disciplinesToInsert.length, seeded: disciplinesWithRanks.length };
  },
  onMutate: async () => {
    await queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
    await queryClient.invalidateQueries({ queryKey: ranksQueryKey });
  },
  onSuccess: (result) => {
    queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
    queryClient.invalidateQueries({ queryKey: ranksQueryKey });

    toast({
      title: 'Disciplines Seeded',
      description: `Added ${result.inserted} disciplines with ${result.seeded} rank systems`,
    });
  },
  onError: (error: Error) => {
    const appError = handleError(error, 'seedAllDisciplines');
    logError(appError);

    toast({
      title: 'Error Seeding Disciplines',
      description: getUserErrorMessage(appError),
      variant: 'destructive',
    });
  },
});
```

**Add to return:**
```typescript
return {
  // ...existing returns
  seedAllDisciplines, // Add this
};
```

---

### Part 3: Add UI Button to Disciplines Page

**File:** `src/pages/Disciplines.tsx`

**Add button near "Create Discipline" button:**
```tsx
<Button
  onClick={() => seedAllDisciplines.mutate()}
  disabled={loading || disciplines.length > 0}
  variant="outline"
>
  <Database className="w-4 h-4 mr-2" />
  Seed Default Disciplines
</Button>
```

**Only show if no disciplines exist:**
```tsx
{disciplines.length === 0 && (
  <Alert className="mb-4">
    <Database className="h-4 w-4" />
    <AlertTitle>No Disciplines Found</AlertTitle>
    <AlertDescription>
      Your gym has no disciplines. Click the button below to add default disciplines
      with pre-configured rank systems.
    </AlertDescription>
  </Alert>
)}
```

---

## 🎯 What This Will Connect

After seeding, all interactions will work:

### 1. Disciplines → Members
```
Members can be assigned to disciplines
↓
Track progress per discipline
↓
Show rank/belt per discipline
```

### 2. Disciplines → Ranks
```
Each discipline has rank system
↓
BJJ: White → Blue → Purple → Brown → Black
↓
Muay Thai: White → Yellow → Orange → ... → Black
```

### 3. Disciplines → Classes
```
Classes can be assigned to discipline
↓
"BJJ Fundamentals" assigned to "BJJ" discipline
↓
Calendar shows discipline per class
```

### 4. Disciplines → Workouts
```
Workout templates can be discipline-specific
↓
"Guard Passing Drills" for BJJ
↓
"Clinch Work" for Muay Thai
```

### 5. Disciplines → Trainers
```
Trainers can specialize in disciplines
↓
Coach Carlos teaches BJJ classes
↓
Coach Ana teaches Yoga classes
```

---

## 📊 Complete Data Flow

```
seedData.ts (Default Data)
  ↓
getAllDisciplines() - Returns 50+ disciplines
  ↓
  ↓
Seed to Database (disciplines table)
  ↓
  ↓
Auto-Seed Ranks (discipline_ranks table)
  ↓
  ↓
All entities can reference disciplines:
  - Members (member_ranks table)
  - Classes (classes table)
  - Workouts (workout_templates table)
  - Trainers (can filter by discipline)
```

---

## 🔧 Implementation Steps

### Step 1: Fix Hook TypeScript Errors
```bash
# Edit src/hooks/useDisciplinesData.tanstack.tsx
# - Change Rank interface to match database
# - Update all table references from 'ranks' to 'discipline_ranks'
# - Fix queryKey
# - Fix mutations
```

### Step 2: Add seedAllDisciplines Mutation
```bash
# Add seedAllDisciplines mutation to hook
# - Use getAllDisciplines() from seedData
# - Check existing disciplines
# - Insert missing ones
# - Auto-seed ranks for disciplines with belt systems
```

### Step 3: Update UI
```bash
# Edit src/pages/Disciplines.tsx
# - Add "Seed Default Disciplines" button
# - Show alert when no disciplines exist
# - Call seedAllDisciplines.mutate()
```

### Step 4: Test
```bash
npm run type-check
npm run build
npm run dev
# Test seeding feature
```

---

## 📋 Default Disciplines List

**From seedData.ts - 10 Categories:**

### Combat Sports / Martial Arts
- BJJ Gi (5 belts)
- BJJ No-Gi (5 belts)
- Judo (7 belts)
- Boxing (5 levels)
- Muay Thai (7 prajiads)
- Kickboxing (7 belts)
- Krav Maga (7 levels)
- Wrestling (5 levels)
- MMA (8 belts)

### Strength & Conditioning
- Barbell Weightlifting
- Olympic Lifting
- Functional Training
- Kettlebell Training
- Powerbuilding
- Bodybuilding
- TRX Training
- Strongman

### Cardiovascular Training
- Treadmill Endurance
- HIIT Treadmill
- Indoor Cycling/Spin
- Rowing Endurance
- SkiErg Programs
- And more...

### Group Fitness Classes
- Aerobics
- Step
- Zumba
- Afro-Fusion
- Kuduro Fitness
- Bootcamp
- And more...

### Mind-Body Practices
- Hatha Yoga
- Vinyasa Yoga
- Power Yoga
- Yin Yoga
- Restorative Yoga
- Pilates Mat
- And more...

### Gymnastics / Movement Arts
- Calisthenics Foundations
- Static Strength
- Handstand Training
- Rings Training
- And more...

### Indoor Sports / Court-Based
- Basketball
- Futsal
- Volleyball
- Padel
- Badminton
- And more...

### Aquatic Activities
- Learn-to-Swim
- Competitive Swim Training
- Aqua Aerobics
- Aqua Strength
- And more...

### Performance & Sport-Specific
- Speed Mechanics
- Agility Training
- Change of Direction
- Plyometrics
- And more...

### Special Population Training
- Senior Mobility
- Low-Impact Strength
- Kids Fitness
- Youth Agility
- And more...

---

## 🎯 Summary

**Problem:**
- Disciplines table empty
- Hook has TypeScript errors
- Default data not being used

**Solution:**
1. Fix hook to use correct table names (`discipline_ranks` not `ranks`)
2. Add `seedAllDisciplines` mutation to hook
3. Add "Seed Default Disciplines" button to UI
4. Auto-seed ranks for disciplines with belt systems

**Result:**
- ✅ All 50+ disciplines seeded
- ✅ Rank systems seeded for martial arts
- ✅ All interactions connected back together
- ✅ App fully functional

---

**Do you want me to implement this fix?** I'll need to:
1. Fix the TypeScript errors in useDisciplinesData.tanstack.tsx
2. Add the seedAllDisciplines mutation
3. Update the Disciplines page UI
