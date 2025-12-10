-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'gym_owner', 'admin', 'staff', 'member');

-- Create subscription_status enum
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');

-- Create member_status enum
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- Create payment_status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create payment_method enum
CREATE TYPE public.payment_method AS ENUM ('multicaixa', 'cash', 'bank_transfer', 'other');

-- Gyms/Tenants table
CREATE TABLE public.gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'Africa/Luanda',
    currency TEXT DEFAULT 'AOA',
    subscription_status subscription_status DEFAULT 'trial',
    subscription_ends_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (links users to gyms with roles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, gym_id, role)
);

-- Membership plans table
CREATE TABLE public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Members table (gym members with their membership info)
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    photo_url TEXT,
    status member_status DEFAULT 'pending',
    membership_plan_id UUID REFERENCES public.membership_plans(id),
    membership_start_date DATE,
    membership_end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Check-ins table
CREATE TABLE public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    checked_out_at TIMESTAMPTZ,
    notes TEXT
);

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'AOA',
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    reference TEXT,
    multicaixa_reference TEXT,
    description TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role in a gym
CREATE OR REPLACE FUNCTION public.has_gym_role(_user_id UUID, _gym_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
        AND gym_id = _gym_id
        AND role = ANY(_roles)
    )
$$;

-- Function to get user's gyms
CREATE OR REPLACE FUNCTION public.get_user_gym_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT gym_id FROM public.user_roles WHERE user_id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- RLS Policies for gyms
CREATE POLICY "Users can view gyms they belong to"
ON public.gyms FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_user_gym_ids(auth.uid())));

CREATE POLICY "Gym owners and admins can update their gym"
ON public.gyms FOR UPDATE
TO authenticated
USING (public.has_gym_role(auth.uid(), id, ARRAY['gym_owner', 'admin']::app_role[]));

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their gyms"
ON public.user_roles FOR SELECT
TO authenticated
USING (gym_id IN (SELECT public.get_user_gym_ids(auth.uid())));

CREATE POLICY "Gym owners can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner']::app_role[]));

-- RLS Policies for membership_plans
CREATE POLICY "Users can view plans in their gyms"
ON public.membership_plans FOR SELECT
TO authenticated
USING (gym_id IN (SELECT public.get_user_gym_ids(auth.uid())));

CREATE POLICY "Admins can manage plans"
ON public.membership_plans FOR ALL
TO authenticated
USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner', 'admin']::app_role[]));

-- RLS Policies for members
CREATE POLICY "Staff can view members in their gyms"
ON public.members FOR SELECT
TO authenticated
USING (gym_id IN (SELECT public.get_user_gym_ids(auth.uid())));

CREATE POLICY "Staff can manage members"
ON public.members FOR ALL
TO authenticated
USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner', 'admin', 'staff']::app_role[]));

-- RLS Policies for check_ins
CREATE POLICY "Staff can view check-ins in their gyms"
ON public.check_ins FOR SELECT
TO authenticated
USING (gym_id IN (SELECT public.get_user_gym_ids(auth.uid())));

CREATE POLICY "Staff can manage check-ins"
ON public.check_ins FOR ALL
TO authenticated
USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner', 'admin', 'staff']::app_role[]));

-- RLS Policies for payments
CREATE POLICY "Staff can view payments in their gyms"
ON public.payments FOR SELECT
TO authenticated
USING (gym_id IN (SELECT public.get_user_gym_ids(auth.uid())));

CREATE POLICY "Admins can manage payments"
ON public.payments FOR ALL
TO authenticated
USING (public.has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner', 'admin']::app_role[]));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON public.gyms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();