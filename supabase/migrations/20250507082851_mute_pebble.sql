/*
  # Update Assignment Policies
  
  1. Changes
    - Fix student assignment completion policy
    - Add real-time subscription access policy
  
  2. Security
    - Allow anonymous users to update assignment completion status
    - Enable read access for real-time updates
*/

-- Update the existing policy to allow students to update their assignments
CREATE POLICY "Students can update assignment completion" ON assignments
FOR UPDATE USING (auth.uid() = student_id AND is_completed = true);

DROP POLICY IF EXISTS "Students can update assignment completion" ON assignments;


-- Add policy for real-time subscription access
CREATE POLICY "Enable read access for all users"
  ON assignments FOR SELECT
  TO anon
  USING (true);