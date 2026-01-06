import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppError, handleError, logError } from '@/types/errors';

/**
 * Generic form state interface
 */
interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}

/**
 * Options for useForm hook
 */
interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: (values: T) => Partial<Record<keyof T, string>> | null;
  onSubmit: (values: T) => Promise<void>;
}

/**
 * Result from useForm hook
 */
interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (field: keyof T, value: T[keyof T]) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setValues: (values: T) => void;
}

/**
 * Custom hook for form management with validation
 * 
 * @param options - Form configuration options
 * @returns Form state and handlers
 * 
 * @example
 * ```tsx
 * interface MemberFormData {
 *   full_name: string;
 *   email: string;
 *   phone: string;
 * }
 * 
 * function MemberForm() {
 *   const { values, handleChange, handleSubmit, isSubmitting } = useForm({
 *     initialValues: { full_name: '', email: '', phone: '' },
 *     validationSchema: validateMember,
 *     onSubmit: async (values) => {
 *       await saveMember(values);
 *     }
 *   });
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         name="full_name"
 *         value={values.full_name}
 *         onChange={(e) => handleChange('full_name', e.target.value)}
 *       />
 *       {errors.full_name && <span className="error">{errors.full_name}</span>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationSchema,
  onSubmit
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(initialValues);
    setTouched({});
    setErrors({});
  }, [initialValues]);

  // Update a single field value
  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle field change
  const handleChange = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => {
      const newValues = { ...prev, [field]: value };
      
      // Validate if schema provided
      if (validationSchema) {
        const validationErrors = validationSchema(newValues);
        setErrors(validationErrors);
      }
      
      return newValues;
    });
  }, [validationSchema]);

  // Handle field blur (mark as touched)
  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0;
  
  // Check if any values have changed from initial
  const isDirty = Object.keys(values).some(
    key => values[key as keyof T] !== initialValues[key as keyof T]
  );

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Final validation
      if (validationSchema) {
        const validationErrors = validationSchema(values);
        if (validationErrors && Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          toast({
            title: 'Validation Error',
            description: 'Please fix the errors in the form',
            variant: 'destructive'
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Call submit handler
      await onSubmit(values);
      
      // Reset form on successful submit
      reset();
      
      toast({
        title: 'Success',
        description: 'Your changes have been saved',
      });
    } catch (error) {
      const appError = handleError(error, 'useForm.handleSubmit');
      logError(appError);
      
      toast({
        title: 'Error',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationSchema, onSubmit, reset, toast]);

  return {
    values,
    errors,
    touched,
    isDirty,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setValues
  };
}

/**
 * Helper function to get user-friendly error message from AppError
 */
function getUserErrorMessage(error: AppError): string {
  return error.message || 'An error occurred';
}
