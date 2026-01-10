# Discipline Enhancements - Implementation Summary

## Overview
This update adds comprehensive discipline management features including:
- Mandatory class flagging
- Rank-based difficulty tracking
- Cascade deactivation when disciplines are disabled
- Full discipline linking for workouts and exercises

---

## Database Changes

### New Tables
- `trainer_disciplines` - Links trainers to their certified disciplines
- `member_disciplines` - Tracks members' discipline preferences and primary discipline

### New Columns

| Table | Column | Type | Default | Description |
|-------|---------|------|---------|-------------|
| `classes` | `is_mandatory` | BOOLEAN | false | Whether class is mandatory (e.g., belt tests, assessments) |
| `classes` | `is_active` | BOOLEAN | true | Whether class is available for booking |
| `class_series` | `is_mandatory` | BOOLEAN | false | Whether all classes in series are mandatory |
| `workout_templates` | `discipline_id` | UUID | FK to disciplines |
| `workout_templates` | `is_active` | BOOLEAN | true | Whether template is available |
| `workout_templates` | `min_rank_level` | INTEGER | NULL | Minimum rank level (inclusive) |
| `workout_templates` | `max_rank_level` | INTEGER | NULL | Maximum rank level (inclusive) |
| `gym_workouts` | `discipline_id` | UUID | FK to disciplines |
| `gym_workouts` | `min_rank_level` | INTEGER | NULL | Minimum rank level (inclusive) |
| `gym_workouts` | `max_rank_level` | INTEGER | NULL | Maximum rank level (inclusive) |
| `gym_exercises` | `discipline_id` | UUID | FK to disciplines (already added) |
| `gym_exercises` | `difficulty` | VARCHAR(20) | 'beginner' | Difficulty level |
| `gym_exercises` | `min_rank_level` | INTEGER | NULL | Minimum rank level |
| `gym_exercises` | `max_rank_level` | INTEGER | NULL | Maximum rank level |

---

## Triggers

### `cascade_discipline_deactivation()`
Automatically deactivates related records when a discipline is deactivated:
- `classes` with matching `discipline_id`
- `workout_templates` with matching `discipline_id`
- `gym_workouts` with matching `discipline_id`
- `gym_exercises` with matching `discipline_id`

**Trigger:** `discipline_deactivation_trigger` on `disciplines` (AFTER UPDATE)

---

## Views

| View | Description |
|-------|-------------|
| `active_classes` | Classes with `is_active = true`, joined with discipline info |
| `active_workout_templates` | Workout templates with `is_active = true`, joined with discipline info |
| `active_gym_workouts` | Gym workouts with `is_active = true`, joined with discipline info |
| `active_gym_exercises` | Gym exercises with `is_active = true`, joined with discipline info |

---

## RLS Policies

### New Policies
- `Members can only view active classes`
- `Members can only view active workout templates`
- `Members can only view active gym workouts`
- `Members can only view active gym exercises`

**Rule:** Regular members see only `is_active = true` records. Gym staff/owners see all records.

---

## TypeScript Changes

### Type Updates (src/integrations/supabase/types.ts)
Updated types for:
- `classes` - Added `is_mandatory`, `is_active`
- `class_series` - Added `is_mandatory`
- `workout_templates` - Added `discipline_id`, `is_active`, `min_rank_level`, `max_rank_level`
- `gym_workouts` - Added `discipline_id`, `min_rank_level`, `max_rank_level`
- `gym_exercises` - Added `difficulty`, `min_rank_level`, `max_rank_level`

### Validation Schemas (src/lib/validations.ts)
- `classSchema` - Added `discipline_id`, `workout_template_id`, `is_mandatory`, `is_active`
- `workoutTemplateSchema` - Added `discipline_id`, `is_active`, `min_rank_level`, `max_rank_level`, extended `difficulty` options
- `exerciseSchema` - New schema with `difficulty`, `discipline_id`, `min_rank_level`, `max_rank_level`

### Helper Functions (src/lib/disciplineHelpers.ts)
- `getDifficultyForRank()` - Map rank level to difficulty
- `isRankSuitableForWorkout()` - Check if member rank qualifies for workout
- `filterWorkoutsByRank()` - Filter workouts by member's rank
- `deactivateDiscipline()` - Deactivate discipline (triggers cascade)
- `activateDiscipline()` - Reactivate discipline (manual cascade required)
- `getDisciplineStats()` - Get stats for discipline (classes, workouts, exercises count)
- `getClassRankRequirements()` - Get rank requirements for a specific class

---

## Difficulty to Rank Mapping

| Difficulty | Rank Levels |
|------------|--------------|
| `beginner` | 1-2 |
| `intermediate` | 3-4 |
| `advanced` | 5-6 |
| `expert` | 7+ |

---

## Usage Examples

### Creating a Mandatory Class
```typescript
await supabase.from('classes').insert({
  title: 'Belt Test - Blue',
  discipline_id: 'some-discipline-id',
  start_time: '2026-01-15 10:00:00',
  end_time: '2026-01-15 12:00:00',
  is_mandatory: true,
  capacity: 20
});
```

### Setting Rank Requirements for Workout
```typescript
await supabase.from('workout_templates').insert({
  name: 'Intermediate BJJ Drills',
  discipline_id: 'bjj-discipline-id',
  difficulty: 'intermediate',
  min_rank_level: 3,
  max_rank_level: 4
});
```

### Filtering Workouts by Member Rank
```typescript
const memberRank = 3;
const suitableWorkouts = filterWorkoutsByRank(allWorkouts, memberRank);
```

### Deactivating a Discipline
```typescript
const result = await deactivateDiscipline('discipline-id');
// Automatically deactivates all related classes, workouts, and exercises
```

---

## Business Logic Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Disciplines                          │
│  (e.g., BJJ, Yoga, Boxing - with rank systems)         │
│  is_active: false                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├──► Trigger fires (cascade)
                     │
                     ├──► Classes with discipline_id
                     │      ├─► is_active = false (all become unavailable)
                     │
                     ├──► Workout Templates with discipline_id
                     │      ├─► is_active = false
                     │
                     ├──► Gym Workouts with discipline_id
                     │      ├─► is_active = false
                     │
                     └─► Gym Exercises with discipline_id
                            ├─► is_active = false
```

---

## Breaking Changes

**None** - All new columns are optional or have sensible defaults.

---

## Migration Files

- `20260110000000_discipline_integration.sql` - Initial discipline FK additions
- `20260110154518_discipline_enhancements.sql` - This migration (flags, ranks, triggers)

---

## Future Enhancements

1. **Member Progression Tracking** - Track member rank promotions over time
2. **Auto-Suggest Workouts** - Suggest workouts based on member's current rank
3. **Belt Test Scheduling** - Schedule belt tests based on rank progression
4. **Rank Prerequisites** - Define which ranks are prerequisites for workouts
