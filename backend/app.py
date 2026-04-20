import os
import time
import random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
CORS(app)  # Allow frontend to communicate with backend

SUPABASE_DB_URI = os.getenv("SUPABASE_DB_URI")

if not SUPABASE_DB_URI:
    print("\n" + "="*50)
    print("WARNING: SUPABASE_DB_URI not found in .env file!")
    print("Please rename .env.example to .env and add your URI.")
    print("="*50 + "\n")

def get_db_connection():
    if not SUPABASE_DB_URI:
        raise ValueError("Must provide SUPABASE_DB_URI in .env file")
    conn = psycopg2.connect(SUPABASE_DB_URI, cursor_factory=RealDictCursor)
    conn.autocommit = False
    return conn

# ----------------------------------------------------
# VIRTUAL SMS SYSTEM (Replaces Twilio)
# All "SMS" messages are stored in the database.
# The frontend polls /api/sms/latest to read them.
# ----------------------------------------------------
def send_sms(to_number, message, cursor=None):
    """
    Logs a message to the virtual_sms_log table instead of sending a real SMS.
    If a cursor is passed (inside a transaction), use it. Otherwise open a new connection.
    """
    print(f"\n[VIRTUAL SMS to {to_number}]:\n{message}\n")

    own_conn = False
    if cursor is None:
        conn = get_db_connection()
        cursor = conn.cursor()
        own_conn = True

    try:
        cursor.execute(
            "INSERT INTO virtual_sms_log (phone_number, message) VALUES (%s, %s)",
            (to_number, message)
        )
        if own_conn:
            conn.commit()
    except Exception as e:
        print(f"[Virtual SMS Error]: {e}")
        if own_conn:
            conn.rollback()
    finally:
        if own_conn:
            cursor.close()
            conn.close()

# ----------------------------------------------------
# EMAIL NOTIFICATION SYSTEM (Replacement for SMS)
# ----------------------------------------------------
def send_email(to_email, subject, body):
    """
    Sends a real email using SMTP. 
    If SMTP credentials are missing, it falls back to logging the email to console.
    """
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT", 587)
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("MAIL_SENDER", smtp_user)

    print(f"\n[EMAIL to {to_email}] Subject: {subject}\n{body}\n")

    if not all([smtp_server, smtp_user, smtp_pass]):
        print("[EMAIL] Skipping real email send: Credentials not found in .env")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = f"Indian Bank <{sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"[EMAIL] Successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL Error]: {e}")
        return False

@app.route('/api/sms/latest', methods=['GET'])
def get_latest_sms():
    """
    Returns the most recent Virtual SMS for a given phone number.
    Used by the login page to display the OTP automatically.
    """
    phone = request.args.get('phone')
    if not phone:
        return jsonify({"success": False, "error": "phone parameter is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT message, created_at FROM virtual_sms_log 
               WHERE phone_number = %s 
               ORDER BY created_at DESC LIMIT 1""",
            (phone,)
        )
        sms = cursor.fetchone()
        if sms:
            return jsonify({"success": True, "message": sms['message'], "created_at": str(sms['created_at'])})
        return jsonify({"success": False, "error": "No messages found"})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/sms/inbox', methods=['GET'])
def get_sms_inbox():
    """
    Returns all Virtual SMS messages for a given phone number (inbox view).
    """
    phone = request.args.get('phone')
    if not phone:
        return jsonify({"success": False, "error": "phone parameter is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT sms_id, message, created_at FROM virtual_sms_log 
               WHERE phone_number = %s 
               ORDER BY created_at DESC LIMIT 20""",
            (phone,)
        )
        messages = cursor.fetchall()
        return jsonify({"success": True, "messages": messages})
    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------
# UTILITIES
# ----------------------------------------------------
def generate_ref_no():
    return ''.join([str(random.randint(0, 9)) for _ in range(12)])

def normalize_phone(phone):
    if not phone: return ""
    digits = ''.join(filter(str.isdigit, str(phone)))
    return digits[-10:] if len(digits) >= 10 else digits

def add_notification(cursor, user_id, title, content):
    if not user_id: return
    cursor.execute(
        "INSERT INTO notifications (user_id, title, content) VALUES (%s, %s, %s)",
        (user_id, title, content)
    )

# ----------------------------------------------------
# 1. USER AUTHENTICATION & REGISTRATION
# ----------------------------------------------------
@app.route('/api/user/register', methods=['POST'])
def user_register():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO users (full_name, phone_number, email, pan_number, address) 
               VALUES (%s, %s, %s, %s, %s) RETURNING user_id""",
            (data['full_name'], data['phone_number'], data['email'], data['pan_number'], data['address'])
        )
        user_id = cursor.fetchone()['user_id']

        account_number = "ACC" + str(int(time.time()))[:8]
        cursor.execute(
            """INSERT INTO accounts (user_id, account_number, account_type, transaction_password_hash)
               VALUES (%s, %s, %s, %s)""",
            (user_id, account_number, data['account_type'], data['transaction_password'])
        )
        conn.commit()

        # Send Welcome Email
        welcome_msg = f"Dear {data['full_name']},\n\nWelcome to Indian Bank. Your digital account {account_number} has been successfully created.\n\nThank you for choosing us."
        send_email(data['email'], "Account Created - Indian Bank", welcome_msg)

        return jsonify({"success": True, "message": "Account created successfully!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/user/request-otp', methods=['POST'])
def request_otp():
    data = request.json
    phone = data.get('phone_number')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT user_id, email FROM users WHERE phone_number = %s AND email = %s", (phone, data.get('email')))
        user = cursor.fetchone()
        if not user:
            return jsonify({"success": False, "error": "User with these details not found"}), 404

        user_email = user['email']
        otp = str(random.randint(1000, 9999))
        expiry = datetime.now() + timedelta(minutes=10)

        cursor.execute(
            "INSERT INTO login_otps (phone_number, email, otp_code, expiry_at) VALUES (%s, %s, %s, %s)",
            (phone, user_email, otp, expiry)
        )
        conn.commit()

        # Send via Email system
        msg = f"[Indian Bank] Your Secure Login OTP is: {otp}. Valid for 10 minutes. Do not share this OTP with anyone."
        send_email(user_email, "Login Verification OTP", msg)

        return jsonify({"success": True, "message": "OTP sent to your registered email!"})
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

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT * FROM login_otps 
               WHERE phone_number = %s AND email = %s AND otp_code = %s AND is_verified = FALSE AND expiry_at > %s
               ORDER BY created_at DESC LIMIT 1""",
            (phone_number, data.get('email'), otp, datetime.now())
        )
        otp_record = cursor.fetchone()

        if not otp_record:
            return jsonify({"success": False, "error": "Invalid or expired OTP"}), 401

        cursor.execute("UPDATE login_otps SET is_verified = TRUE WHERE otp_id = %s", (otp_record['otp_id'],))

        cursor.execute("SELECT user_id, full_name FROM users WHERE phone_number = %s", (phone_number,))
        user = cursor.fetchone()
        conn.commit()

        if user:
            return jsonify({"success": True, "user_id": user['user_id'], "full_name": user['full_name'], "message": "Login successful!"})
        else:
            return jsonify({"success": False, "error": "User details not found"}), 404
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
        cursor.execute("SELECT * FROM vw_user_summary WHERE user_id = %s", (user_id,))
        account = cursor.fetchone()

        if not account:
            return jsonify({"success": False, "error": "Account not found"}), 404

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

