-- 1. Agregar 'appealed' al check constraint del status de interactions
ALTER TABLE public.interactions DROP CONSTRAINT IF EXISTS interactions_status_check;
ALTER TABLE public.interactions ADD CONSTRAINT interactions_status_check CHECK (status IN ('pending_time', 'ready_to_review', 'reviewed', 'published', 'rejected_by_seller', 'archived', 'appealed'));

-- 2. Agregar columnas a la tabla profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 100;
