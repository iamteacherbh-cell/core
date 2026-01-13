-- Add telegram_chat_id to profiles table for storing each user's chat_id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Add telegram_chat_id to telegram_admin_messages for multi-user support
ALTER TABLE telegram_admin_messages ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_telegram_admin_messages_chat_id ON telegram_admin_messages(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_admin_messages_user_id ON telegram_admin_messages(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);

-- Update RLS policies to ensure proper access control
DROP POLICY IF EXISTS "Admin can view all telegram messages" ON telegram_admin_messages;
CREATE POLICY "Admin can view all telegram messages"
  ON telegram_admin_messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System can insert telegram messages" ON telegram_admin_messages;
CREATE POLICY "System can insert telegram messages"
  ON telegram_admin_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update telegram messages" ON telegram_admin_messages;
CREATE POLICY "Admin can update telegram messages"
  ON telegram_admin_messages FOR UPDATE
  TO authenticated
  USING (true);
