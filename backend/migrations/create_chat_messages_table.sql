-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_course_id ON public.chat_messages(course_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to read messages from courses they can access
CREATE POLICY "Users can read chat messages from accessible courses" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            LEFT JOIN public.enrollments e ON c.id = e.course_id
            WHERE c.id = chat_messages.course_id
            AND (
                c.instructor_id = auth.uid() OR
                e.student_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

-- Allow authenticated users to insert messages into courses they can access
CREATE POLICY "Users can insert chat messages into accessible courses" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.courses c
            LEFT JOIN public.enrollments e ON c.id = e.course_id
            WHERE c.id = chat_messages.course_id
            AND (
                c.instructor_id = auth.uid() OR
                e.student_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );
