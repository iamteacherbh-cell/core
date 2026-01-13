-- Create AI messages table for storing conversations
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  telegram_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at DESC);

-- Enable RLS
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own messages
CREATE POLICY "Users can read own AI messages"
  ON ai_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert own AI messages"
  ON ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create admin messages view for admin dashboard
CREATE TABLE IF NOT EXISTS telegram_admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id TEXT NOT NULL,
  telegram_username TEXT,
  message_text TEXT NOT NULL,
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_telegram_admin_messages_telegram_user_id ON telegram_admin_messages(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_admin_messages_created_at ON telegram_admin_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_admin_messages_is_read ON telegram_admin_messages(is_read);

ALTER TABLE telegram_admin_messages ENABLE ROW LEVEL SECURITY;

-- Admins can read all messages
CREATE POLICY "Admins can read all telegram messages"
  ON telegram_admin_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can update telegram messages
CREATE POLICY "Admins can update telegram messages"
  ON telegram_admin_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
