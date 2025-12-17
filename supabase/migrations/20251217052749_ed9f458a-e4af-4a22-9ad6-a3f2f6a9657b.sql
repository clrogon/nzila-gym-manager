-- Add discipline_id to classes table (linking classes directly to disciplines)
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_classes_discipline_id ON public.classes(discipline_id);

-- Add comment explaining the relationship
COMMENT ON COLUMN public.classes.discipline_id IS 'Links class to a discipline/activity type from the disciplines table';