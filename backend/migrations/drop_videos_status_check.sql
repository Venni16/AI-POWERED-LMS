-- Drop the videos_status_check constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.check_constraints
        WHERE constraint_name = 'videos_status_check'
        AND table_name = 'videos'
    ) THEN
        ALTER TABLE videos DROP CONSTRAINT videos_status_check;
        RAISE NOTICE 'Dropped constraint videos_status_check';
    ELSE
        RAISE NOTICE 'Constraint videos_status_check does not exist';
    END IF;
END $$;
