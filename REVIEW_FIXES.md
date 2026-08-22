# Dayflow HRMS review

## Fixed in this build

- Leave quotas are now derived from approved Supabase leave requests.
- Paid/Sick/Casual requests are rejected when the requested days exceed the remaining balance.
- Pending requests reserve quota to prevent overbooking.
- Approved leave immediately recalculates the employee's remaining balance.
- Rejected leave does not consume quota.
- Half-day requests force the end date to the start date and submit 0.5 day.
- Invalid date ranges and zero-working-day requests are rejected.
- Invalid legacy leave rows are removed by the SQL hardening script before date constraints are added.
- Check In/Check Out now guard against invalid duplicate actions.
- Active attendance/break state is restored from Supabase after refresh.
- Break start/resume state is persisted in Supabase.
- Payroll batch generation is persisted to Supabase instead of only updating React state.
- Payslip download creates a real CSV file.
- Analytics export creates a real CSV file.
- Analytics no longer fabricates attendance, retention, department counts, or approval-rate defaults.
- Notification "Mark all as read" only updates notifications visible to the current user.
- Employee profile salary fields accept normal keyboard input.
- Employee profile and leave form date fields have safer dark-mode styling.
- Admin/own employee update/insert RLS policies are included.
- TypeScript check passes with the supplied source.

## Supabase setup

Run `supabase_full_fix.sql` in the Supabase SQL editor.

The script is safe to re-run for the policy/column changes, but it intentionally deletes legacy leave rows that have an invalid date range or non-positive duration.

## Validation

`tsc --noEmit` passed after the fixes.

The Vite production build was not executed because the uploaded archive's bundled node_modules were incomplete for a standalone build environment.
