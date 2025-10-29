-- Create failed_login_attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at ON failed_login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email_attempted_at ON failed_login_attempts(email, attempted_at);

-- Create a function to clean up old failed attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_failed_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM failed_login_attempts
    WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up old records
CREATE OR REPLACE FUNCTION trigger_cleanup_failed_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up old records when a new attempt is inserted
    PERFORM cleanup_failed_login_attempts();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_failed_login_attempts_trigger
    AFTER INSERT ON failed_login_attempts
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_cleanup_failed_login_attempts();
