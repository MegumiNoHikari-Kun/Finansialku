-- Jalankan sekali di Supabase > SQL Editor (fitur: tagihan rutin)
create table bills(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  category_id uuid references categories on delete set null,
  amount numeric(16,2) not null check (amount>=0),
  frequency text not null check (frequency in ('weekly','monthly','yearly')),
  start_date date not null,                    -- jatuh tempo pertama; jadwal berikutnya dihitung dari sini
  account_id uuid references accounts on delete set null,  -- rekening pembayaran default
  note text,                                   -- informasi tagihan (penyedia, no. pelanggan, dll)
  active boolean not null default true,
  created_at timestamptz default now());

create table bill_payments(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  bill_id uuid not null references bills on delete cascade,
  due_date date not null,                      -- periode jatuh tempo yang dibayar/dilewati
  paid_date date not null default current_date,
  amount numeric(16,2) not null default 0,
  account_id uuid references accounts on delete set null,
  skipped boolean not null default false,
  created_at timestamptz default now(),
  unique (bill_id, due_date));

-- pembayaran tagihan tercatat sebagai pengeluaran biasa (ikut grafik); terhapus bila pembayaran dihapus
alter table transactions add column bill_payment_id uuid references bill_payments on delete cascade;

do $$ declare t text; begin
  foreach t in array array['bills','bill_payments'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own_rows" on %I for all using (user_id=auth.uid()) with check (user_id=auth.uid())', t);
  end loop; end $$;
