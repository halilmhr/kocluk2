-- Sample data insertion script for testing student question statistics

-- First, let's insert some test data (assuming students table exists with some sample students)
-- This script can be run after the migrations to test the functionality

-- Insert sample question statistics for testing
-- Note: Replace the student_id UUIDs with actual student IDs from your students table

-- Example data for student 1 (replace with actual UUID)
INSERT INTO student_question_stats (student_id, date, subject, correct_answers, wrong_answers, notes)
VALUES 
  -- Sample student ID - replace with actual UUID from students table
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '5 days', 'Matematik', 15, 3, 'İyi bir performans'),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '5 days', 'Türkçe', 12, 2, NULL),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '4 days', 'Fizik', 8, 7, 'Daha fazla çalışma gerekli'),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '3 days', 'Matematik', 18, 2, 'Çok iyi'),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '2 days', 'Kimya', 10, 5, NULL),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 day', 'Türkçe', 14, 1, 'Mükemmel');

-- Example data for student 2 (replace with actual UUID)
INSERT INTO student_question_stats (student_id, date, subject, correct_answers, wrong_answers, notes)
VALUES 
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '6 days', 'Matematik', 10, 8, NULL),
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '5 days', 'Biyoloji', 13, 4, 'Güzel ilerleme'),
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '3 days', 'Tarih', 16, 2, 'Çok başarılı'),
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '2 days', 'Matematik', 12, 6, 'Gelişim var'),
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '1 day', 'Coğrafya', 9, 9, 'Orta seviye');

-- Test the views and functions after inserting data

-- Test 1: Check daily summary
SELECT * FROM student_daily_question_summary 
WHERE student_id = '11111111-1111-1111-1111-111111111111'
ORDER BY date DESC;

-- Test 2: Check subject performance
SELECT * FROM student_subject_performance 
WHERE student_id = '11111111-1111-1111-1111-111111111111'
ORDER BY average_success_rate DESC;

-- Test 3: Check overall performance
SELECT * FROM student_overall_performance 
WHERE student_id = '11111111-1111-1111-1111-111111111111';

-- Test 4: Test the upsert function (insert or update)
SELECT upsert_student_question_stats(
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE,
  'Test Dersi',
  20,
  5,
  'Test verisi'
);

-- Test 5: Test recent stats function
SELECT * FROM get_student_recent_stats(
  '11111111-1111-1111-1111-111111111111',
  30
);

-- Test 6: Test subject stats function
SELECT * FROM get_student_subject_stats(
  '11111111-1111-1111-1111-111111111111',
  'Matematik'
);

-- Test 7: Test available subjects function
SELECT * FROM get_student_available_subjects(
  '11111111-1111-1111-1111-111111111111'
);

-- Clean up test data (uncomment if needed)
-- DELETE FROM student_question_stats WHERE notes = 'Test verisi';