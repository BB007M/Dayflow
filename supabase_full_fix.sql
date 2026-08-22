-- Dayflow HRMS - Supabase operational hardening
-- Run this once in Supabase SQL Editor.
-- This script is designed to be safe to re-run.

begin;

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================

alter table public.leave_requests
  add column if not exists is_half_day boolean not null default false;

-- Remove invalid legacy rows before adding constraints.
delete from public.leave_requests
where end_date < start_date
   or total_days <= 0;

drop constraint if exists leave_requests_valid_date_range
  on public.leave_requests;

alter table public.leave_requests
  add constraint leave_requests_valid_date_range
  check (end_date >= start_date);

drop constraint if exists leave_requests_positive_days
  on public.leave_requests;

alter table public.leave_requests
  add constraint leave_requests_positive_days
  check (total_days > 0);

-- ============================================================
-- ATTENDANCE
-- ============================================================

alter table public.attendance
  add column if not exists is_on_break boolean not null default false,
  add column if not exists break_started_at timestamptz;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

alter table public.notifications
  add column if not exists target_role text,
  add column if not exists link_tab text;

-- ============================================================
-- ADMIN HELPER
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employees
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- ============================================================
-- EMPLOYEES RLS
-- ============================================================

drop policy if exists "employees_select_own" on public.employees;
drop policy if exists "employees_admin_select_all" on public.employees;
drop policy if exists "employees_admin_insert" on public.employees;
drop policy if exists "employees_admin_update" on public.employees;
drop policy if exists "employees_update_own" on public.employees;

create policy "employees_select_own"
on public.employees
for select to authenticated
using (auth_user_id = auth.uid());

create policy "employees_admin_select_all"
on public.employees
for select to authenticated
using (public.is_admin());

create policy "employees_admin_insert"
on public.employees
for insert to authenticated
with check (public.is_admin());

create policy "employees_admin_update"
on public.employees
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "employees_update_own"
on public.employees
for update to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

-- ============================================================
-- ATTENDANCE RLS
-- ============================================================

drop policy if exists "attendance_select" on public.attendance;
drop policy if exists "attendance_insert" on public.attendance;
drop policy if exists "attendance_update" on public.attendance;

create policy "attendance_select"
on public.attendance
for select to authenticated
using (
  public.is_admin()
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
);

create policy "attendance_insert"
on public.attendance
for insert to authenticated
with check (
  public.is_admin()
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
);

create policy "attendance_update"
on public.attendance
for update to authenticated
using (
  public.is_admin()
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
);

-- ============================================================
-- LEAVE REQUESTS RLS
-- ============================================================

drop policy if exists "leave_select" on public.leave_requests;
drop policy if exists "leave_insert" on public.leave_requests;
drop policy if exists "leave_update_admin" on public.leave_requests;

create policy "leave_select"
on public.leave_requests
for select to authenticated
using (
  public.is_admin()
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
);

create policy "leave_insert"
on public.leave_requests
for insert to authenticated
with check (
  employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
);

create policy "leave_update_admin"
on public.leave_requests
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- PAYSLIPS RLS
-- ============================================================

drop policy if exists "payslips_select" on public.payslips;
drop policy if exists "payslips_insert_admin" on public.payslips;
drop policy if exists "payslips_update_admin" on public.payslips;

create policy "payslips_select"
on public.payslips
for select to authenticated
using (
  public.is_admin()
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
);

create policy "payslips_insert_admin"
on public.payslips
for insert to authenticated
with check (public.is_admin());

create policy "payslips_update_admin"
on public.payslips
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- NOTIFICATIONS RLS
-- ============================================================

drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "notifications_insert" on public.notifications;
drop policy if exists "notifications_update" on public.notifications;

create policy "notifications_select"
on public.notifications
for select to authenticated
using (
  public.is_admin()
  or target_role = 'all'
  or (
    target_role = 'employee'
    and employee_id = (
      select id from public.employees
      where auth_user_id = auth.uid()
    )
  )
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
);

create policy "notifications_insert"
on public.notifications
for insert to authenticated
with check (
  public.is_admin()
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
  or target_role = 'admin'
);

create policy "notifications_update"
on public.notifications
for update to authenticated
using (
  public.is_admin()
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or employee_id = (
    select id from public.employees
    where auth_user_id = auth.uid()
  )
);

commit;
