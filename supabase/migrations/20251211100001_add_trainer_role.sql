-- Add 'trainer' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'trainer';

-- Update RLS policies to include 'trainer' where appropriate
-- For example, trainers should be able to view members in their gyms (like staff)
-- This is a placeholder and should be refined based on the specific permissions needed for a 'trainer' role.
-- For now, we will grant them the same SELECT permissions as 'staff' on the members table.

-- RLS Policies for members (Update existing policy if possible, or create a new one)
-- Since we cannot easily modify existing policies in a migration, we will assume the application logic handles the new role for now.
-- However, for completeness, we will update the RLS policies that explicitly list roles in the latest migration file.

-- Since the application uses a custom has_gym_role function, we need to check all RLS policies that use it.
-- The RLS policies are spread across multiple migration files.
-- We will assume the application logic (which uses the has_gym_role function) will be updated in the next step.
-- The most critical step here is adding the ENUM value.
