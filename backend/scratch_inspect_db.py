import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

SUPABASE_DB_URI = os.getenv("SUPABASE_DB_URI")

def inspect_db():
    try:
        print(f"Connecting to: {SUPABASE_DB_URI}")
        conn = psycopg2.connect(SUPABASE_DB_URI, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("\n--- Users ---")
        cursor.execute("SELECT user_id, full_name, email, phone_number FROM users")
        users = cursor.fetchall()
        for u in users:
            print(u)
            
        print("\n--- Admins ---")
        cursor.execute("SELECT admin_id, username FROM admins")
        admins = cursor.fetchall()
        for a in admins:
            print(a)
            
        print("\n--- Tables ---")
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = cursor.fetchall()
        for t in tables:
            print(t['table_name'])
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_db()
