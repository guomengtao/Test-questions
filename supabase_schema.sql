-- Drop existing tables if they exist
DROP TABLE IF EXISTS answer_list CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS courser CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create courser table
CREATE TABLE courser (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    department TEXT,
    instructor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    department TEXT,
    instructor TEXT,
    semester TEXT,
    year INTEGER,
    courser_id UUID REFERENCES courser(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT,
    course_id BIGINT REFERENCES courses(id),
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create answer_list table with enhanced fields
CREATE TABLE answer_list (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id),
    
    -- Answer content
    answer_text TEXT NOT NULL,
    
    -- Metadata
    user_id INTEGER,  -- Reference to user who submitted the answer
    submission_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Evaluation fields
    score NUMERIC(5,2) DEFAULT NULL,  -- Numeric score for the answer
    evaluation_status TEXT DEFAULT 'pending' 
        CHECK (evaluation_status IN ('pending', 'reviewed', 'graded')),
    
    -- Teacher/Grader feedback
    teacher_comment TEXT,
    graded_by INTEGER,  -- Reference to teacher/grader
    grade_time TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    difficulty_level TEXT DEFAULT 'medium' 
        CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    
    -- JSON field for extra flexible metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

-- Create an index for performance and query optimization
CREATE INDEX idx_answer_list_question_id ON answer_list(question_id);
CREATE INDEX idx_answer_list_user_id ON answer_list(user_id);
CREATE INDEX idx_answer_list_evaluation_status ON answer_list(evaluation_status);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for courser table to update updated_at
CREATE TRIGGER update_courser_modtime
BEFORE UPDATE ON courser
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_questions_modtime ON questions;
CREATE TRIGGER update_questions_modtime
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Trigger to update updated_at timestamp for courses
CREATE OR REPLACE FUNCTION update_courses_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_modtime
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_courses_modtime();

-- RPC function to add a new answer entry or create initial entry
CREATE OR REPLACE FUNCTION add_answer_entry(
    p_question_id UUID, 
    p_answer_contents TEXT DEFAULT NULL, 
    p_teacher_comment TEXT DEFAULT NULL, 
    p_score NUMERIC DEFAULT NULL,
    p_is_initial BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    total_answers BIGINT,
    answer_contents TEXT, 
    teacher_comment TEXT, 
    score NUMERIC,
    is_initial BOOLEAN
) AS $$
DECLARE
    v_total_answers BIGINT;
    v_existing_entry UUID;
    v_final_answer_contents TEXT;
    v_final_teacher_comment TEXT;
    v_final_score NUMERIC;
BEGIN
    -- Check if an entry already exists for this question
    SELECT id INTO v_existing_entry 
    FROM answer_list 
    WHERE question_id = p_question_id AND answered_by = auth.uid();

    -- Determine final values
    v_final_answer_contents := COALESCE(p_answer_contents, 'Placeholder');
    v_final_teacher_comment := p_teacher_comment;
    v_final_score := COALESCE(p_score, 0);

    -- If it's an initial entry and no entry exists, create with 0 score
    IF p_is_initial AND v_existing_entry IS NULL THEN
        INSERT INTO answer_list (
            question_id, 
            answer_contents, 
            teacher_comment, 
            score, 
            answered_by,
            last_answered_at
        )
        VALUES (
            p_question_id, 
            v_final_answer_contents, 
            v_final_teacher_comment, 
            v_final_score, 
            auth.uid(),
            NOW()
        );
    -- If not initial and contents provided, update or insert
    ELSIF p_answer_contents IS NOT NULL THEN
        -- Update existing entry or insert new
        IF v_existing_entry IS NOT NULL THEN
            UPDATE answer_list
            SET 
                answer_contents = v_final_answer_contents,
                teacher_comment = v_final_teacher_comment,
                score = v_final_score,
                last_answered_at = NOW()
            WHERE id = v_existing_entry;
        ELSE
            INSERT INTO answer_list (
                question_id, 
                answer_contents, 
                teacher_comment, 
                score, 
                answered_by,
                last_answered_at
            )
            VALUES (
                p_question_id, 
                v_final_answer_contents, 
                v_final_teacher_comment, 
                v_final_score, 
                auth.uid(),
                NOW()
            );
        END IF;
    END IF;

    -- Get the total number of answers for this question
    SELECT COUNT(*) INTO v_total_answers
    FROM answer_list
    WHERE question_id = p_question_id;

    -- Return the entry details and total answer count
    RETURN QUERY 
    SELECT 
        v_total_answers, 
        v_final_answer_contents, 
        v_final_teacher_comment, 
        v_final_score,
        p_is_initial;
END;
$$ LANGUAGE plpgsql;

-- Delete existing courses
DELETE FROM courses;

-- Insert the four specified courses
INSERT INTO courses (name, code, description) VALUES 
(
    'History', 
    'HIST', 
    'Explore the past, understand the present, and shape the future through historical study.'
),
(
    'Biology', 
    'BIO', 
    'Study of life and living organisms, from microscopic cells to complex ecosystems.'
),
(
    'Geography', 
    'GEO', 
    'Examine the Earth''s landscapes, environments, places, and the relationships between people and their environments.'
),
(
    'Politics', 
    'POL', 
    'Analyze political systems, governance, power dynamics, and the structures that shape human societies.'
);

-- Insert demo coursers
INSERT INTO courser (name, description, department, instructor) VALUES 
('Introduction to Computer Science', 'Fundamental concepts of computer science', 'Computer Science', 'Dr. Jane Smith'),
('Web Development Basics', 'Learn the fundamentals of web development', 'Computer Science', 'Prof. John Doe'),
('Data Structures and Algorithms', 'Advanced data structures and algorithm design', 'Computer Science', 'Dr. Alice Johnson'),
('Machine Learning Fundamentals', 'Introduction to machine learning concepts', 'Data Science', 'Prof. Michael Brown'),
('Software Engineering Principles', 'Best practices in software development', 'Software Engineering', 'Dr. Emily Wilson');

-- Update existing courses with courser references (example)
UPDATE courses c
SET courser_id = (
    SELECT id FROM courser 
    WHERE name = 
        CASE 
            WHEN c.name LIKE '%Computer Science%' THEN 'Introduction to Computer Science'
            WHEN c.name LIKE '%Web Development%' THEN 'Web Development Basics'
            WHEN c.name LIKE '%Data Structures%' THEN 'Data Structures and Algorithms'
            WHEN c.name LIKE '%Machine Learning%' THEN 'Machine Learning Fundamentals'
            WHEN c.name LIKE '%Software Engineering%' THEN 'Software Engineering Principles'
            ELSE NULL
        END
);

-- Delete existing questions
DELETE FROM questions;

-- Get course IDs for Geography, Biology, and History
WITH course_ids AS (
    SELECT 
        (SELECT id FROM courses WHERE name = 'Geography' LIMIT 1) AS geography_id,
        (SELECT id FROM courses WHERE name = 'Biology' LIMIT 1) AS biology_id,
        (SELECT id FROM courses WHERE name = 'History' LIMIT 1) AS history_id
)

-- Insert the five specific questions
INSERT INTO questions (question, answer, course_id, data) VALUES 
(
    '长江航运价值大的原因是什么？',
    '1. 长江流域地理位置重要，连接中国中西部地区
    2. 水运成本低，适合大宗货物运输
    3. 沿江经济发达，工农业发展需要水运
    4. 长江水系广泛，连接多个省份和重要城市
    5. 对外贸易和经济发展具有重要战略意义',
    (SELECT geography_id FROM course_ids),
    '{"difficulty": "medium", "tags": ["geography", "transportation", "economic"]}'
),
(
    '长江水能丰富的原因是什么？',
    '1. 地形条件：长江流经高原和山地，落差大
    2. 降水充沛：长江流域降水量丰富
    3. 水系发达：支流众多，水量稳定
    4. 地质构造：形成多级阶梯地形，有利于水电开发
    5. 季节性降水：丰富的季节性降水为水能提供保障',
    (SELECT geography_id FROM course_ids),
    '{"difficulty": "medium", "tags": ["geography", "water", "energy"]}'
),
(
    '排尿的作用是什么？',
    '1. 排出体内代谢废物和多余水分
    2. 维持体内水和电解质平衡
    3. 调节体内酸碱平衡
    4. 清除有害物质和毒素
    5. 帮助调节血压',
    (SELECT biology_id FROM course_ids),
    '{"difficulty": "easy", "tags": ["biology", "human body", "physiology"]}'
),
(
    '人体的泌尿系统由哪四部分组成？各自的作用是什么？',
    '1. 肾脏：过滤血液，产生尿液，排出代谢废物
    2. 输尿管：将肾脏产生的尿液传输到膀胱
    3. 膀胱：储存尿液，控制排尿
    4. 尿道：将尿液从体内排出',
    (SELECT biology_id FROM course_ids),
    '{"difficulty": "medium", "tags": ["biology", "human anatomy", "urinary system"]}'
),
(
    '长征的原因和意义是什么？',
    '原因：
    1. 国民党对中国共产党的军事围剿
    2. 红军被迫突破敌人的军事封锁
    3. 寻找革命根据地和战略转移

    意义：
    1. 极大地锻炼和考验了共产党和红军
    2. 扩大了中国共产党的政治影响力
    3. 建立了中央革命根据地
    4. 成为中国革命史上的重要转折点
    5. 体现了共产党人的革命意志和斗争精神',
    (SELECT history_id FROM course_ids),
    '{"difficulty": "hard", "tags": ["history", "chinese revolution", "communist party"]}'
);

-- Remove all RLS policies
ALTER TABLE courser DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE answer_list DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage coursers" ON courser;
DROP POLICY IF EXISTS "Enable read access for all users" ON courser;
DROP POLICY IF EXISTS "Users can insert their own coursers" ON courser;
DROP POLICY IF EXISTS "Users can update own coursers" ON courser;

-- Ensure no RLS policies remain
DO $$
BEGIN
    -- Remove RLS from all tables
    EXECUTE 'ALTER TABLE courser DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE courses DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE questions DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE answer_list DISABLE ROW LEVEL SECURITY';
END $$;

-- Delete existing data from answer_list
DELETE FROM answer_list;

-- Insert 5 test answers across different questions and scenarios
INSERT INTO answer_list (
    question_id, 
    answer_text, 
    user_id, 
    submission_time, 
    score, 
    evaluation_status, 
    teacher_comment, 
    graded_by, 
    grade_time, 
    difficulty_level, 
    metadata
) VALUES 
(
    1,  -- Assuming this is a Geography question about the Yangtze River
    '长江是中国最长的河流，全长约6300公里。它发源于青海省的唐古拉山脉，流经青海、四川、重庆、湖北、湖南、江西、安徽和江苏等省份，最终在上海附近的长江口入海。长江流域面积约180万平方公里，是中国重要的水运、灌溉和水电资源。',
    1,  -- User ID
    CURRENT_TIMESTAMP,
    85.5,  -- Score
    'graded',  -- Evaluation status
    '答案详细且准确，展现了对长江地理和经济重要性的深入理解。',  -- Teacher comment
    2,  -- Graded by (teacher ID)
    CURRENT_TIMESTAMP,
    'medium',  -- Difficulty level
    '{"source": "student_research", "references": ["Geography Textbook", "China River Atlas"]}'
),
(
    2,  -- Assuming a Biology question about cellular respiration
    '细胞呼吸是细胞将葡萄糖分解为二氧化碳和水的过程，同时释放能量。这个过程主要在线粒体中进行，包括三个主要阶段：糖酵解、克雷伯斯循环和电子传递链。这个过程对于生物体获取能量至关重要，因为它可以将化学能转化为ATP（三磷酸腺苷）。',
    3,  -- User ID
    CURRENT_TIMESTAMP,
    92.0,  -- Score
    'reviewed',  -- Evaluation status
    '解释清晰，专业术语使用准确，展示了对生物化学过程的深入理解。',  -- Teacher comment
    4,  -- Graded by (teacher ID)
    CURRENT_TIMESTAMP,
    'hard',  -- Difficulty level
    '{"complexity": "high", "topic": "cellular metabolism"}'
),
(
    3,  -- Assuming a History question about the Industrial Revolution
    '工业革命始于18世纪中后期的英国，随后迅速蔓延到欧洲其他国家和美国。这是人类历史上一个重大转折点，标志着从手工生产向机械化生产的转变。蒸汽机的发明、纺织机械化和冶金技术的进步，极大地提高了生产效率，同时也带来了社会结构的深刻变革。',
    2,  -- User ID
    CURRENT_TIMESTAMP,
    78.5,  -- Score
    'graded',  -- Evaluation status
    '论述基本准确，但可以更深入地分析工业革命的社会影响。',  -- Teacher comment
    1,  -- Graded by (teacher ID)
    CURRENT_TIMESTAMP,
    'medium',  -- Difficulty level
    '{"period": "18th-19th century", "key_inventions": ["steam_engine", "spinning_jenny"]}'
),
(
    4,  -- Assuming a Politics question about democratic systems
    '民主制度是一种政治制度，强调公民通过选举参与国家政治生活，保障公民的政治权利和自由。代议制民主是现代最常见的民主形式，公民通过选举代表来参与政治决策。民主的核心价值包括：平等权利、言论自由、法治和权力制衡。',
    4,  -- User ID
    CURRENT_TIMESTAMP,
    88.0,  -- Score
    'reviewed',  -- Evaluation status
    '对民主制度的基本原则阐述准确，理解深刻。',  -- Teacher comment
    3,  -- Graded by (teacher ID)
    CURRENT_TIMESTAMP,
    'medium',  -- Difficulty level
    '{"political_system": "representative_democracy", "key_principles": ["equality", "freedom_of_speech"]}'
),
(
    5,  -- Assuming a Geography question about global climate zones
    '地球的气候带主要分为热带、亚热带、温带、亚寒带和极地气候带。这些气候带的形成主要受纬度、海拔、洋流和地形影响。每个气候带都有其独特的植被、动物群和生态系统特征。气候变化正在影响这些气候带的分布和特征。',
    5,  -- User ID
    CURRENT_TIMESTAMP,
    80.0,  -- Score
    'graded',  -- Evaluation status
    '回答全面，展示了对气候地理学的基本理解。可以增加更多具体例子。',  -- Teacher comment
    2,  -- Graded by (teacher ID)
    CURRENT_TIMESTAMP,
    'medium',  -- Difficulty level
    '{"climate_factors": ["latitude", "altitude", "ocean_currents"], "global_impact": "climate_change"}'
);

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_courses_with_stats();

-- Function to get courses with enhanced statistics including courser details
CREATE OR REPLACE FUNCTION get_courses_with_stats()
RETURNS TABLE (
    course_id BIGINT,
    course_name TEXT,
    course_code TEXT,
    courser_name TEXT,
    courser_department TEXT,
    courser_instructor TEXT,
    total_questions BIGINT,
    total_answers BIGINT,
    avg_answer_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS course_id,
        c.name AS course_name,
        c.code AS course_code,
        cr.name AS courser_name,
        cr.department AS courser_department,
        cr.instructor AS courser_instructor,
        COUNT(DISTINCT q.id) AS total_questions,
        COUNT(DISTINCT a.id) AS total_answers,
        COALESCE(AVG(
            CASE 
                WHEN a.data->>'score' IS NOT NULL 
                THEN (a.data->>'score')::NUMERIC 
                ELSE NULL 
            END
        ), 0) AS avg_answer_score
    FROM 
        courses c
    LEFT JOIN 
        courser cr ON c.courser_id = cr.id
    LEFT JOIN 
        questions q ON q.course_id = c.id
    LEFT JOIN 
        answer_list a ON a.question_id = q.id
    GROUP BY 
        c.id, c.name, c.code, 
        cr.name, cr.department, cr.instructor
    ORDER BY 
        total_questions DESC, course_name;
END;
$$;

-- Function to get a single random question with course name and total answers
CREATE OR REPLACE FUNCTION get_random_question()
RETURNS TABLE (
    id INTEGER,
    question TEXT,
    answer TEXT,
    course_id INTEGER,
    course_name TEXT,
    course_code TEXT,
    total_answers BIGINT,
    data JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id::INTEGER,
        q.question,
        q.answer,
        COALESCE(c.id, 0)::INTEGER AS course_id,
        COALESCE(c.name, 'Uncategorized') AS course_name,
        COALESCE(c.code, 'N/A') AS course_code,
        COUNT(a.id)::BIGINT AS total_answers,
        q.data
    FROM 
        questions q
    LEFT JOIN 
        courses c ON q.course_id = c.id
    LEFT JOIN 
        answer_list a ON a.question_id = q.id
    GROUP BY 
        q.id, q.question, q.answer, c.id, c.name, c.code, q.data
    ORDER BY 
        RANDOM()
    LIMIT 1;
END;
$$;
