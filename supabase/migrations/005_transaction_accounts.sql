-- Migration to add account column to transactions table for tracking transaction accounts/payment methods
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account TEXT NOT NULL DEFAULT 'Tunai';
