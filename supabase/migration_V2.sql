-- Jalankan sekali di Supabase > SQL Editor (fitur: transfer + budget)
alter table transactions drop constraint transactions_kind_check;
alter table transactions add constraint transactions_kind_check check (kind in ('normal','debt','payment','transfer'));
alter table transactions add column group_id uuid;

create table budgets(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  category_id uuid not null unique references categories on delete cascade,
  amount numeric(16,2) not null check (amount>0),
  created_at timestamptz default now());
alter table budgets enable row level security;
create policy "own_rows" on budgets for all using (user_id=auth.uid()) with check (user_id=auth.uid());
