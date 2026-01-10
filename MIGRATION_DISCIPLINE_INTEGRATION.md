# Discipline Integration - Database Migration

**Migration ID:** 20260110000000_discipline_integration
**Created:** 2026-01-10

## 📋 Overview

This migration establishes proper business logic relationships between disciplines, exercises, workouts, trainers, and members. It addresses critical audit findings where discipline status changes should cascade to related content.

---

## 🔴 Issues Addressed

### 1. Exercises Not Linked to Disciplines
**Problem:** Exercises used generic categories without discipline association. When a discipline was disabled, its exercises remained visible.

**Fix:** Add `discipline_id` to `gym_exercises` table

### 2. Workouts Not Linked to Disciplines
**Problem:** Workout templates had no discipline relationship, allowing any workout to be assigned to any class.

**Fix:** Add `discipline_id` to `workout_templates` table

### 3. No Trainer Skills/Discipline Associations
**Problem:** Any coach could be assigned to teach any discipline, regardless of qualifications.

**Fix:** Create `trainer_disciplines` join table with certification tracking

### 4. No Member Discipline Preferences
**Problem:** No way to track which disciplines a member participates in.

**Fix:** Create `member_disciplines` table for member discipline tracking

---

## 🗄️ Schema Changes

### Table: `gym_exercises`
```sql
ALTER TABLE gym_exercises ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES disciplines(id) ON DELETE SET NULL;
```

**Details:**
- Links exercise to a specific discipline
- `ON DELETE SET NULL`: If discipline is deleted, exercise remains but discipline reference is cleared
- Allows filtering exercises by discipline and respecting `is_active` status

### Table: `workout_templates`
```sql
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES disciplines(id) ON DELETE SET NULL;
```

**Details:**
- Links workout template to a specific discipline
- Enables discipline validation when assigning workouts to classes
- Prevents mismatched assignments (e.g., Yoga workout to Jiu-Jitsu class)

### Table: `trainer_disciplines` (NEW)
```sql
CREATE TABLE trainer_disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  certified BOOLEAN DEFAULT false,
  certification_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, discipline_id)
);
```

**Details:**
- **Purpose:** Tracks which disciplines a trainer is qualified/certified to teach
- **`certified`:** Whether trainer has formal certification
- **`certification_date`:** Date when certification was obtained
- **`notes`:** Additional info about qualification
- **UNIQUE constraint:** Prevents duplicate entries for same user/discipline

**Business Rules:**
1. Trainers can only be assigned to classes in disciplines they're certified for
2. Warning shown if assigning to non-certified discipline
3. Admins can override if needed

### Table: `member_disciplines` (NEW)
```sql
CREATE TABLE member_disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, discipline_id)
);
```

**Details:**
- **Purpose:** Tracks which disciplines a member participates in
- **`is_primary`:** Member's main discipline (for billing, priority scheduling, etc.)
- **`joined_at`:** When member started in this discipline
- **UNIQUE constraint:** Prevents duplicate entries

**Use Cases:**
1. Filter workout assignments by member's disciplines
2. Show member's activity across disciplines
3. Determine primary discipline for promotions

---

## 📊 Indexes Added

```sql
CREATE INDEX idx_gym_exercises_discipline_id ON gym_exercises(discipline_id);
CREATE INDEX idx_gym_exercises_gym_discipline ON gym_exercises(gym_id, discipline_id);
CREATE INDEX idx_workout_templates_discipline_id ON workout_templates(discipline_id);
CREATE INDEX idx_workout_templates_gym_discipline ON workout_templates(gym_id, discipline_id);
CREATE INDEX idx_trainer_disciplines_user_id ON trainer_disciplines(user_id);
CREATE INDEX idx_trainer_disciplines_discipline_id ON trainer_disciplines(discipline_id);
CREATE INDEX idx_member_disciplines_member_id ON member_disciplines(member_id);
CREATE INDEX idx_member_disciplines_discipline_id ON member_disciplines(discipline_id);
```

**Purpose:**
- Optimize queries filtering by discipline
- Speed up lookups of trainer/member disciplines
- Enable efficient JOIN operations

---

## 🔐 Row Level Security (RLS) Policies

### Trainer Disciplines Table

**View:** Gym owners/managers can view all trainer certifications for their gym
```sql
CREATE POLICY "Gym owners can view all trainer disciplines for their gym"
  ON trainer_disciplines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = trainer_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin')
    )
    OR user_id = auth.uid()
  );
```

**Manage:** Gym owners can add/update/delete certifications
```sql
CREATE POLICY "Gym owners can insert trainer disciplines for their gym"
  ON trainer_disciplines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = trainer_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin')
    )
  );
```

### Member Disciplines Table

