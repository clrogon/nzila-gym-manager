-- =============================================
-- Calendar Integrity: Overlap Detection & Recurring Series
-- =============================================

-- 1. Create class_series table for recurring class patterns
CREATE TABLE IF NOT EXISTS public.class_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  class_type_id UUID REFERENCES public.class_types(id),
  location_id UUID REFERENCES public.locations(id),
  coach_id UUID,
  capacity INT NOT NULL DEFAULT 20,
  
  -- Recurrence pattern
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  recurrence_days INT[] DEFAULT '{}', -- [1,3,5] = Mon, Wed, Fri (ISO weekday: 1=Monday, 7=Sunday)
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Time (same for all occurrences)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add series_id to classes table to link instances to series
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.class_series(id) ON DELETE SET NULL;

-- 3. Create index for series lookup
CREATE INDEX IF NOT EXISTS idx_classes_series_id ON public.classes(series_id);

-- 4. Create function to check location overlap
CREATE OR REPLACE FUNCTION public.check_location_overlap(
  p_location_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_class_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_available BOOLEAN,
  conflicting_classes JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflicts JSONB;
  v_count INT;
BEGIN
  -- Find overlapping classes at the same location
  SELECT 
    COUNT(*),
    COALESCE(
      JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', c.id,
        'title', c.title,
        'start_time', c.start_time,
        'end_time', c.end_time
      )),
      '[]'::JSONB
    )
  INTO v_count, v_conflicts
  FROM classes c
  WHERE c.location_id = p_location_id
    AND c.status NOT IN ('cancelled', 'completed')
    AND (c.id != p_exclude_class_id OR p_exclude_class_id IS NULL)
    AND (
      -- Check for any time overlap: start1 < end2 AND end1 > start2
      c.start_time < p_end_time AND c.end_time > p_start_time
    );
  
  RETURN QUERY SELECT 
    (v_count = 0) AS is_available,
    v_conflicts AS conflicting_classes;
END;
$$;

-- 5. Create function to check coach availability
CREATE OR REPLACE FUNCTION public.check_coach_overlap(
  p_coach_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_class_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_available BOOLEAN,
  conflicting_classes JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflicts JSONB;
  v_count INT;
BEGIN
  IF p_coach_id IS NULL THEN
    RETURN QUERY SELECT true AS is_available, '[]'::JSONB AS conflicting_classes;
    RETURN;
  END IF;

  SELECT 
    COUNT(*),
    COALESCE(
      JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', c.id,
        'title', c.title,
        'start_time', c.start_time,
        'end_time', c.end_time,
        'location', l.name
      )),
      '[]'::JSONB
    )
  INTO v_count, v_conflicts
  FROM classes c
  LEFT JOIN locations l ON l.id = c.location_id
  WHERE c.coach_id = p_coach_id
    AND c.status NOT IN ('cancelled', 'completed')
    AND (c.id != p_exclude_class_id OR p_exclude_class_id IS NULL)
    AND (c.start_time < p_end_time AND c.end_time > p_start_time);
  
  RETURN QUERY SELECT 
    (v_count = 0) AS is_available,
    v_conflicts AS conflicting_classes;
END;
$$;

-- 6. Enable RLS on class_series
ALTER TABLE public.class_series ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for class_series
CREATE POLICY "Staff can manage class series"
ON public.class_series
FOR ALL
USING (has_gym_role(auth.uid(), gym_id, ARRAY['gym_owner'::app_role, 'admin'::app_role, 'staff'::app_role]));

CREATE POLICY "Users can view class series in their gyms"
ON public.class_series
FOR SELECT
USING (gym_id IN (SELECT get_user_gym_ids(auth.uid())));

-- 8. Add updated_at trigger for class_series
CREATE TRIGGER update_class_series_updated_at
BEFORE UPDATE ON public.class_series
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Grant execute on functions
GRANT EXECUTE ON FUNCTION public.check_location_overlap TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_coach_overlap TO authenticated;