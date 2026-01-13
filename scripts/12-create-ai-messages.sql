-- Create ai_messages table for AI chat history
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_messages(created_at DESC);

-- Enable RLS
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own messages
CREATE POLICY "Users can view their own AI messages"
ON ai_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for users to insert their own messages
CREATE POLICY "Users can insert their own AI messages"
ON ai_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
