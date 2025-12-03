-- Add transcript column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS transcript TEXT;
