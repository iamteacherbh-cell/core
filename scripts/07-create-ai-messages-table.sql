-- Create AI messages table for AI chat history
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS ai_messages_user_id_idx ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS ai_messages_created_at_idx ON ai_messages(created_at DESC);

-- Enable RLS
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI messages
CREATE POLICY "Users can view their own AI messages"
  ON ai_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own AI messages
CREATE POLICY "Users can insert their own AI messages"
  ON ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
