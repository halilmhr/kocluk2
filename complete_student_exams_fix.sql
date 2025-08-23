-- Complete fix for student_exams table
-- This script will completely recreate the student_exams table with correct structure

-- First, drop the entire table to start fresh
DROP TABLE IF EXISTS student_exams CASCADE;

-- Create the student_exams table with correct structure
CREATE TABLE student_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL, -- This will be auth.uid() directly
  exam_type VARCHAR(50) NOT NULL,
  exam_date DATE NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  empty_answers INTEGER NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  net_score DECIMAL(5,2) NOT NULL,
  subject_scores JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_exams ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_student_exams_student_id ON student_exams(student_id);
CREATE INDEX idx_student_exams_exam_date ON student_exams(exam_date);
CREATE INDEX idx_student_exams_exam_type ON student_exams(exam_type);

-- Create RLS policies that work with direct auth.uid() as student_id
CREATE POLICY "Students can view their own exams" ON student_exams
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own exams" ON student_exams
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own exams" ON student_exams
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Students can delete their own exams" ON student_exams
  FOR DELETE USING (student_id = auth.uid());

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_student_exams_updated_at
    BEFORE UPDATE ON student_exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON student_exams TO authenticated;
GRANT ALL ON student_exams TO anon;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_exams' 
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'student_exams';