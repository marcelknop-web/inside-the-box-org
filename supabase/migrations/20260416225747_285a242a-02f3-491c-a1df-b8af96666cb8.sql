-- Global highscore table for SOC Life game
CREATE TABLE public.soc_life_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  incidents_handled INTEGER NOT NULL DEFAULT 0,
  shift_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT player_name_length CHECK (char_length(player_name) BETWEEN 1 AND 24),
  CONSTRAINT score_range CHECK (score >= 0 AND score <= 999999),
  CONSTRAINT incidents_range CHECK (incidents_handled >= 0 AND incidents_handled <= 9999),
  CONSTRAINT shift_range CHECK (shift_seconds >= 0 AND shift_seconds <= 86400)
);

ALTER TABLE public.soc_life_scores ENABLE ROW LEVEL SECURITY;

-- Public read access for the leaderboard
CREATE POLICY "Anyone can view scores"
  ON public.soc_life_scores
  FOR SELECT
  USING (true);

-- Anyone can insert their own score (no auth required for arcade-style game)
CREATE POLICY "Anyone can submit a score"
  ON public.soc_life_scores
  FOR INSERT
  WITH CHECK (true);

-- Index for fast leaderboard queries (top scores first)
CREATE INDEX idx_soc_life_scores_score_desc ON public.soc_life_scores (score DESC, created_at DESC);