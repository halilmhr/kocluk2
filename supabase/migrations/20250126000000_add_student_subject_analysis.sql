-- Create student_subject_analysis table for storing subject progress
CREATE TABLE IF NOT EXISTS student_subject_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL, -- e.g., 'math', 'turkish', 'ayt-geography'
  subject_name TEXT NOT NULL, -- e.g., 'Matematik', 'Türkçe', 'Coğrafya'
  subject_category TEXT NOT NULL CHECK (subject_category IN ('TYT', 'AYT')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_topics JSONB DEFAULT '[]'::jsonb, -- Array of completed topic IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create unique constraint for student-subject combination
CREATE UNIQUE INDEX IF NOT EXISTS student_subject_analysis_unique 
ON student_subject_analysis(student_id, subject_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_subject_analysis_student_id ON student_subject_analysis(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subject_analysis_category ON student_subject_analysis(subject_category);
CREATE INDEX IF NOT EXISTS idx_student_subject_analysis_progress ON student_subject_analysis(progress);

-- Enable RLS
ALTER TABLE student_subject_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Students can view their own subject analysis
CREATE POLICY "Students can view their own subject analysis" ON student_subject_analysis
  FOR SELECT USING (
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Students can insert their own subject analysis
CREATE POLICY "Students can insert their own subject analysis" ON student_subject_analysis
  FOR INSERT WITH CHECK (
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Students can update their own subject analysis
CREATE POLICY "Students can update their own subject analysis" ON student_subject_analysis
  FOR UPDATE USING (
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Students can delete their own subject analysis
CREATE POLICY "Students can delete their own subject analysis" ON student_subject_analysis
  FOR DELETE USING (
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Coaches can view subject analysis of their students
CREATE POLICY "Coaches can view their students subject analysis" ON student_subject_analysis
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Coaches can insert subject analysis for their students
CREATE POLICY "Coaches can insert subject analysis for their students" ON student_subject_analysis
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Coaches can update subject analysis of their students
CREATE POLICY "Coaches can update their students subject analysis" ON student_subject_analysis
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_subject_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_student_subject_analysis_updated_at_trigger
  BEFORE UPDATE ON student_subject_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_student_subject_analysis_updated_at();

-- Function to calculate progress based on completed topics
CREATE OR REPLACE FUNCTION calculate_subject_progress(completed_topics_array JSONB, total_topics INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF total_topics = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((jsonb_array_length(completed_topics_array)::FLOAT / total_topics::FLOAT) * 100);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE student_subject_analysis IS 'Stores student progress for each subject and their completed topics';
COMMENT ON COLUMN student_subject_analysis.subject_id IS 'Unique identifier for the subject (e.g., math, turkish, ayt-geography)';
COMMENT ON COLUMN student_subject_analysis.completed_topics IS 'JSONB array of completed topic IDs for this subject';
COMMENT ON COLUMN student_subject_analysis.progress IS 'Calculated progress percentage (0-100) based on completed topics';