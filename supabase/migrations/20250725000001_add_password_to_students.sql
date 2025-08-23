-- Add password column to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS password TEXT;