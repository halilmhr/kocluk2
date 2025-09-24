-- Add RLS policy for students to view their own assignments
CREATE POLICY "Students can view their own assignments" ON assignments
FOR SELECT TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));