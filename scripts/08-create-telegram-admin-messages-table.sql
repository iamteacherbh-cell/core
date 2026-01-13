-- Create telegram admin messages table if not exists
CREATE TABLE IF NOT EXISTS telegram_admin_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id TEXT NOT NULL,
  telegram_username TEXT,
  telegram_chat_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  reply_text TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS telegram_admin_messages_telegram_user_id_idx ON telegram_admin_messages(telegram_user_id);
CREATE INDEX IF NOT EXISTS telegram_admin_messages_is_read_idx ON telegram_admin_messages(is_read);
CREATE INDEX IF NOT EXISTS telegram_admin_messages_created_at_idx ON telegram_admin_messages(created_at DESC);

-- Enable RLS
ALTER TABLE telegram_admin_messages ENABLE ROW LEVEL SECURITY;

-- Admins can view all messages
CREATE POLICY "Admins can view all telegram messages"
  ON telegram_admin_messages FOR SELECT
  USING (true);

-- Service role can insert messages
CREATE POLICY "Service role can insert telegram messages"
  ON telegram_admin_messages FOR INSERT
  WITH CHECK (true);

-- Admins can update messages
CREATE POLICY "Admins can update telegram messages"
  ON telegram_admin_messages FOR UPDATE
  USING (true);
