-- Alter processing_time column from INTEGER to DECIMAL to support floating point values
ALTER TABLE materials ALTER COLUMN processing_time TYPE DECIMAL(10,2);
