-- Drop the drill table if it exists
DROP TABLE IF EXISTS drill;

-- Create drill table with the same structure as answers table
CREATE TABLE drill AS 
SELECT * FROM answers
WITH NO DATA;

-- Copy all data from answers to drill
INSERT INTO drill 
SELECT * FROM answers;
