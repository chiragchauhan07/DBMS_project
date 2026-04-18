-- DBMS Bank Management System - Supabase / PostgreSQL Schema
-- Run this script in the Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------
-- 1. TABLES & CONSTRAINTS (3NF Normalization)
----------------------------------------------------

CREATE TABLE admins (
    admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    pan_number VARCHAR(10) UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(20) CHECK (account_type IN ('Savings', 'Current')),
    balance DECIMAL(15, 2) DEFAULT 0.0 CHECK (balance >= 0),
    transaction_password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_account_id UUID REFERENCES accounts(account_id),
    receiver_account_id UUID REFERENCES accounts(account_id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('Deposit', 'Withdrawal', 'Transfer')),
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID,
    log_details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------
-- 2. INDEXING FOR PERFORMANCE
----------------------------------------------------

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_transactions_sender ON transactions(sender_account_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

----------------------------------------------------
-- 3. VIEWS
----------------------------------------------------

-- Admin Dashboard View: Aggregates user details, their total balance, and recent suspicious activity count
CREATE OR REPLACE VIEW vw_admin_dashboard AS
SELECT 
    u.user_id,
    u.full_name,
    u.phone_number,
    u.pan_number,
    a.account_number,
    a.account_type,
    a.balance,
    (SELECT COUNT(*) FROM transactions t WHERE t.sender_account_id = a.account_id AND t.is_suspicious = true) AS suspicious_tx_count
FROM users u
LEFT JOIN accounts a ON u.user_id = a.user_id;

-- User Summary View
CREATE OR REPLACE VIEW vw_user_summary AS
SELECT
    u.user_id,
    u.phone_number,
    u.full_name,
    a.account_id,
    a.account_number,
    a.account_type,
    a.balance
FROM users u
JOIN accounts a ON u.user_id = a.user_id;

----------------------------------------------------
-- 4. TRIGGERS & FUNCTIONS
----------------------------------------------------

-- Trigger 1: Detect Suspicious Transactions
-- Condition: Transaction amount > 2x average of previous transfers by this account
CREATE OR REPLACE FUNCTION check_suspicious_transaction()
RETURNS TRIGGER AS $$
DECLARE
    avg_transfer DECIMAL(15, 2);
BEGIN
    SELECT COALESCE(AVG(amount), 0) INTO avg_transfer
    FROM transactions
    WHERE sender_account_id = NEW.sender_account_id AND transaction_type = 'Transfer';
    
    IF avg_transfer > 0 AND NEW.amount > (2 * avg_transfer) THEN
        NEW.is_suspicious := TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_suspicious
BEFORE INSERT ON transactions
FOR EACH ROW
WHEN (NEW.transaction_type = 'Transfer')
EXECUTE FUNCTION check_suspicious_transaction();

-- Trigger 2: Automatic Audit Logging
CREATE OR REPLACE FUNCTION log_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (transaction_id, log_details)
    VALUES (NEW.transaction_id, 'Action: ' || NEW.transaction_type || ' | Amount: ' || NEW.amount);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION log_transaction();

----------------------------------------------------
-- 5. STORED PROCEDURES / TRANSACTIONS
----------------------------------------------------

-- Stored Procedure to perform secure fund transfer
-- Features ACID properties. In PostgreSQL, errors in PL/pgSQL automatically abort the transaction (ROLLBACK).
CREATE OR REPLACE PROCEDURE sp_transfer_funds(
    p_sender_account_id UUID,
    p_receiver_phone VARCHAR,
    p_amount DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_receiver_account_id UUID;
    v_current_balance DECIMAL;
BEGIN
    -- 1. Find the receiver's account via their phone number
    SELECT a.account_id INTO v_receiver_account_id
    FROM accounts a
    JOIN users u ON a.user_id = u.user_id
    WHERE u.phone_number = p_receiver_phone;
    
    IF v_receiver_account_id IS NULL THEN
        RAISE EXCEPTION 'Receiver account not found for phone %', p_receiver_phone;
    END IF;

    IF v_receiver_account_id = p_sender_account_id THEN
        RAISE EXCEPTION 'Cannot transfer to identical account';
    END IF;
    
    -- 2. Lock the sender's row and check balance (Concurrency Control)
    SELECT balance INTO v_current_balance
    FROM accounts 
    WHERE account_id = p_sender_account_id FOR UPDATE;
    
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Current balance: %', v_current_balance;
    END IF;
    
    -- 3. Deduct from sender
    UPDATE accounts SET balance = balance - p_amount WHERE account_id = p_sender_account_id;
    
    -- 4. Add to receiver
    UPDATE accounts SET balance = balance + p_amount WHERE account_id = v_receiver_account_id;
    
    -- 5. Insert transaction record (Triggers will automatically log and check for suspicious activity)
    INSERT INTO transactions (sender_account_id, receiver_account_id, amount, transaction_type)
    VALUES (p_sender_account_id, v_receiver_account_id, p_amount, 'Transfer');
    
    -- PostgreSQL will automatically COMMIT here if no exception was raised.
    -- If any exception happens above, the whole block is automatically Rolled Back.
END;
$$;

-- Note: To seed standard data immediately on schema creation
INSERT INTO admins (username, password_hash) VALUES ('admin', 'admin123'); -- In production use secure hashes