# ----------------------------------------------------
# 3. NOTIFICATIONS (Vault Inbox)
# ----------------------------------------------------
@app.route('/api/user/notifications', methods=['GET'])
def get_notifications():
    user_id = request.args.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,)
        )
        notifications = cursor.fetchall()
        return jsonify({"success": True, "notifications": notifications})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/user/notifications/read', methods=['POST'])
def mark_notifications_read():
    user_id = request.json.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE notifications SET is_read = TRUE WHERE user_id = %s", (user_id,))
        conn.commit()
        return jsonify({"success": True})
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
        cursor.execute("""
            SELECT a.account_id, a.account_number, u.full_name, u.phone_number, a.balance, a.transaction_password_hash 
            FROM users u
            JOIN accounts a ON u.user_id = a.user_id 
            WHERE u.user_id = %s
        """, (sender_user_id,))
        sender_acc = cursor.fetchone()

        if not sender_acc or sender_acc['transaction_password_hash'] != tx_password:
            return jsonify({"success": False, "error": "Invalid transaction password!"}), 401

        # CALL stored procedure (ACID transfer)
        cursor.execute("CALL sp_transfer_funds(%s, %s, %s)", (sender_acc['account_id'], receiver_phone, amount))

        # Get Receiver Details
        norm_recv_phone = normalize_phone(receiver_phone)
        cursor.execute(
            """SELECT user_id, full_name, email, balance, phone_number FROM vw_user_summary 
               WHERE RIGHT(regexp_replace(phone_number, '[^0-9]', '', 'g'), 10) = %s""",
            (norm_recv_phone,)
        )
        recv_acc = cursor.fetchone()

        ref_no = generate_ref_no()
        timestamp = datetime.now().strftime('%Y-%m-%d %I:%M:%S %p')

        # Sender Debit Notification
        sender_msg = (
            f"Dear {sender_acc['full_name']},\n\n"
            f"Rs.{float(amount):.2f} has been debited from your A/C XXXXXX{sender_acc['account_number'][-4:]} "
            f"and transferred to {receiver_phone}. Ref:{ref_no}. "
            f"Avl Bal: Rs {(float(sender_acc['balance']) - float(amount)):.2f}.\n\n"
            f"If this was not you, please contact support immediately."
        )
        add_notification(cursor, sender_user_id, "Debit Alert", sender_msg)
        
        # Get sender email
        cursor.execute("SELECT email FROM users WHERE user_id = %s", (sender_user_id,))
        sender_user = cursor.fetchone()
        if sender_user and sender_user['email']:
            send_email(sender_user['email'], "Transaction Alert: Debit", sender_msg)

        # Receiver Credit Notification
        if recv_acc:
            recv_msg = (
                f"Dear {recv_acc['full_name']},\n\n"
                f"Your account has been credited with Rs.{float(amount):.2f} "
                f"on {timestamp}. Ref No: {ref_no}.\n\n"
                f"Available Balance: Rs {float(recv_acc['balance']):.2f}"
            )
            add_notification(cursor, recv_acc['user_id'], "Credit Alert", recv_msg)
            if recv_acc['email']:
                send_email(recv_acc['email'], "Transaction Alert: Credit", recv_msg)

        conn.commit()
        return jsonify({"success": True, "message": f"Successfully transferred ₹{amount} to {receiver_phone}. Ref: {ref_no}"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------
# 4. ADMIN PORTAL
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
        cursor.execute("SELECT * FROM vw_admin_dashboard ORDER BY suspicious_tx_count DESC")
        users = cursor.fetchall()

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
