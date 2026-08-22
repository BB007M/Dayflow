# Dayflow HRMS — Fixed Supabase Version

## What was fixed

- New employee registration is now **database-first**. The API returns an error if Supabase cannot persist the employee.
- Supabase errors now expose `message`, `code`, `details`, and `hint` in the server console and API response.
- The server no longer falls back to an anonymous/public Supabase key. It requires `SUPABASE_SERVICE_ROLE_KEY`.
- New passwords are bcrypt-hashed before being stored in `public.users.password_hash`.
- Legacy bundled demo accounts remain compatible with their existing plaintext seed passwords.
- Frontend Supabase code can only use the public anon key; the service-role key is never read by Vite code.
- The database schema is provided separately in `supabase/schema.sql`.
- Re-running the schema is safer because storage read policies are recreated idempotently.
- Public database write policies are not required; the Express server performs database operations with the service-role key.

## Setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env`.
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
5. Optionally set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for browser-side Supabase features.
6. Run `npm install`.
7. Run `npm run dev`.
8. Open `http://localhost:3000`.
9. Create a new employee and verify it in **Supabase → Table Editor → users**.

## Important security note

Never commit a real Supabase service-role key. If a service-role key has already been committed or shared, rotate it in Supabase before using this version.

## Registration troubleshooting

When registration fails, the server now prints:

- `❌ SUPABASE USER INSERT FAILED`
- Message
- Code
- Details
- Hint

The browser also receives the database error so the UI no longer claims an account was stored when the database rejected it.
