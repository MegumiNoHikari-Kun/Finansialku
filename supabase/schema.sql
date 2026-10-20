-- Jalankan di Supabase > SQL Editor
create table accounts(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, bank text, number text,
  initial_balance numeric(16,2) not null default 0,
  created_at timestamptz default now());

create table categories(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, type text not null check (type in ('income','expense')),
  created_at timestamptz default now());

create table debts(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('hutang','piutang')), -- hutang: saya berhutang, piutang: orang berhutang ke saya
  person text not null, amount numeric(16,2) not null check (amount>0),
  note text, date date not null default current_date,
  created_at timestamptz default now());

create table transactions(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  account_id uuid not null references accounts on delete cascade,
  category_id uuid references categories on delete set null,
  debt_id uuid references debts on delete cascade,
  type text not null check (type in ('income','expense')),
  kind text not null default 'normal' check (kind in ('normal','debt','payment')),
  amount numeric(16,2) not null check (amount>0),
  note text, date date not null default current_date,
  created_at timestamptz default now());
create index on transactions(user_id, date desc);

-- Row Level Security: tiap user hanya bisa akses datanya sendiri
do $$ declare t text; begin
  foreach t in array array['accounts','categories','debts','transactions'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own_rows" on %I for all using (user_id=auth.uid()) with check (user_id=auth.uid())', t);
  end loop; end $$;

-- Kategori default untuk user baru
create function seed_categories() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into categories(user_id,name,type) values
   (new.id,'Gaji','income'),(new.id,'Bonus','income'),(new.id,'Lainnya','income'),
   (new.id,'Makan & Minum','expense'),(new.id,'Transport','expense'),(new.id,'Tagihan','expense'),(new.id,'Belanja','expense'),(new.id,'Hiburan','expense');
  return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function seed_categories();
