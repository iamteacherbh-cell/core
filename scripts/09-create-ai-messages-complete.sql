-- Create ai_messages table if not exists
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI messages"
  ON public.ai_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI messages"
  ON public.ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS ai_messages_user_id_idx ON public.ai_messages(user_id);
CREATE INDEX IF NOT EXISTS ai_messages_created_at_idx ON public.ai_messages(created_at DESC);

-- Create telegram_admin_messages table if not exists
CREATE TABLE IF NOT EXISTS public.telegram_admin_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id text NOT NULL,
  telegram_username text,
  telegram_chat_id text NOT NULL,
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  reply_text text,
  replied_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for telegram_admin_messages
ALTER TABLE public.telegram_admin_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram admin messages
CREATE POLICY "Service role can insert telegram messages"
  ON public.telegram_admin_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view telegram messages"
  ON public.telegram_admin_messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update telegram messages"
  ON public.telegram_admin_messages FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Index for performance
CREATE INDEX IF NOT EXISTS telegram_admin_messages_created_at_idx ON public.telegram_admin_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS telegram_admin_messages_telegram_user_id_idx ON public.telegram_admin_messages(telegram_user_id);
