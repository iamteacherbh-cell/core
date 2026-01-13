-- Create telegram_admin_messages table for admin dashboard
CREATE TABLE IF NOT EXISTS telegram_admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id TEXT NOT NULL,
  telegram_username TEXT,
  telegram_chat_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  reply_text TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_telegram_admin_messages_chat_id ON telegram_admin_messages(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_admin_messages_user_id ON telegram_admin_messages(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_admin_messages_created ON telegram_admin_messages(created_at DESC);

-- Enable RLS
ALTER TABLE telegram_admin_messages ENABLE ROW LEVEL SECURITY;

-- Policy for service role to insert
CREATE POLICY "Service role can insert telegram admin messages"
ON telegram_admin_messages
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy for authenticated users to view
CREATE POLICY "Authenticated users can view telegram admin messages"
ON telegram_admin_messages
FOR SELECT
TO authenticated
USING (true);

-- Policy for authenticated users to update
CREATE POLICY "Authenticated users can update telegram admin messages"
ON telegram_admin_messages
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
