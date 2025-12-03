CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SGD',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, succeeded, failed
    stripe_session_id TEXT UNIQUE NOT NULL,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at on row update
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE
ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();