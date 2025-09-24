-- Disable RLS for students table
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own students" ON students;
DROP POLICY IF EXISTS "Users can insert their own students" ON students;
DROP POLICY IF EXISTS "Users can update their own students" ON students;
DROP POLICY IF EXISTS "Users can delete their own students" ON students;
DROP POLICY IF EXISTS "Public can view students for shared reports" ON students;
DROP POLICY IF EXISTS "Public can update student passwords" ON students;