**View:** Gym staff and member can see member's disciplines
```sql
CREATE POLICY "Gym owners can view all member disciplines for their gym"
  ON member_disciplines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.gym_id = (
        SELECT d.gym_id FROM disciplines d WHERE d.id = member_disciplines.discipline_id
      )
      AND user_roles.role IN ('gym_owner', 'manager', 'admin', 'coach', 'trainer')
    )
    OR member_id = (
      SELECT m.id FROM members m
      JOIN user_roles ur ON ur.user_id = m.user_id
      WHERE ur.user_id = auth.uid()
    )
  );
```

---

## 🔄 Trigger

### Updated At Timestamp for Trainer Disciplines

```sql
CREATE OR REPLACE FUNCTION update_trainer_disciplines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trainer_disciplines_updated_at
  BEFORE UPDATE ON trainer_disciplines
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_disciplines_updated_at();
```

**Purpose:** Automatically update `updated_at` on record modification

---

## 📝 Table Comments

```sql
COMMENT ON TABLE trainer_disciplines IS
'Stores trainer skills and discipline certifications. Links trainers to disciplines they are qualified to teach.';

COMMENT ON TABLE member_disciplines IS
'Stores member discipline preferences. Tracks which disciplines a member participates in, including their primary discipline.';

COMMENT ON COLUMN trainer_disciplines.certified IS
'Whether trainer has a formal certification in this discipline';

COMMENT ON COLUMN trainer_disciplines.certification_date IS
'Date when trainer obtained certification in this discipline';

COMMENT ON COLUMN member_disciplines.is_primary IS
'Whether this is member''s main discipline (e.g., for billing, priority scheduling)';
```

---

## ✅ Business Logic Impact

### Before Migration
```
1. Disable "Jiu-Jitsu" discipline
   → Jiu-Jitsu classes hidden from calendar ✓
   → Jiu-Jitsu exercises STILL visible ✗
   → Jiu-Jitsu workouts STILL visible ✗
   → Any coach can teach "Jiu-Jitsu" ✗

2. Create class: "Jiu-Jitsu Basics"
   → Assign "Yoga" workout to it
   → System allows it ✗ (bad for business logic)
```

### After Migration
```
1. Disable "Jiu-Jitsu" discipline
   → Jiu-Jitsu classes hidden from calendar ✓
   → Jiu-Jitsu exercises hidden from library ✓
   → Jiu-Jitsu workouts hidden from training ✓
   → Only certified coaches can teach "Jiu-Jitsu" ✓

2. Create class: "Jiu-Jitsu Basics"
   → Try to assign "Yoga" workout
   → System warns: "Workout discipline (Yoga) doesn't match class discipline (Jiu-Jitsu)"
   → Suggests Jiu-Jitsu workouts instead ✓

3. Assign coach to class
   → Filter coaches by discipline
   → Only show certified trainers ✓
   → Can override with warning ✓
```

---

## 🚀 How to Apply

### Option 1: Supabase Dashboard
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste migration file content
4. Click "Run"

### Option 2: Supabase CLI
```bash
# If database is linked
supabase db push --linked

# Or apply specific migration
supabase migration up --file supabase/migrations/20260110000000_discipline_integration.sql
```

### Option 3: Direct SQL
```bash
# Using psql
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20260110000000_discipline_integration.sql
```

---

## ⚠️ Important Notes

### Backwards Compatibility
- **`discipline_id` is NULLABLE**: Existing exercises/workouts won't break
- **No data loss**: All existing records remain valid
- **Gradual migration**: Can populate `discipline_id` over time

### Data Cleanup
After migration, consider running:
```sql
-- Identify exercises without discipline (after grace period)
SELECT id, name FROM gym_exercises WHERE discipline_id IS NULL;

-- Optionally assign to discipline or mark inactive
UPDATE gym_exercises SET is_active = false WHERE discipline_id IS NULL;
```

### Performance
- New indexes ensure queries remain fast with joins
- Consider periodically analyzing: `ANALYZE trainer_disciplines;`

---

## 📦 Related Files

- `src/hooks/useExercisesData.tanstack.tsx` - Updated to filter by active discipline
- `src/hooks/useWorkoutsData.tanstack.tsx` - Updated to filter by active discipline
- `src/hooks/useCalendarData.tanstack.tsx` - Updated to include trainer disciplines
- `src/components/calendar/RecurringClassForm.tsx` - Updated to filter coaches by discipline
- `src/components/training/ExerciseLibrary.tsx` - Updated to show/filter by discipline

---

## 🧪 Testing Checklist

After applying migration:

- [ ] Can create exercise with discipline
- [ ] Can create workout template with discipline
- [ ] Exercises filter by discipline works
- [ ] Workouts filter by discipline works
- [ ] Can add trainer certification
- [ ] Can set member's primary discipline
- [ ] Calendar hides classes with inactive disciplines
- [ ] Exercise library hides exercises with inactive disciplines
- [ ] Workout library hides workouts with inactive disciplines
- [ ] Class form filters coaches by discipline
- [ ] Warning shown when assigning non-matching workout to class
