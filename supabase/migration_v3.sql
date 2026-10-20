-- Jalankan sekali di Supabase > SQL Editor (fitur: tabungan emas)
create table gold_lots(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  code text not null, brand text,
  buy_date date not null default current_date,
  grams numeric(12,4) not null check (grams>0),
  price_per_gram numeric(16,2) not null check (price_per_gram>0),
  created_at timestamptz default now(),
  unique (user_id, code));

create table gold_sales(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lot_id uuid not null references gold_lots on delete cascade,
  sell_date date not null default current_date,
  grams numeric(12,4) not null check (grams>0),
  price_per_gram numeric(16,2) not null check (price_per_gram>0),
  created_at timestamptz default now());

-- transaksi rekening yang terkait emas (terhapus otomatis bila lot/penjualan dihapus)
alter table transactions drop constraint transactions_kind_check;
alter table transactions add constraint transactions_kind_check check (kind in ('normal','debt','payment','transfer','gold'));
alter table transactions
  add column gold_lot_id uuid references gold_lots on delete cascade,
  add column gold_sale_id uuid references gold_sales on delete cascade;

-- jual tidak boleh melebihi sisa gram lot
create function chk_gold_sale() returns trigger language plpgsql as $$
begin
  if new.grams > (select l.grams - coalesce((select sum(s.grams) from gold_sales s where s.lot_id=l.id and s.id<>new.id),0)
                  from gold_lots l where l.id=new.lot_id) then
    raise exception 'Gram yang dijual melebihi sisa emas';
  end if; return new; end $$;
create trigger gold_sale_chk before insert or update on gold_sales for each row execute function chk_gold_sale();

do $$ declare t text; begin
  foreach t in array array['gold_lots','gold_sales'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own_rows" on %I for all using (user_id=auth.uid()) with check (user_id=auth.uid())', t);
  end loop; end $$;
