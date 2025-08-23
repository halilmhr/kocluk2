-- Add password_changed flag to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Update existing students with short passwords to have password_changed = false
UPDATE students 
SET password_changed = FALSE 
WHERE LENGTH(password) <= 10;

-- Update existing students with long passwords to have password_changed = true
UPDATE students 
SET password_changed = TRUE 
WHERE LENGTH(password) > 10;