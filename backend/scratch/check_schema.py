import psycopg2
import os
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    uri = os.getenv("SUPABASE_DB_URI")
    return psycopg2.connect(uri, cursor_factory=RealDictCursor)

def check_schema():
    conn = get_db_connection()
    cur = conn.cursor()
    
    tables = ['users', 'accounts', 'transactions', 'login_otps', 'virtual_sms_log']
    
    for table in tables:
        print(f"\n--- Table: {table} ---")
        cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
        cols = cur.fetchall()
        for col in cols:
            print(f"{col['column_name']}: {col['data_type']}")
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_schema()
