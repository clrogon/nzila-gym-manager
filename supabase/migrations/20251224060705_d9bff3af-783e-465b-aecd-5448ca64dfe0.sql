-- Add additional international standard gym roles
-- These follow fitness industry standards (IHRSA, ACE, NASM)

-- First, alter the enum to include new roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'coach';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'trainer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'instructor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'receptionist';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'physiotherapist';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'nutritionist';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'manager';