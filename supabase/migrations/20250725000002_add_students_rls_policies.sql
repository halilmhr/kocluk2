-- Add RLS policies for students table

-- Enable RLS for students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own students
CREATE POLICY "Users can view their own students" ON students
FOR SELECT USING (user_id = auth.uid());

-- Policy for users to insert their own students
CREATE POLICY "Users can insert their own students" ON students
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own students
CREATE POLICY "Users can update their own students" ON students
FOR UPDATE USING (user_id = auth.uid());

-- Policy for users to delete their own students
CREATE POLICY "Users can delete their own students" ON students
FOR DELETE USING (user_id = auth.uid());

-- Public access policy for students (for shared reports and anonymous access)
CREATE POLICY "Public can view students for shared reports" ON students
FOR SELECT USING (true);

-- Public update policy for students (for password updates)
CREATE POLICY "Public can update student passwords" ON students
FOR UPDATE USING (true)
WITH CHECK (true);