-- Create achievement table
CREATE TABLE IF NOT EXISTS achievement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievement_student_id ON achievement(student_id);
CREATE INDEX IF NOT EXISTS idx_achievement_course_id ON achievement(course_id);
CREATE INDEX IF NOT EXISTS idx_achievement_type ON achievement(type);
CREATE INDEX IF NOT EXISTS idx_achievement_created_at ON achievement(created_at DESC);

-- Add unique constraint to prevent duplicate achievements for same student/course/type
CREATE UNIQUE INDEX IF NOT EXISTS idx_achievement_unique ON achievement(student_id, course_id, type);
