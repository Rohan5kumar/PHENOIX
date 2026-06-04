import os
import sqlite3
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client

router = APIRouter(prefix="/waitlist", tags=["waitlist"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")

# Lazy initialization
supabase: Client = None

# Local SQLite fallback setup
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "waitlist.db")

def init_local_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_to_local_db(email: str):
    init_local_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO leads (email) VALUES (?)", (email,))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = True  # Already registered locally, return success silently
    except Exception as e:
        conn.close()
        raise e
    conn.close()
    return success

def get_supabase():
    global supabase
    if supabase is None:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase

class WaitlistEntry(BaseModel):
    email: EmailStr

@router.post("/join")
async def join_waitlist(entry: WaitlistEntry):
    # 1. Check if Supabase keys are placeholders
    is_mock = "your-project" in SUPABASE_URL or "your-anon-key" in SUPABASE_KEY
    
    if is_mock:
        try:
            save_to_local_db(entry.email)
            return {
                "status": "success",
                "storage": "local_sqlite",
                "message": "Saved to resilient local SQLite database (Supabase unconfigured)."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Local SQLite error: {str(e)}")
            
    # 2. Attempt Supabase with local SQLite fallback on failure
    try:
        db = get_supabase()
        response = db.table("leads").insert({"email": entry.email}).execute()
        return {
            "status": "success",
            "storage": "supabase",
            "data": response.data
        }
    except Exception as e:
        # Fallback to local SQLite so we never lose a lead!
        try:
            save_to_local_db(entry.email)
            return {
                "status": "success",
                "storage": "local_sqlite_fallback",
                "message": "Supabase connection failed; lead captured in resilient local SQLite fallback.",
                "error_details": str(e)
            }
        except Exception as sqlite_err:
            raise HTTPException(
                status_code=500,
                detail=f"Both Supabase and local SQLite storage failed. Supabase: {str(e)}. SQLite: {str(sqlite_err)}"
            )

@router.get("/local-leads")
async def get_local_leads():
    """Retrieve all waitlist leads registered locally."""
    try:
        init_local_db()
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, timestamp FROM leads ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        leads = [dict(r) for r in rows]
        conn.close()
        return {"status": "success", "count": len(leads), "leads": leads}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/whitepaper")
async def download_whitepaper():
    return {"status": "success", "url": "/docs/whitepaper.md"}

