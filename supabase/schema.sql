-- Chạy một lần trong Supabase > SQL Editor.
-- Mỗi người dùng chỉ có quyền xem/sửa/xóa công việc của mình (RLS).
create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '',
  start_date date not null,
  due_date date not null,
  start_time time null,
  due_time time null,
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  status text not null default 'todo' check (status in ('todo','doing','done')),
  focus_date date null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dates_valid check (due_date >= start_date),
  constraint times_valid check (due_date <> start_date or start_time is null or due_time is null or due_time >= start_time)
);

create index if not exists tasks_user_due_date_idx on public.tasks (user_id, due_date);
create index if not exists tasks_user_focus_date_idx on public.tasks (user_id, focus_date);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
revoke all on public.tasks from anon;

alter table public.tasks enable row level security;

-- Xóa policy cũ khi chạy lại SQL để đảm bảo idempotent.
drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "tasks_update_own" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tasks_delete_own" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.set_tasks_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks
for each row execute procedure public.set_tasks_updated_at();

-- Không tạo policy công khai/anon. Chỉ phiên đăng nhập mới thao tác được.
