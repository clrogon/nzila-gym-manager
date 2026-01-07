import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppError, handleError, logError, getUserErrorMessage } from '@/types/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * WorkoutTemplate type
 */
export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  estimated_duration: number | null;
  exercises: any[] | null;
}

/**
 * WorkoutTemplate form data type
 */
export interface WorkoutTemplateFormData {
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_duration: number;
  exercises: any[];
}

/**
 * Custom hook for workout template data management using TanStack Query
 *
 * Provides efficient caching, automatic refetching, and optimistic updates
 *
 * @param gymId - The current gym ID to filter workout templates
 * @returns Object containing workout template data, loading states, and CRUD operations
 * @returns {WorkoutTemplate[]} templates - Array of workout template objects (cached)
 * @returns {boolean} loading - Data loading state
 * @returns {Function} createTemplate - Mutation to create new template
 * @returns {Function} updateTemplate - Mutation to update existing template
 * @returns {Function} deleteTemplate - Mutation to delete template
 * @returns {Function} refetchAll - Function to manually refetch all data
 *
 * @example
 * ```tsx
 * function WorkoutLibraryView() {
 *   const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useWorkoutsData(currentGym.id);
 *
 *   if (loading) return <Loading />;
 *
 *   const handleCreate = async (templateData: WorkoutTemplateFormData) => {
 *     await createTemplate(templateData);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => createTemplate({ ...templateData })}>
 *         Create Template
 *       </button>
 *       <WorkoutList templates={templates} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useWorkoutsData(gymId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Cache key
  const templatesQueryKey = ['workout_templates', gymId] as const;

  // Fetch workout templates with TanStack Query
  const {
    data: templates,
    isLoading: loading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: templatesQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('gym_id', gymId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    // Cache for 10 minutes (templates are moderately stable)
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // Don't refetch on window focus (reduces unnecessary requests)
    refetchOnWindowFocus: false,
    // Only retry once on failure
    retry: 1,
    // Only fetch if gymId is available
    enabled: !!gymId,
  });

  // Memoize templates by category for efficient lookups
  const templatesByCategory = useMemo(() => {
    if (!templates) return {};
    const map: Record<string, WorkoutTemplate[]> = {};
    (templates || []).forEach((template) => {
      const category = template.category || 'uncategorized';
      if (!map[category]) {
        map[category] = [];
      }
      map[category].push(template);
    });
    return map;
  }, [templates]);

  // Create template mutation with optimistic update
  const createTemplate = useMutation({
    mutationFn: async (templateData: WorkoutTemplateFormData) => {
      if (!gymId) {
        throw new Error('Gym ID is required');
      }

      const { data, error } = await supabase
        .from('workout_templates')
        .insert([{
          ...templateData,
          gym_id: gymId
        }])
        .select()
        .single();

      if (error) throw error;
      return data as WorkoutTemplate;
    },
    // Optimistic update: Add new template to cache immediately
    onMutate: async (newTemplate) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: templatesQueryKey });

      // Snapshot previous value
      const previousTemplates = queryClient.getQueryData(templatesQueryKey) || [];
      
      // Optimistically add new template to cache
      queryClient.setQueryData(templatesQueryKey, (old: WorkoutTemplate[] = []) => {
        return [...old, newTemplate];
      });

      return { previousTemplates };
    },
    // On success, invalidate cache to get fresh data
    onSuccess: (newTemplate) => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: templatesQueryKey });
      
      toast({
        title: 'Success',
        description: 'Workout template created successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useWorkoutsData.createTemplate');
      logError(appError);
      
      toast({
        title: 'Error Creating Template',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Update template mutation with optimistic update
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...templateData }: Partial<WorkoutTemplateFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('workout_templates')
        .update(templateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as WorkoutTemplate;
    },
    onMutate: async (updatedTemplate) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: templatesQueryKey });

      // Snapshot previous value
      const previousTemplates = queryClient.getQueryData(templatesQueryKey) || [];
      
      // Optimistically update template in cache
      queryClient.setQueryData(templatesQueryKey, (old: WorkoutTemplate[] = []) => {
        return old.map(t => 
          t.id === updatedTemplate.id ? { ...t, ...updatedTemplate } : t
        );
      });

      return { previousTemplates };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: templatesQueryKey });
      
      toast({
        title: 'Success',
        description: 'Workout template updated successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useWorkoutsData.updateTemplate');
      logError(appError);
      
      toast({
        title: 'Error Updating Template',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Delete template mutation with optimistic update
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (deletedTemplateId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: templatesQueryKey });

      // Snapshot previous value
      const previousTemplates = queryClient.getQueryData(templatesQueryKey) || [];
      
      // Optimistically remove template from cache
      queryClient.setQueryData(templatesQueryKey, (old: WorkoutTemplate[] = []) => {
        return old.filter(t => t.id !== deletedTemplateId);
      });

      return { previousTemplates };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: templatesQueryKey });
      
      toast({
        title: 'Success',
        description: 'Workout template deleted successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useWorkoutsData.deleteTemplate');
      logError(appError);
      
      toast({
        title: 'Error Deleting Template',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchTemplates();
  }, [refetchTemplates]);

  return {
    // Data
    templates: templates || [],
    templatesByCategory,

    // Loading state
    loading,

    // Mutations
    createTemplate,
    updateTemplate,
    deleteTemplate,

    // Error states
    templatesError,

    // Cache utilities
    refetchAll,

    // Cache key exposure (for advanced use cases)
    cacheKeys: {
      templates: templatesQueryKey,
    },
  };
}
