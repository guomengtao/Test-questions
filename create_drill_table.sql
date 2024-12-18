-- Create Drill table
CREATE TABLE drill (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from course_list to drill table
INSERT INTO drill (course_id, title, difficulty)
SELECT 
    course_id, 
    course_name AS title, 
    CASE 
        WHEN course_name IN ('历史', '生物', '地理') THEN 'medium'
        ELSE 'easy'
    END AS difficulty
FROM course_list;

-- Optional: Add a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drill_modtime
BEFORE UPDATE ON drill
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
