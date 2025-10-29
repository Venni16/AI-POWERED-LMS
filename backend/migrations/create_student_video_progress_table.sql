-- Create student_video_progress table
CREATE TABLE IF NOT EXISTS student_video_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one progress record per student-video pair
    UNIQUE(student_id, video_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_video_progress_student_id ON student_video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_video_progress_video_id ON student_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_student_video_progress_course_id ON student_video_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_video_progress_completed ON student_video_progress(completed);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_video_progress_updated_at
    BEFORE UPDATE ON student_video_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
