import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { getWodFieldsForCategory, WodFieldConfig, getCategoryNames, DEFAULT_WORKOUT_CATEGORIES } from '@/lib/seedData';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, GripVertical, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WodExercise {
  id: string;
  [key: string]: any;
}

interface GymExercise {
  id: string;
  name: string;
  category: string | null;
}

interface PolymorphicWodBuilderProps {
  category: string;
  exercises: WodExercise[];
  onChange: (exercises: WodExercise[]) => void;
}

export function PolymorphicWodBuilder({ category, exercises, onChange }: PolymorphicWodBuilderProps) {
  const { currentGym } = useGym();
  const [gymExercises, setGymExercises] = useState<GymExercise[]>([]);
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const fields = getWodFieldsForCategory(category);

  // Get seed exercises for the category
  const getSeedExercises = (): string[] => {
    const categoryData = DEFAULT_WORKOUT_CATEGORIES.find(c => c.name === category);
    if (categoryData) return categoryData.exercises;
    return DEFAULT_WORKOUT_CATEGORIES.flatMap(c => c.exercises);
  };

  // Fetch gym-specific exercises
  useEffect(() => {
    if (currentGym?.id) {
      fetchGymExercises();
    }
  }, [currentGym?.id]);

  const fetchGymExercises = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('gym_exercises')
      .select('id, name, category')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true)
      .order('name');
    setGymExercises(data || []);
  };

  // Combine seed exercises with gym-specific ones
  const getAvailableExercises = (): string[] => {
    const seedExercises = getSeedExercises();
    const gymExerciseNames = gymExercises.map(e => e.name);
    const combined = [...new Set([...seedExercises, ...gymExerciseNames])];
    return combined.sort();
  };

  const createEmptyExercise = (): WodExercise => {
    const exercise: WodExercise = { id: crypto.randomUUID() };
    fields.forEach(field => {
      exercise[field.name] = '';
    });
    return exercise;
  };

  const addExercise = () => {
    onChange([...exercises, createEmptyExercise()]);
  };

  const updateExercise = (id: string, fieldName: string, value: any) => {
    onChange(
      exercises.map(ex => ex.id === id ? { ...ex, [fieldName]: value } : ex)
    );
  };

  const removeExercise = (id: string) => {
    onChange(exercises.filter(ex => ex.id !== id));
  };

  const selectExerciseFromLibrary = (exerciseIndex: number, exerciseName: string) => {
    const exercise = exercises[exerciseIndex];
    if (exercise) {
      // Find the main exercise field (could be 'exercise', 'technique', 'skill', 'pose', 'drill')
      const mainField = fields.find(f => ['exercise', 'technique', 'skill', 'pose', 'drill'].includes(f.name));
      if (mainField) {
        updateExercise(exercise.id, mainField.name, exerciseName);
      } else {
        updateExercise(exercise.id, 'exercise', exerciseName);
      }
    }
    setOpenPopoverIndex(null);
  };

  const renderField = (field: WodFieldConfig, exercise: WodExercise, exerciseIndex: number) => {
    const value = exercise[field.name] || '';
    const isMainField = ['exercise', 'technique', 'skill', 'pose', 'drill'].includes(field.name);

    // For main exercise field, show library selector
    if (isMainField) {
      const availableExercises = getAvailableExercises();
      return (
        <Popover open={openPopoverIndex === exerciseIndex} onOpenChange={(open) => setOpenPopoverIndex(open ? exerciseIndex : null)}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between text-left font-normal"
            >
              {value || `Select ${field.label}...`}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
              <CommandList>
                <CommandEmpty>
                  <div className="py-2 px-4 text-sm text-muted-foreground">
                    No exercise found. Type a custom name below.
                  </div>
                </CommandEmpty>
                <CommandGroup heading="Exercise Library">
                  {availableExercises.slice(0, 50).map((ex) => (
                    <CommandItem
                      key={ex}
                      value={ex}
                      onSelect={() => selectExerciseFromLibrary(exerciseIndex, ex)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === ex ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {ex}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="border-t p-2">
                <Input
                  placeholder="Or type custom exercise..."
                  value={value}
                  onChange={(e) => updateExercise(exercise.id, field.name, e.target.value)}
                  className="h-8"
                />
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(v) => updateExercise(exercise.id, field.name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateExercise(exercise.id, field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'time':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateExercise(exercise.id, field.name, e.target.value)}
            placeholder={field.placeholder || 'MM:SS'}
          />
        );

      case 'distance':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={value}
              onChange={(e) => updateExercise(exercise.id, field.name, e.target.value)}
              placeholder={field.placeholder}
              className="flex-1"
            />
            {field.unit && (
              <span className="text-sm text-muted-foreground">{field.unit}</span>
            )}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateExercise(exercise.id, field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  // Initialize with one empty exercise if none exist
  useEffect(() => {
    if (exercises.length === 0) {
      onChange([createEmptyExercise()]);
    }
  }, [category]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Exercises</Label>
        <Button variant="outline" size="sm" onClick={addExercise}>
          <Plus className="w-4 h-4 mr-1" />
          Add Exercise
        </Button>
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <Card key={exercise.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="pt-2 text-muted-foreground cursor-grab">
                <GripVertical className="w-4 h-4" />
              </div>
              
              <div className="flex-1 grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-8 w-8"
                    onClick={() => removeExercise(exercise.id)}
                    disabled={exercises.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fields.map(field => (
                    <div key={field.name} className={['exercise', 'technique', 'skill', 'drill', 'pose'].includes(field.name) ? 'col-span-2 sm:col-span-3' : ''}>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        {field.label}
                      </Label>
                      {renderField(field, exercise, index)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No exercises added yet</p>
          <Button variant="outline" size="sm" onClick={addExercise} className="mt-2">
            <Plus className="w-4 h-4 mr-1" />
            Add First Exercise
          </Button>
        </div>
      )}
    </div>
  );
}