import { z } from 'zod';

// ===== Common Validators =====
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
const emailSchema = z.string().trim().email('Invalid email address').max(255, 'Email too long');
const phoneSchema = z.string().trim().regex(phoneRegex, 'Invalid phone number').max(20, 'Phone number too long').optional().or(z.literal(''));
const nameSchema = z.string().trim().min(1, 'Name is required').max(100, 'Name too long');
const notesSchema = z.string().trim().max(1000, 'Notes too long').optional().or(z.literal(''));

// ===== Member Schemas =====
export const memberSchema = z.object({
  full_name: nameSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  date_of_birth: z.string().optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Address too long').optional().or(z.literal('')),
  emergency_contact: z.string().trim().max(100, 'Emergency contact name too long').optional().or(z.literal('')),
  emergency_phone: phoneSchema,
  notes: notesSchema,
  membership_plan_id: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
});

export type MemberFormData = z.infer<typeof memberSchema>;

// ===== Payment Schemas =====
export const paymentSchema = z.object({
  member_id: z.string().uuid('Invalid member'),
  amount: z.number().positive('Amount must be positive').max(999999999, 'Amount too large'),
  payment_method: z.enum(['multicaixa', 'cash', 'bank_transfer', 'other']),
  description: z.string().trim().max(500, 'Description too long').optional().or(z.literal('')),
  reference: z.string().trim().max(100, 'Reference too long').optional().or(z.literal('')),
  multicaixa_reference: z.string().trim().max(50, 'Multicaixa reference too long').optional().or(z.literal('')),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// ===== Membership Plan Schemas =====
export const membershipPlanSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(500, 'Description too long').optional().or(z.literal('')),
  price: z.number().nonnegative('Price must be non-negative').max(999999999, 'Price too large'),
  duration_days: z.number().int().positive('Duration must be positive').max(3650, 'Duration cannot exceed 10 years'),
  is_active: z.boolean().optional(),
});

export type MembershipPlanFormData = z.infer<typeof membershipPlanSchema>;

// ===== Gym Schemas =====
export const gymSchema = z.object({
  name: nameSchema,
  slug: z.string().trim().min(1, 'Slug is required').max(50, 'Slug too long').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  address: z.string().trim().max(500, 'Address too long').optional().or(z.literal('')),
  timezone: z.string().max(50).optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
});

export type GymFormData = z.infer<typeof gymSchema>;

// ===== Class Schemas =====
export const classSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().trim().max(1000, 'Description too long').optional().or(z.literal('')),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  capacity: z.number().int().positive('Capacity must be positive').max(1000, 'Capacity too large').optional(),
  class_type_id: z.string().uuid().optional().or(z.literal('')),
  location_id: z.string().uuid().optional().or(z.literal('')),
  coach_id: z.string().uuid().optional().or(z.literal('')),
  is_recurring: z.boolean().optional(),
  recurrence_rule: z.string().max(200).optional().or(z.literal('')),
});

export type ClassFormData = z.infer<typeof classSchema>;

// ===== Class Type Schemas =====
export const classTypeSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(500, 'Description too long').optional().or(z.literal('')),
  duration_minutes: z.number().int().positive('Duration must be positive').max(480, 'Duration cannot exceed 8 hours').optional(),
  capacity: z.number().int().positive('Capacity must be positive').max(1000, 'Capacity too large').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  is_active: z.boolean().optional(),
});

export type ClassTypeFormData = z.infer<typeof classTypeSchema>;

// ===== Location Schemas =====
export const locationSchema = z.object({
  name: nameSchema,
  address: z.string().trim().max(500, 'Address too long').optional().or(z.literal('')),
  capacity: z.number().int().positive('Capacity must be positive').max(10000, 'Capacity too large').optional(),
  is_active: z.boolean().optional(),
});

export type LocationFormData = z.infer<typeof locationSchema>;

// ===== Workout Template Schemas =====
export const workoutTemplateSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(1000, 'Description too long').optional().or(z.literal('')),
  category: z.string().trim().max(50, 'Category too long').optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimated_duration: z.number().int().positive('Duration must be positive').max(480, 'Duration cannot exceed 8 hours').optional(),
  is_public: z.boolean().optional(),
  exercises: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    sets: z.number().int().positive().max(100).optional(),
    reps: z.number().int().positive().max(1000).optional(),
    duration_seconds: z.number().int().positive().max(7200).optional(),
    rest_seconds: z.number().int().nonnegative().max(600).optional(),
    notes: z.string().trim().max(500).optional(),
  })).optional(),
});

export type WorkoutTemplateFormData = z.infer<typeof workoutTemplateSchema>;

// ===== Discount Schemas =====
export const discountSchema = z.object({
  name: nameSchema,
  code: z.string().trim().min(1, 'Code is required').max(20, 'Code too long').regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  description: z.string().trim().max(500, 'Description too long').optional().or(z.literal('')),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.number().positive('Value must be positive').max(999999, 'Value too large'),
  max_uses: z.number().int().positive('Max uses must be positive').max(1000000).optional().nullable(),
  valid_from: z.string().optional().or(z.literal('')),
  valid_until: z.string().optional().or(z.literal('')),
  is_active: z.boolean().optional(),
});

export type DiscountFormData = z.infer<typeof discountSchema>;

// ===== Staff Certification Schemas =====
export const certificationSchema = z.object({
  name: nameSchema,
  user_id: z.string().uuid('Invalid user'),
  issued_date: z.string().optional().or(z.literal('')),
  expiry_date: z.string().optional().or(z.literal('')),
});

export type CertificationFormData = z.infer<typeof certificationSchema>;

// ===== Staff Absence Schemas =====
export const absenceSchema = z.object({
  user_id: z.string().uuid('Invalid user'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().trim().max(500, 'Reason too long').optional().or(z.literal('')),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export type AbsenceFormData = z.infer<typeof absenceSchema>;

// ===== Auth Schemas =====
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password too long'),
  full_name: nameSchema,
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

// ===== Profile Schema =====
export const profileSchema = z.object({
  full_name: nameSchema.optional(),
  phone: phoneSchema,
  avatar_url: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ===== User Role Schema =====
export const userRoleSchema = z.object({
  user_id: z.string().uuid('Invalid user'),
  gym_id: z.string().uuid('Invalid gym').optional().nullable(),
  role: z.enum(['super_admin', 'gym_owner', 'admin', 'staff', 'member']),
});

export type UserRoleFormData = z.infer<typeof userRoleSchema>;

// ===== Check-in Schema =====
export const checkInSchema = z.object({
  member_id: z.string().uuid('Invalid member'),
  notes: notesSchema,
});

export type CheckInFormData = z.infer<typeof checkInSchema>;

// ===== Validation Helper =====
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  for (const error of result.error.errors) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  }
  
  return { success: false, errors };
}
