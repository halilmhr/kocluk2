-- Fix student_exams table structure and RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own exams" ON student_exams;
DROP POLICY IF EXISTS "Students can insert their own exams" ON student_exams;
DROP POLICY IF EXISTS "Students can update their own exams" ON student_exams;
DROP POLICY IF EXISTS "Students can delete their own exams" ON student_exams;

-- Drop existing foreign key constraint if exists
ALTER TABLE IF EXISTS student_exams DROP CONSTRAINT IF EXISTS student_exams_student_id_fkey;

-- Create RLS policies that work with direct auth.uid() as student_id
CREATE POLICY "Students can view their own exams" ON student_exams
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own exams" ON student_exams
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own exams" ON student_exams
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Students can delete their own exams" ON student_exams
  FOR DELETE USING (student_id = auth.uid());