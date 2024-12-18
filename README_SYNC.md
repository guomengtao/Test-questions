# Database Synchronization Guide

## Prerequisites
- Python 3.8+
- Supabase Project
- Internet Connection

## Setup

### 1. Clone Repository
```bash
git clone [your-repo-url]
cd [repo-directory]
```

### 2. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install supabase sqlalchemy python-dotenv
```

### 4. Configure Supabase
1. Open `sync_database.py`
2. Replace `YOUR_SUPABASE_ANON_KEY` with your actual Supabase anon key
   - Find this in Supabase Project Settings > API
3. Verify `SUPABASE_URL` matches your project

### 5. Synchronize Database
```bash
python sync_database.py
```

## Synchronization Process
- Fetches data from Supabase
- Stores in local SQLite database
- Supports tables: 
  - Courses
  - Questions
  - Answer Lists

## Troubleshooting
- Ensure stable internet connection
- Check Supabase credentials
- Verify Python dependencies

## Notes
- Local database: `local_database.sqlite`
- Sync replaces entire local database
- Incremental sync coming in future updates
