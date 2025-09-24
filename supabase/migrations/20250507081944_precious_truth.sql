/*
  # Update RLS policies for assignments
  
  1. Changes
    - Update RLS policy for anonymous users to update assignment completion status
    - Add policy for real-time subscription access
*/

-- Update the existing policy to allow students to update their assignments
CREATE POLICY "Students can update assignment completion" ON assignments
FOR UPDATE USING (auth.uid() = student_id AND is_completed = true);

CREATE POLICY "Enable read access for all users" ON assignments
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students can update assignment completion" ON assignments;