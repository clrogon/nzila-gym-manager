import { supabase } from '@/integrations/supabase/client';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface DisciplineRankLevel {
  level: number;
  name: string;
  minLevel?: number;
  maxLevel?: number;
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export const DIFFICULTY_RANK_MAPPING: Record<DifficultyLevel, { minLevel: number; maxLevel: number }> = {
  beginner: { minLevel: 1, maxLevel: 2 },
  intermediate: { minLevel: 3, maxLevel: 4 },
  advanced: { minLevel: 5, maxLevel: 6 },
  expert: { minLevel: 7, maxLevel: 10 }
};

export function getDifficultyForRank(rankLevel: number): DifficultyLevel {
  for (const [difficulty, range] of Object.entries(DIFFICULTY_RANK_MAPPING)) {
    if (rankLevel >= range.minLevel && rankLevel <= range.maxLevel) {
      return difficulty as DifficultyLevel;
    }
  }
  return 'beginner';
}

export function isRankSuitableForWorkout(
  memberRankLevel: number,
  workoutMinLevel: number | null,
  workoutMaxLevel: number | null
): boolean {
  if (workoutMinLevel === null && workoutMaxLevel === null) {
    return true;
  }
  if (workoutMinLevel !== null && memberRankLevel < workoutMinLevel) {
    return false;
  }
  if (workoutMaxLevel !== null && memberRankLevel > workoutMaxLevel) {
    return false;
  }
  return true;
}

export function filterWorkoutsByRank<T extends { min_rank_level: number | null; max_rank_level: number | null }>(
  workouts: T[],
  memberRankLevel: number
): T[] {
  return workouts.filter(workout =>
    isRankSuitableForWorkout(memberRankLevel, workout.min_rank_level, workout.max_rank_level)
  );
}

export async function deActivateDiscipline(disciplineId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('disciplines')
    .update({ is_active: false })
    .eq('id', disciplineId);

  if (error) {
    console.error('Failed to deactivate discipline:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function activateDiscipline(disciplineId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('disciplines')
    .update({ is_active: true })
    .eq('id', disciplineId);

  if (error) {
    console.error('Failed to activate discipline:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getDisciplineStats(disciplineId: string): Promise<{
  activeClassesCount: number;
  activeWorkoutsCount: number;
  activeExercisesCount: number;
}> {
  // Query classes - discipline_id exists in classes table
  const { data: classesData } = await supabase
    .from('classes')
    .select('id')
    .eq('discipline_id', disciplineId);

  // Return counts - workout_templates and gym_exercises don't have discipline_id in current schema
  // So we return 0 for those until schema is updated
  return {
    activeClassesCount: classesData?.length ?? 0,
    activeWorkoutsCount: 0,
    activeExercisesCount: 0
  };
}

export async function getClassRankRequirements(classId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      workout_template_id,
      workout_templates (
        min_rank_level,
        max_rank_level,
        difficulty,
        discipline_id
      )
    `)
    .eq('id', classId)
    .single();

  if (error) {
    console.error('Failed to get class rank requirements:', error);
    return null;
  }

  return data?.workout_templates;
}
