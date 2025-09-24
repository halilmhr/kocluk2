-- Create views and functions for student question statistics analysis

-- 1. Daily summary view for each student
CREATE OR REPLACE VIEW student_daily_question_summary AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    sqs.date,
    COUNT(*) as subjects_practiced,
    SUM(sqs.correct_answers) as total_correct,
    SUM(sqs.wrong_answers) as total_wrong,
    SUM(sqs.total_questions) as total_questions,
    ROUND(AVG(sqs.success_rate), 2) as average_success_rate,
    MAX(sqs.success_rate) as best_success_rate,
    MIN(sqs.success_rate) as worst_success_rate
FROM students s
JOIN student_question_stats sqs ON s.id = sqs.student_id
GROUP BY s.id, s.name, sqs.date
ORDER BY sqs.date DESC, s.name;

-- 2. Subject-wise performance view for each student
CREATE OR REPLACE VIEW student_subject_performance AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    sqs.subject,
    COUNT(*) as practice_sessions,
    SUM(sqs.correct_answers) as total_correct,
    SUM(sqs.wrong_answers) as total_wrong,
    SUM(sqs.total_questions) as total_questions,
    ROUND(AVG(sqs.success_rate), 2) as average_success_rate,
    MAX(sqs.success_rate) as best_success_rate,
    MIN(sqs.success_rate) as worst_success_rate,
    MIN(sqs.date) as first_practice_date,
    MAX(sqs.date) as last_practice_date
FROM students s
JOIN student_question_stats sqs ON s.id = sqs.student_id
GROUP BY s.id, s.name, sqs.subject
ORDER BY s.name, sqs.subject;

-- 3. Overall student performance summary
CREATE OR REPLACE VIEW student_overall_performance AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    COUNT(DISTINCT sqs.subject) as subjects_practiced,
    COUNT(*) as total_practice_sessions,
    SUM(sqs.correct_answers) as total_correct,
    SUM(sqs.wrong_answers) as total_wrong,
    SUM(sqs.total_questions) as total_questions,
    ROUND(
        CASE 
            WHEN SUM(sqs.total_questions) > 0 
            THEN (SUM(sqs.correct_answers)::DECIMAL / SUM(sqs.total_questions)) * 100
            ELSE 0 
        END, 2
    ) as overall_success_rate,
    MIN(sqs.date) as first_practice_date,
    MAX(sqs.date) as last_practice_date,
    ROUND(AVG(sqs.total_questions), 2) as avg_questions_per_session
FROM students s
JOIN student_question_stats sqs ON s.id = sqs.student_id
GROUP BY s.id, s.name
ORDER BY overall_success_rate DESC, total_questions DESC;

-- 4. Weekly progress tracking view
CREATE OR REPLACE VIEW student_weekly_progress AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    DATE_TRUNC('week', sqs.date) as week_start,
    COUNT(*) as practice_sessions,
    COUNT(DISTINCT sqs.subject) as subjects_practiced,
    SUM(sqs.correct_answers) as weekly_correct,
    SUM(sqs.wrong_answers) as weekly_wrong,
    SUM(sqs.total_questions) as weekly_total,
    ROUND(
        CASE 
            WHEN SUM(sqs.total_questions) > 0 
            THEN (SUM(sqs.correct_answers)::DECIMAL / SUM(sqs.total_questions)) * 100
            ELSE 0 
        END, 2
    ) as weekly_success_rate
FROM students s
JOIN student_question_stats sqs ON s.id = sqs.student_id
GROUP BY s.id, s.name, DATE_TRUNC('week', sqs.date)
ORDER BY s.name, week_start DESC;

-- 5. Function to get student's recent statistics
CREATE OR REPLACE FUNCTION get_student_recent_stats(
    p_student_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    practice_date DATE,
    subject VARCHAR(100),
    correct_answers INTEGER,
    wrong_answers INTEGER,
    total_questions INTEGER,
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sqs.date,
        sqs.subject,
        sqs.correct_answers,
        sqs.wrong_answers,
        sqs.total_questions,
        sqs.success_rate
    FROM student_question_stats sqs
    WHERE sqs.student_id = p_student_id
      AND sqs.date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    ORDER BY sqs.date DESC, sqs.subject;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to get subject performance for a student
CREATE OR REPLACE FUNCTION get_student_subject_stats(
    p_student_id UUID,
    p_subject VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    subject VARCHAR(100),
    practice_sessions BIGINT,
    total_correct BIGINT,
    total_wrong BIGINT,
    total_questions BIGINT,
    average_success_rate DECIMAL(5,2),
    last_practice_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sqs.subject,
        COUNT(*) as practice_sessions,
        SUM(sqs.correct_answers) as total_correct,
        SUM(sqs.wrong_answers) as total_wrong,
        SUM(sqs.total_questions) as total_questions,
        ROUND(AVG(sqs.success_rate), 2) as average_success_rate,
        MAX(sqs.date) as last_practice_date
    FROM student_question_stats sqs
    WHERE sqs.student_id = p_student_id
      AND (p_subject IS NULL OR sqs.subject = p_subject)
    GROUP BY sqs.subject
    ORDER BY average_success_rate DESC, total_questions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to get available subjects for a student
CREATE OR REPLACE FUNCTION get_student_available_subjects(
    p_student_id UUID
)
RETURNS TABLE (
    subject VARCHAR(100),
    practice_count BIGINT,
    last_practice DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        sqs.subject,
        COUNT(*) as practice_count,
        MAX(sqs.date) as last_practice
    FROM student_question_stats sqs
    WHERE sqs.student_id = p_student_id
    GROUP BY sqs.subject
    ORDER BY last_practice DESC, practice_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;