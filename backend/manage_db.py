import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

SUPABASE_DB_URI = os.getenv("SUPABASE_DB_URI")

def get_db_connection():
    if not SUPABASE_DB_URI:
        raise ValueError("Must provide SUPABASE_DB_URI in .env file")
    return psycopg2.connect(SUPABASE_DB_URI, cursor_factory=RealDictCursor)

def test_connection():
    print(f"Testing connection to: {SUPABASE_DB_URI.split('@')[-1]}")
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        print("✅ Connection successful!")
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def clear_users_except_admin():
    if not test_connection():
        return

    print("\n--- WARNING: This will delete ALL user data (transactions, accounts, users) ---")
    print("--- Preserving the 'admins' table ---")
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 1. Delete dependent data first
        print("Deleting transactions...")
        cur.execute("DELETE FROM transactions")
        
        print("Deleting audit logs...")
        cur.execute("DELETE FROM audit_logs")
        
        print("Deleting notifications...")
        cur.execute("DELETE FROM notifications")
        
        print("Deleting accounts...")
        cur.execute("DELETE FROM accounts")
        
        print("Deleting login OTPs...")
        cur.execute("DELETE FROM login_otps")
        
        print("Deleting virtual SMS log...")
        cur.execute("DELETE FROM virtual_sms_log")
        
        # 2. Delete users
        print("Deleting users...")
        cur.execute("DELETE FROM users")
        
        conn.commit()
        print("\n✅ All user data cleared successfully. Admins preserved.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error during deletion: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        clear_users_except_admin()
    else:
        test_connection()
        print("\nRun with '--clear' to delete all user data.")
