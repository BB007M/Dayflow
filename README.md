# Dayflow HRMS — Supabase Fixed Edition

Dayflow is a React + Express HRMS application with employee management, attendance, leave management, payroll, analytics, audit logs, and Supabase persistence.

## The registration/database fix

The original registration path could return success even when the Supabase `users` insert failed. It also disabled the Supabase client after some errors and allowed server-side fallback to public/anonymous keys.

This version changes registration to a database-first flow:

```text
Registration form
      ↓
Express /api/auth/signup
      ↓
Validate + bcrypt password hash
      ↓
Supabase public.users UPSERT
      ↓
Success → session + UI update
Error   → HTTP error + exact Supabase diagnostics
```

New users are not reported as registered until Supabase confirms the write.

## Requirements

- Node.js 20+
- A Supabase project
- Supabase SQL Editor access

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set:

```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

Optional browser variables:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

**Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or a `VITE_*` variable.**

### 3. Create the Supabase schema

Open **Supabase → SQL Editor** and run:

```text
supabase/schema.sql
```

The Express server uses the service-role key for database operations, so the application does not need permissive public INSERT/UPDATE/DELETE policies on `public.users`.

### 4. Start Dayflow

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verify user registration

1. Open the Dayflow registration/admin employee creation flow.
2. Create a new employee.
3. Watch the terminal.
4. A successful registration prints:

```text
🔄 Writing new employee to Supabase: ...
✅ USER PERSISTED IN SUPABASE: ...
```

5. Open **Supabase → Table Editor → users** and verify the row.

If it fails, the server prints:

```text
❌ SUPABASE USER INSERT FAILED
```

with the Supabase `message`, `code`, `details`, and `hint`.

## Authentication note

Dayflow currently uses its own Express session/authentication layer and stores employee profiles in `public.users`. It does **not** use Supabase Auth's `auth.users` as the primary identity store.

Passwords for newly created users are bcrypt-hashed. Existing bundled demo accounts retain compatibility with their legacy seed passwords.

A future production hardening step would be migrating identity management completely to Supabase Auth and linking `auth.users.id` to employee profiles.

## Security

If a real Supabase service-role key has ever been committed to GitHub or shared publicly, rotate it immediately in Supabase.

Do not commit `.env`.
