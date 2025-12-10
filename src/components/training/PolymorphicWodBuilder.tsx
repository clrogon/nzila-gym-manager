import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getWodFieldsForCategory, WodFieldConfig, getCategoryNames } from '@/lib/seedData';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface WodExercise {
  id: string;
  [key: string]: any;
}

interface PolymorphicWodBuilderProps {
  category: string;
  exercises: WodExercise[];
  onChange: (exercises: WodExercise[]) => void;
}

export function PolymorphicWodBuilder({ category, exercises, onChange }: PolymorphicWodBuilderProps) {
  const fields = getWodFieldsForCategory(category);

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

  const renderField = (field: WodFieldConfig, exercise: WodExercise) => {
    const value = exercise[field.name] || '';

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
                    <div key={field.name} className={field.name === 'exercise' || field.name === 'technique' || field.name === 'skill' || field.name === 'drill' || field.name === 'pose' ? 'col-span-2 sm:col-span-3' : ''}>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        {field.label}
                      </Label>
                      {renderField(field, exercise)}
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
