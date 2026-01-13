-- Add telegram_chat_id to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'telegram_chat_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN telegram_chat_id text;
  END IF;
END $$;

-- Create index for faster telegram lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON profiles(telegram_chat_id);
