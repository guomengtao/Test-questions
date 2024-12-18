-- Drop the drill table if it exists
DROP TABLE IF EXISTS drill;

-- Create drill table with the same structure as answer_list table
CREATE TABLE drill AS 
SELECT * FROM answer_list
WITH NO DATA;

-- Copy all data from answer_list to drill
INSERT INTO drill 
SELECT * FROM answer_list;
