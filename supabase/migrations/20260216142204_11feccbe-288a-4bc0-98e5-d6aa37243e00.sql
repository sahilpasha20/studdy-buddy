
-- Study plans table (top-level, one per generation)
CREATE TABLE public.study_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hours_per_day INTEGER NOT NULL DEFAULT 4,
  reminder_time TEXT,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Subjects extracted from PDFs
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  chapters TEXT[] NOT NULL DEFAULT '{}',
  exam_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated day-by-day plan
CREATE TABLE public.day_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  chapters TEXT[] NOT NULL DEFAULT '{}',
  type TEXT NOT NULL CHECK (type IN ('study', 'revision', 'exam')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access (no auth yet)
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_tasks ENABLE ROW LEVEL SECURITY;

-- Public policies (since no auth)
CREATE POLICY "Allow all access to study_plans" ON public.study_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to day_tasks" ON public.day_tasks FOR ALL USING (true) WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_subjects_plan_id ON public.subjects(plan_id);
CREATE INDEX idx_day_tasks_plan_id ON public.day_tasks(plan_id);
CREATE INDEX idx_day_tasks_date ON public.day_tasks(date);
