-- Create chatbot_messages table for Vortex LMS AI Chatbot
CREATE TABLE IF NOT EXISTS chatbot_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_ai BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_user_id ON chatbot_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_user_created ON chatbot_messages(user_id, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own chatbot messages
CREATE POLICY "Users can view own chatbot messages" ON chatbot_messages
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own chatbot messages
CREATE POLICY "Users can insert own chatbot messages" ON chatbot_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own chatbot messages
CREATE POLICY "Users can update own chatbot messages" ON chatbot_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own chatbot messages
CREATE POLICY "Users can delete own chatbot messages" ON chatbot_messages
    FOR DELETE USING (auth.uid() = user_id);
