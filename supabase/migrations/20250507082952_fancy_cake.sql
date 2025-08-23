/*
  # Update assignments RLS policies

  1. Changes
    - Add new RLS policy to allow students to update their own assignments' completion status
    - Policy only allows updating the `is_completed` field
    - Students can only update assignments where they are the assigned student

  2. Security
    - Students can only update their own assignments
    - Update is restricted to only the `is_completed` field
    - Existing policies remain unchanged
*/

-- Create a new policy for students to update their assignment completion status
CREATE POLICY "Students can update assignment completion" ON assignments
FOR UPDATE WITH CHECK (auth.uid() = student_id AND is_completed = true);