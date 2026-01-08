-- 001_production_schema_sync.sql -- Purpose: Sync production database with current application 
schema -- Date: 2026-01-07 -- Notes: This migration documents columns already applied manually in 
production -- ========================= -- PROFILES -- ========================= ALTER TABLE 
profiles ADD COLUMN IF NOT EXISTS onboarding_status onboarding_status DEFAULT 'incomplete', ADD 
COLUMN IF NOT EXISTS blocked_at timestamp, ADD COLUMN IF NOT EXISTS failed_payouts_count integer 
DEFAULT 0, ADD COLUMN IF NOT EXISTS last_payout_failure_at timestamp, ADD COLUMN IF NOT EXISTS 
last_payout_failure_reason text; -- ========================= -- CLEANER_JOBS -- 
========================= ALTER TABLE cleaner_jobs ADD COLUMN IF NOT EXISTS locked_at timestamp, ADD 
COLUMN IF NOT EXISTS cancelled_at timestamp; -- ========================= -- BOOKINGS -- 
========================= ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamp; -- 
========================= -- JOB_OFFERS -- ========================= ALTER TABLE job_offers
ADD COLUMN IF NOT EXISTS locked_at timestamp;
