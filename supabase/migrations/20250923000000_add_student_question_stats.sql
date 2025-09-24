-- Create student_question_stats table for daily question practice tracking
CREATE TABLE IF NOT EXISTS student_question_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  subject VARCHAR(100) NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER GENERATED ALWAYS AS (correct_answers + wrong_answers) STORED,
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN (correct_answers + wrong_answers) > 0 
      THEN ROUND((correct_answers::DECIMAL / (correct_answers + wrong_answers)) * 100, 2)
      ELSE 0 
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT student_question_stats_correct_answers_check CHECK (correct_answers >= 0),
  CONSTRAINT student_question_stats_wrong_answers_check CHECK (wrong_answers >= 0),
  CONSTRAINT student_question_stats_total_check CHECK ((correct_answers + wrong_answers) > 0),
  
  -- Unique constraint to prevent duplicate entries for same student, date, and subject
  CONSTRAINT student_question_stats_unique_entry UNIQUE (student_id, date, subject)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_question_stats_student_id ON student_question_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_student_question_stats_date ON student_question_stats(date);
CREATE INDEX IF NOT EXISTS idx_student_question_stats_subject ON student_question_stats(subject);
CREATE INDEX IF NOT EXISTS idx_student_question_stats_student_date ON student_question_stats(student_id, date);

-- Add foreign key constraint (assuming students table exists)
ALTER TABLE student_question_stats 
ADD CONSTRAINT fk_student_question_stats_student_id 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Enable RLS (Row Level Security)
ALTER TABLE student_question_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for student_question_stats
CREATE POLICY "Students can view their own question stats" ON student_question_stats
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own question stats" ON student_question_stats
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own question stats" ON student_question_stats
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Students can delete their own question stats" ON student_question_stats
  FOR DELETE USING (student_id = auth.uid());

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_student_question_stats_updated_at 
BEFORE UPDATE ON student_question_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle upsert (insert or update) operations
CREATE OR REPLACE FUNCTION upsert_student_question_stats(
  p_student_id UUID,
  p_date DATE,
  p_subject VARCHAR(100),
  p_correct_answers INTEGER,
  p_wrong_answers INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO student_question_stats (
    student_id, 
    date, 
    subject, 
    correct_answers, 
    wrong_answers, 
    notes
  )
  VALUES (
    p_student_id, 
    p_date, 
    p_subject, 
    p_correct_answers, 
    p_wrong_answers, 
    p_notes
  )
  ON CONFLICT (student_id, date, subject) 
  DO UPDATE SET
    correct_answers = EXCLUDED.correct_answers,
    wrong_answers = EXCLUDED.wrong_answers,
    notes = COALESCE(EXCLUDED.notes, student_question_stats.notes),
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;