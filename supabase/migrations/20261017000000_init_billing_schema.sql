-- Yuan-Billing 数据库初始化：表结构、行级安全（RLS）、头像存储策略
-- 可重复执行：建表使用 if not exists，策略先 drop 再 create
-- 应用方式：Supabase SQL Editor 直接执行，或 `supabase link` 后 `supabase db push`

-- ---------------------------------------------------------------------------
-- 1. 表结构
-- ---------------------------------------------------------------------------

-- 用户资料（与 auth.users 一对一）
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 收支分类（全局共享，不区分用户）
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('expense', 'income')),
  icon text,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 账单
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(10, 2) not null check (amount > 0),
  category_id uuid references public.categories (id) on delete set null,
  bill_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bills_user_date_idx
  on public.bills (user_id, bill_date desc, created_at desc);

create index if not exists bills_category_idx
  on public.bills (category_id);

-- ---------------------------------------------------------------------------
-- 2. 行级安全（RLS）
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.bills enable row level security;

-- 用户只能读写自己的 profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 分类：登录用户只读
drop policy if exists "categories_read_authenticated" on public.categories;
create policy "categories_read_authenticated"
  on public.categories for select
  to authenticated
  using (true);

-- 账单：只能操作自己的记录
drop policy if exists "bills_select_own" on public.bills;
create policy "bills_select_own"
  on public.bills for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "bills_insert_own" on public.bills;
create policy "bills_insert_own"
  on public.bills for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "bills_update_own" on public.bills;
create policy "bills_update_own"
  on public.bills for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "bills_delete_own" on public.bills;
create policy "bills_delete_own"
  on public.bills for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. 注册后自动创建 profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nickname', ''), '用户')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. 头像存储：公开读取，仅本人可写自己的目录
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 5. 分类种子数据（仅在分类表为空时写入）
-- ---------------------------------------------------------------------------

insert into public.categories (name, type, icon, color, sort_order)
select v.name, v.type, v.icon, v.color, v.sort_order
from (values
  ('餐饮', 'expense', 'Food', '#ef4444', 1),
  ('交通', 'expense', 'Van', '#f59e0b', 2),
  ('购物', 'expense', 'ShoppingCart', '#8b5cf6', 3),
  ('娱乐', 'expense', 'VideoPlay', '#ec4899', 4),
  ('学习', 'expense', 'Reading', '#0ea5e9', 5),
  ('住房', 'expense', 'House', '#10b981', 6),
  ('医疗', 'expense', 'FirstAidKit', '#ef4444', 7),
  ('其他支出', 'expense', 'More', '#6b7280', 8),
  ('工资', 'income', 'Money', '#22c55e', 9),
  ('兼职', 'income', 'Coin', '#14b8a6', 10),
  ('生活费', 'income', 'Wallet', '#6366f1', 11),
  ('红包', 'income', 'Present', '#f97316', 12),
  ('其他收入', 'income', 'MoreFilled', '#64748b', 13)
) as v(name, type, icon, color, sort_order)
where not exists (select 1 from public.categories);
