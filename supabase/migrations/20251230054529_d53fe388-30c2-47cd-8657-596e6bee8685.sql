-- Add anon deny policies to remaining critical tables

-- Auth rate limits
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'auth_rate_limits' AND policyname = 'Deny anonymous access to auth_rate_limits') THEN
    CREATE POLICY "Deny anonymous access to auth_rate_limits" ON public.auth_rate_limits FOR ALL TO anon USING (false);
  END IF;
END $$;

-- Products
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Deny anonymous access to products') THEN
    CREATE POLICY "Deny anonymous access to products" ON public.products FOR ALL TO anon USING (false);
  END IF;
END $$;

-- Discounts
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'discounts' AND policyname = 'Deny anonymous access to discounts') THEN
    CREATE POLICY "Deny anonymous access to discounts" ON public.discounts FOR ALL TO anon USING (false);
  END IF;
END $$;

-- Classes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classes' AND policyname = 'Deny anonymous access to classes') THEN
    CREATE POLICY "Deny anonymous access to classes" ON public.classes FOR ALL TO anon USING (false);
  END IF;
END $$;

-- Disciplines
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'disciplines' AND policyname = 'Deny anonymous access to disciplines') THEN
    CREATE POLICY "Deny anonymous access to disciplines" ON public.disciplines FOR ALL TO anon USING (false);
  END IF;
END $$;

-- Locations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'locations' AND policyname = 'Deny anonymous access to locations') THEN
    CREATE POLICY "Deny anonymous access to locations" ON public.locations FOR ALL TO anon USING (false);
  END IF;
END $$;

-- Member workouts
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'member_workouts' AND policyname = 'Deny anonymous access to member_workouts') THEN
    CREATE POLICY "Deny anonymous access to member_workouts" ON public.member_workouts FOR ALL TO anon USING (false);
  END IF;
END $$;

-- Performance records
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'performance_records' AND policyname = 'Deny anonymous access to performance_records') THEN
    CREATE POLICY "Deny anonymous access to performance_records" ON public.performance_records FOR ALL TO anon USING (false);
  END IF;
END $$;

-- Membership plans
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'membership_plans' AND policyname = 'Deny anonymous access to membership_plans') THEN
    CREATE POLICY "Deny anonymous access to membership_plans" ON public.membership_plans FOR ALL TO anon USING (false);
  END IF;
END $$;