-- Add summary columns to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS edited_summary TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS processing_time INTEGER;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
