import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    uri = os.getenv("SUPABASE_DB_URI")
    conn = psycopg2.connect(uri)
    cur = conn.cursor()
    
    try:
        print("Running migrations...")
        # 1. Add email to public.users
        cur.execute("ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS email VARCHAR(255);")
        
        # 2. Add email to public.login_otps
        cur.execute("ALTER TABLE IF EXISTS public.login_otps ADD COLUMN IF NOT EXISTS email VARCHAR(255);")
        
        # 3. Add unique constraint to public.users
        cur.execute("""
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_email') THEN
                ALTER TABLE public.users ADD CONSTRAINT unique_email UNIQUE (email);
              END IF;
            END $$;
        """)
        
        conn.commit()
        print("Migrations complete successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
