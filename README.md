# CleanStayHQ

CleanStayHQ is a production-grade property cleaning management platform built to support hosts, cleaners, and administrators with a secure, auditable workflow.

## Core Features
- Host property management (manual bookings + iCal sync)
- Cleaner application and approval workflow
- Role-based access control (host / cleaner / admin)
- Cleaner onboarding lifecycle
- Job assignment and status tracking
- Payout-safe architecture (failure tracking, locking, audit logs)

## Architecture Overview
- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL (Supabase)
- ORM: Drizzle
- Auth: Supabase Auth
- Email: Transactional notifications (approval / rejection)

## Data Integrity Principles
- All critical state transitions are atomic
- Admin approvals run in single database transactions
- No partial writes on failure
- Schema changes are migration-driven

## Status
This repository represents the **stable production baseline**.
All active development happens on the `dev` branch.

## Author
Built and maintained by Dag (CleanStayHQ)
