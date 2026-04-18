import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app) # Allow frontend to communicate with backend

SUPABASE_DB_URI = os.getenv("SUPABASE_DB_URI")

def get_db_connection():
    if not SUPABASE_DB_URI:
        raise ValueError("Must provide SUPABASE_DB_URI in .env file")
    conn = psycopg2.connect(SUPABASE_DB_URI, cursor_factory=RealDictCursor)
    conn.autocommit = False # We manage transactions manually when needed
    return conn

# ----------------------------------------------------
# 1. USER AUTHENTICATION & REGISTRATION
# ----------------------------------------------------
@app.route('/api/user/register', methods=['POST'])
def user_register():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Step 1: Insert into USERS
        cursor.execute(
            """INSERT INTO users (full_name, phone_number, pan_number, address) 
               VALUES (%s, %s, %s, %s) RETURNING user_id""",
            (data['full_name'], data['phone_number'], data['pan_number'], data['address'])
        )
        user_id = cursor.fetchone()['user_id']
        
        # Step 2: Insert into ACCOUNTS
        account_number = "ACC" + str(int(time.time()))[:8] # Simple random account number
        cursor.execute(
            """INSERT INTO accounts (user_id, account_number, account_type, transaction_password_hash)
               VALUES (%s, %s, %s, %s)""",
            (user_id, account_number, data['account_type'], data['transaction_password']) # Hash in prod
        )
        conn.commit()
        return jsonify({"success": True, "message": "Account created successfully!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/user/login', methods=['POST'])
def user_login():
    data = request.json
    phone_number = data.get('phone_number')
    otp = data.get('otp')
    
    # In a real-world app, verify OTP via SMS (Twilio/Supabase Auth). Mocking here:
    if otp != "1234":
        return jsonify({"success": False, "error": "Invalid OTP (Use 1234)"}), 401
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT user_id, full_name FROM users WHERE phone_number = %s", (phone_number,))
        user = cursor.fetchone()
        if user:
            return jsonify({"success": True, "user_id": user['user_id'], "message": "Login successful!"})
        else:
            return jsonify({"success": False, "error": "User not found"}), 404
    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------
# 2. USER DASHBOARD & TRANSFERS
# ----------------------------------------------------
@app.route('/api/user/dashboard', methods=['GET'])
def user_dashboard():
    user_id = request.args.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Utilize the View created in the database schema
        cursor.execute("SELECT * FROM vw_user_summary WHERE user_id = %s", (user_id,))
        account = cursor.fetchone()
        
        if not account:
            return jsonify({"success": False, "error": "Account not found"}), 404
            
        # Fetch recent transactions
        cursor.execute(
            """SELECT t.*, a_recv.account_number as recv_acc, u_recv.full_name as recv_name
               FROM transactions t
               LEFT JOIN accounts a_recv ON t.receiver_account_id = a_recv.account_id
               LEFT JOIN users u_recv ON a_recv.user_id = u_recv.user_id
               WHERE t.sender_account_id = %s OR t.receiver_account_id = %s
               ORDER BY t.created_at DESC LIMIT 10""",
            (account['account_id'], account['account_id'])
        )
        transactions = cursor.fetchall()
        
        return jsonify({"success": True, "account": account, "transactions": transactions})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/user/transfer', methods=['POST'])
def user_transfer():
    data = request.json
    sender_user_id = data.get('user_id')
    receiver_phone = data.get('receiver_phone')
    amount = data.get('amount')
    tx_password = data.get('transaction_password')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Authenticate Request via tx_password
        cursor.execute("SELECT account_id, transaction_password_hash FROM vw_user_summary JOIN accounts ON vw_user_summary.account_id = accounts.account_id WHERE vw_user_summary.user_id = %s", (sender_user_id,))
        acc = cursor.fetchone()
        if not acc or acc['transaction_password_hash'] != tx_password:
             return jsonify({"success": False, "error": "Invalid transaction password!"}), 401
             
        # 2. CALL Stored Procedure from our DB to handle ACID transfer
        cursor.execute("CALL sp_transfer_funds(%s, %s, %s)", (acc['account_id'], receiver_phone, amount))
        conn.commit()
        return jsonify({"success": True, "message": f"Successfully transferred ₹{amount} to {receiver_phone}."})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------
# 3. ADMIN PORTAL
# ----------------------------------------------------
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT admin_id FROM admins WHERE username=%s AND password_hash=%s", 
                       (data['username'], data['password']))
        admin = cursor.fetchone()
        if admin:
            return jsonify({"success": True, "message": "Admin logged in!"})
        return jsonify({"success": False, "error": "Invalid Admin credentials"}), 401
    finally:
        cursor.close()
        conn.close()
        
@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Utilize Admin View
        cursor.execute("SELECT * FROM vw_admin_dashboard ORDER BY suspicious_tx_count DESC")
        users = cursor.fetchall()
        
        # Fetch highly suspicious transactions
        cursor.execute(
            """SELECT t.amount, t.created_at, u.full_name, a.account_number 
               FROM transactions t
               JOIN accounts a ON t.sender_account_id = a.account_id
               JOIN users u ON a.user_id = u.user_id
               WHERE t.is_suspicious = true
               ORDER BY t.created_at DESC"""
        )
        suspicious_tx = cursor.fetchall()
        
        return jsonify({"success": True, "users": users, "suspicious_transactions": suspicious_tx})
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
