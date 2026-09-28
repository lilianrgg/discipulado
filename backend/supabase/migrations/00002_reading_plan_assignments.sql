-- Add reading plan assignments table
CREATE TABLE IF NOT EXISTS public.reading_plan_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    book_slug TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(plan_id, day_number, book_slug, chapter_number)
);

ALTER TABLE public.reading_plan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public assignments are viewable by everyone" ON public.reading_plan_assignments FOR SELECT USING (true);
