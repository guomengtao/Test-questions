import os
import sqlite3
from supabase import create_client, Client
from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import json

# Supabase configuration
SUPABASE_URL = 'https://tkcrnfgnspvtzwbbvyfv.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY3JuZmduc3B2dHp3YmJ2eWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5ODgwMTgsImV4cCI6MjA0NjU2NDAxOH0.o4kZY3X0XxcpM3OHO3yw7O3of2PPtXdQ4CBFgp3CMO8'  # Your Supabase anon key

# SQLite database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'local_database.sqlite')

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# SQLAlchemy Base
Base = declarative_base()

# Define SQLAlchemy models to match Supabase tables
class Question(Base):
    __tablename__ = 'questions'
    
    id = Column(Integer, primary_key=True)
    question = Column(Text)
    answer = Column(Text, nullable=True)
    course_id = Column(Integer)
    data = Column(Text, nullable=True)  # Store JSON as text
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Course(Base):
    __tablename__ = 'courses'
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(Text, nullable=True)

class AnswerList(Base):
    __tablename__ = 'answer_list'
    
    id = Column(Integer, primary_key=True)
    question_id = Column(Integer)
    answer_text = Column(Text)
    user_id = Column(String)
    submission_time = Column(DateTime)
    difficulty_level = Column(String)
    evaluation_status = Column(String)
    score = Column(Integer)

def initialize_database():
    """Create SQLite database and tables if they don't exist"""
    # Create SQLAlchemy engine
    engine = create_engine(f'sqlite:///{DB_PATH}')
    
    # Create all tables
    Base.metadata.create_all(engine)
    
    return engine

def sync_courses():
    """Synchronize courses from Supabase to SQLite"""
    engine = create_engine(f'sqlite:///{DB_PATH}')
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Fetch courses from Supabase
        response = supabase.table('courses').select('*').execute()
        
        # Clear existing courses
        session.query(Course).delete()
        
        # Insert new courses
        for course in response.data:
            new_course = Course(
                id=course.get('id'),
                name=course.get('name'),
                description=course.get('description', '')
            )
            session.add(new_course)
        
        session.commit()
        print(f"Synchronized {len(response.data)} courses")
    except Exception as e:
        print(f"Error syncing courses: {e}")
        session.rollback()
    finally:
        session.close()

def sync_questions():
    """Synchronize questions from Supabase to SQLite"""
    engine = create_engine(f'sqlite:///{DB_PATH}')
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Fetch questions from Supabase
        response = supabase.table('questions').select('*').execute()
        
        # Clear existing questions
        session.query(Question).delete()
        
        # Insert new questions
        for question in response.data:
            new_question = Question(
                id=question.get('id'),
                question=question.get('question'),
                answer=question.get('answer', ''),
                course_id=question.get('course_id'),
                data=json.dumps(question.get('data', {})) if question.get('data') else None,
                created_at=datetime.datetime.fromisoformat(question.get('created_at')) if question.get('created_at') else datetime.datetime.utcnow()
            )
            session.add(new_question)
        
        session.commit()
        print(f"Synchronized {len(response.data)} questions")
    except Exception as e:
        print(f"Error syncing questions: {e}")
        session.rollback()
    finally:
        session.close()

def sync_answer_list():
    """Synchronize answer list from Supabase to SQLite"""
    engine = create_engine(f'sqlite:///{DB_PATH}')
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Fetch answer list from Supabase
        response = supabase.table('answer_list').select('*').execute()
        
        # Clear existing answer list
        session.query(AnswerList).delete()
        
        # Insert new answers
        for answer in response.data:
            new_answer = AnswerList(
                id=answer.get('id'),
                question_id=answer.get('question_id'),
                answer_text=answer.get('answer_text'),
                user_id=answer.get('user_id'),
                submission_time=datetime.datetime.fromisoformat(answer.get('submission_time')) if answer.get('submission_time') else datetime.datetime.utcnow(),
                difficulty_level=answer.get('difficulty_level'),
                evaluation_status=answer.get('evaluation_status'),
                score=answer.get('score')
            )
            session.add(new_answer)
        
        session.commit()
        print(f"Synchronized {len(response.data)} answers")
    except Exception as e:
        print(f"Error syncing answer list: {e}")
        session.rollback()
    finally:
        session.close()

def full_sync():
    """Perform a full synchronization of all tables"""
    initialize_database()
    sync_courses()
    sync_questions()
    sync_answer_list()

def main():
    # Set Supabase key from environment or replace manually
    import os
    os.environ['SUPABASE_KEY'] = 'YOUR_SUPABASE_ANON_KEY'
    
    full_sync()

if __name__ == '__main__':
    main()
