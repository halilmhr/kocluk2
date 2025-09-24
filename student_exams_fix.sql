-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own exams" ON student_exams;
DROP POLICY IF EXISTS "Students can insert their own exams" ON student_exams;
DROP POLICY IF EXISTS "Students can update their own exams" ON student_exams;
DROP POLICY IF EXISTS "Students can delete their own exams" ON student_exams;

-- Drop existing table completely and recreate
DROP TABLE IF EXISTS student_exams CASCADE;

-- Create student_exams table for storing exam results
CREATE TABLE student_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  exam_type VARCHAR(10) NOT NULL CHECK (exam_type IN ('TYT', 'AYT', 'LGS')),
  exam_name VARCHAR(255) NOT NULL,
  exam_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- For TYT exams (subject-based)
  turkce_correct INTEGER DEFAULT 0,
  turkce_wrong INTEGER DEFAULT 0,
  matematik_correct INTEGER DEFAULT 0,
  matematik_wrong INTEGER DEFAULT 0,
  fen_correct INTEGER DEFAULT 0,
  fen_wrong INTEGER DEFAULT 0,
  sosyal_correct INTEGER DEFAULT 0,
  sosyal_wrong INTEGER DEFAULT 0,
  
  -- For AYT and LGS exams (single subject)
  subject_name VARCHAR(100),
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  blank_answers INTEGER DEFAULT 0,
  
  -- Calculated fields
  total_correct INTEGER DEFAULT 0,
  total_wrong INTEGER DEFAULT 0,
  total_net DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_student_exams_student_id ON student_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_student_exams_exam_type ON student_exams(exam_type);
CREATE INDEX IF NOT EXISTS idx_student_exams_exam_date ON student_exams(exam_date);

-- Enable RLS (Row Level Security)
ALTER TABLE student_exams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Students can view their own exams" ON student_exams
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own exams" ON student_exams
FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own exams" ON student_exams
FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Students can delete their own exams" ON student_exams
FOR DELETE USING (student_id = auth.uid());

-- Create trigger function for updating updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS update_student_exams_updated_at ON student_exams;
CREATE TRIGGER update_student_exams_updated_at BEFORE UPDATE ON student_exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();