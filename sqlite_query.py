import sqlite3
import json

# Path to the SQLite database
DB_PATH = 'local_database.sqlite'

def connect_db():
    """Establish a connection to the SQLite database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
        return None

def get_table_info():
    """Get information about tables in the database"""
    conn = connect_db()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("Tables in the database:")
        for table in tables:
            print(f"\n--- {table[0]} ---")
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table[0]});")
            columns = cursor.fetchall()
            
            print("Columns:")
            for column in columns:
                print(f"  - {column[1]} ({column[2]})")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table[0]};")
            row_count = cursor.fetchone()[0]
            print(f"Total rows: {row_count}")
    
    except sqlite3.Error as e:
        print(f"Error retrieving table information: {e}")
    
    finally:
        conn.close()

def query_courses():
    """Query and display courses"""
    conn = connect_db()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM courses")
        courses = cursor.fetchall()
        
        print("\nCourses:")
        for course in courses:
            print(f"ID: {course[0]}, Name: {course[1]}, Description: {course[2] or 'N/A'}")
    
    except sqlite3.Error as e:
        print(f"Error querying courses: {e}")
    
    finally:
        conn.close()

def query_questions():
    """Query and display questions"""
    conn = connect_db()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, question, course_id, created_at FROM questions LIMIT 10")
        questions = cursor.fetchall()
        
        print("\nQuestions (first 10):")
        for question in questions:
            print(f"ID: {question[0]}")
            print(f"Question: {question[1]}")
            print(f"Course ID: {question[2]}")
            print(f"Created At: {question[3]}\n")
    
    except sqlite3.Error as e:
        print(f"Error querying questions: {e}")
    
    finally:
        conn.close()

def query_answers():
    """Query and display answers"""
    conn = connect_db()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, question_id, answer_text, difficulty_level FROM answer_list LIMIT 10")
        answers = cursor.fetchall()
        
        print("\nAnswers (first 10):")
        for answer in answers:
            print(f"ID: {answer[0]}")
            print(f"Question ID: {answer[1]}")
            print(f"Difficulty: {answer[3]}")
            print(f"Answer Preview: {answer[2][:100]}...\n")
    
    except sqlite3.Error as e:
        print(f"Error querying answers: {e}")
    
    finally:
        conn.close()

def main():
    get_table_info()
    query_courses()
    query_questions()
    query_answers()

if __name__ == '__main__':
    main()
