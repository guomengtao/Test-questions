-- Create course_list table if it doesn't exist
CREATE TABLE IF NOT EXISTS course_list (
    course_id SERIAL PRIMARY KEY,
    course_name TEXT NOT NULL,
    course_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial course data if not exists
INSERT INTO course_list (course_name, course_description)
VALUES 
    ('历史', '探索人类文明的发展历程，理解重大历史事件和社会变迁'),
    ('生物', '研究生命现象和生命过程的科学，包括生物多样性、遗传和生态系统'),
    ('地理', '研究地球表面的自然现象和人类活动的空间分布与相互作用');

-- Drop the drill table if it exists
DROP TABLE IF EXISTS drill;

-- Create drill table
CREATE TABLE drill (
    id SERIAL PRIMARY KEY,
    course_id INTEGER,
    title TEXT,
    description TEXT,
    difficulty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from answer_list to drill
INSERT INTO drill (course_id, title, description, difficulty)
SELECT 
    course_id, 
    question_title, 
    question_content, 
    COALESCE(difficulty, 'medium')
FROM answer_list
WHERE question_title IS NOT NULL;

-- Verify the data was copied correctly
SELECT * FROM drill;
