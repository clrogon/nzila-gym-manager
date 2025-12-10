-- Create gym-specific workouts table
CREATE TABLE public.gym_workouts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    difficulty TEXT DEFAULT 'intermediate',
    estimated_duration INTEGER DEFAULT 60,
    exercises JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gym-specific classes table
CREATE TABLE public.gym_classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    default_duration INTEGER DEFAULT 60,
    default_capacity INTEGER DEFAULT 20,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gym-specific exercises table
CREATE TABLE public.gym_exercises (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    equipment TEXT,
    muscle_groups TEXT[],
    instructions TEXT,
    video_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rank promotion history table
CREATE TABLE public.rank_promotions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    from_rank_id UUID REFERENCES public.discipline_ranks(id),
    to_rank_id UUID NOT NULL REFERENCES public.discipline_ranks(id),
    promoted_by UUID REFERENCES auth.users(id),
    promotion_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.gym_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_promotions ENABLE ROW LEVEL SECURITY;

-- RLS policies for gym_workouts
CREATE POLICY "Users can view workouts in their gyms"
ON public.gym_workouts FOR SELECT
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role, 'member'::app_role]));

CREATE POLICY "Staff can manage workouts"
ON public.gym_workouts FOR ALL
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role]));

-- RLS policies for gym_classes
CREATE POLICY "Users can view classes in their gyms"
ON public.gym_classes FOR SELECT
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role, 'member'::app_role]));

CREATE POLICY "Staff can manage classes"
ON public.gym_classes FOR ALL
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role]));

-- RLS policies for gym_exercises
CREATE POLICY "Users can view exercises in their gyms"
ON public.gym_exercises FOR SELECT
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role, 'member'::app_role]));

CREATE POLICY "Staff can manage exercises"
ON public.gym_exercises FOR ALL
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role]));

-- RLS policies for rank_promotions
CREATE POLICY "Users can view promotions in their gyms"
ON public.rank_promotions FOR SELECT
USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = rank_promotions.member_id
    AND has_gym_role(auth.uid(), m.gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role])
));

CREATE POLICY "Staff can manage promotions"
ON public.rank_promotions FOR ALL
USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = rank_promotions.member_id
    AND has_gym_role(auth.uid(), m.gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role])
));

-- Create updated_at triggers
CREATE TRIGGER update_gym_workouts_updated_at
BEFORE UPDATE ON public.gym_workouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gym_classes_updated_at
BEFORE UPDATE ON public.gym_classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gym_exercises_updated_at
BEFORE UPDATE ON public.gym_exercises
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();