-- Create quiz_attempt table
CREATE TABLE IF NOT EXISTS quiz_attempt (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_student_id ON quiz_attempt(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_course_id ON quiz_attempt(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_student_course ON quiz_attempt(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_created_at ON quiz_attempt(created_at DESC);

-- Add unique constraint to prevent duplicate attempt numbers for same student/course
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_attempt_unique ON quiz_attempt(student_id, course_id, attempt_number);
