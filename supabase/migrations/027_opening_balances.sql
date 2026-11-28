-- 027: Opening balance per account (Personal Life Journal sheet 25)
--   opening_balance      : balance on opening_date, entered by the user
--   opening_date         : the "as of" date; transactions dated before it are already
--                          inside the opening balance and are not counted again
--   opening_recorded_at  : when the opening balance was entered (audit trail, set by the app)

ALTER TABLE financial_accounts
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_date DATE,
  ADD COLUMN IF NOT EXISTS opening_recorded_at TIMESTAMPTZ;
