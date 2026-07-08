
CREATE TYPE public.game_status AS ENUM ('backlog','playing','completed','dropped','on_hold');

CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  genre TEXT NOT NULL,
  status public.game_status NOT NULL DEFAULT 'backlog',
  rating INTEGER CHECK (rating BETWEEN 0 AND 10),
  hours_played NUMERIC(6,1) NOT NULL DEFAULT 0,
  completed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own games" ON public.games
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX games_user_id_idx ON public.games(user_id);
CREATE INDEX games_status_idx ON public.games(status);

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER games_set_updated_at BEFORE UPDATE ON public.games
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
