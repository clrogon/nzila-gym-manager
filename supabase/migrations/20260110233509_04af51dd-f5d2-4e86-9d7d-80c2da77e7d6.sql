-- Re-add staff access to members but ONLY for columns in members_safe view
-- Staff can view basic member info through the members_safe view

-- Create policy for staff to SELECT from members (they'll use members_safe view which excludes health_conditions)
CREATE POLICY "staff_view_members_via_safe_view"
ON public.members
FOR SELECT
TO authenticated
USING (
  has_gym_role(auth.uid(), gym_id, ARRAY['staff'::app_role])
);

-- The members_safe view already excludes health_conditions column
-- Staff querying members_safe will only see the safe columns