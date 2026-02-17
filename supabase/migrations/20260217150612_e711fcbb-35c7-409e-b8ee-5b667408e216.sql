
CREATE TABLE public.rate_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  request_count integer DEFAULT 0 NOT NULL,
  window_start timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only the service role (edge function) manages this table.
-- Users can read their own rate limit status.
CREATE POLICY "Users can view own rate limit"
  ON public.rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);
