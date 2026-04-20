import psycopg2
import os
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def check_schema():
    uri = os.getenv("SUPABASE_DB_URI")
    conn = psycopg2.connect(uri, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    # We want to check our specifically used tables in the public schema
    tables = ['users', 'accounts', 'transactions', 'login_otps']
    
    for table in tables:
        print(f"\n--- Table: public.{table} ---")
        cur.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table}' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        cols = cur.fetchall()
        if not cols:
            print("Table not found in 'public' schema.")
        for col in cols:
            print(f"{col['column_name']}: {col['data_type']}")
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_schema()
