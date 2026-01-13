-- Create telegram_messages table for Node.js server
CREATE TABLE IF NOT EXISTS public.telegram_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id text,
  telegram_chat_id text NOT NULL,
  username text,
  message text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can insert telegram messages"
  ON public.telegram_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view telegram messages"
  ON public.telegram_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS telegram_messages_chat_id_idx ON public.telegram_messages(telegram_chat_id);
CREATE INDEX IF NOT EXISTS telegram_messages_created_at_idx ON public.telegram_messages(created_at DESC);
