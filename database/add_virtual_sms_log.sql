-- ============================================================
-- MIGRATION: Add Virtual SMS Log Table
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS virtual_sms_log (
    sms_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by phone number
CREATE INDEX IF NOT EXISTS idx_virtual_sms_phone ON virtual_sms_log(phone_number);
CREATE INDEX IF NOT EXISTS idx_virtual_sms_created ON virtual_sms_log(created_at DESC);
