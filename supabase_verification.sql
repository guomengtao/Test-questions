-- Verify Questions Table
SELECT 
    COUNT(*) AS total_questions, 
    MIN(created_at) AS first_question_date,
    MAX(created_at) AS last_question_date
FROM questions;

-- Verify Answer Times
SELECT 
    COUNT(*) AS total_answer_times,
    AVG(count) AS average_answer_count,
    MIN(last_answered_at) AS earliest_answer,
    MAX(last_answered_at) AS latest_answer
FROM answer_times;

-- List All Questions with Their Answer Counts
SELECT 
    q.id, 
    q.question, 
    q.courser, 
    COALESCE(at.count, 0) AS answer_count,
    at.last_answered_at
FROM 
    questions q
LEFT JOIN 
    answer_times at ON q.id = at.question_id
ORDER BY 
    answer_count ASC, 
    q.created_at DESC;
