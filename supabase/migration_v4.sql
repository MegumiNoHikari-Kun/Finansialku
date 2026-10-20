-- Jalankan sekali di Supabase > SQL Editor (fitur: piutang emas / pinjamkan emas)
create table gold_loans(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lot_id uuid not null references gold_lots on delete cascade,
  person text not null,
  grams numeric(12,4) not null check (grams>0),
  loan_date date not null default current_date,
  note text,
  created_at timestamptz default now());

create table gold_loan_returns(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  loan_id uuid not null references gold_loans on delete cascade,
  return_date date not null default current_date,
  grams numeric(12,4) not null check (grams>0),
  note text,
  created_at timestamptz default now());

do $$ declare t text; begin
  foreach t in array array['gold_loans','gold_loan_returns'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own_rows" on %I for all using (user_id=auth.uid()) with check (user_id=auth.uid())', t);
  end loop; end $$;

-- penjualan: sisa = gram lot - terjual - sedang dipinjamkan
create or replace function chk_gold_sale() returns trigger language plpgsql as $$
declare avail numeric;
begin
  select l.grams
    - coalesce((select sum(s.grams) from gold_sales s where s.lot_id=l.id and s.id<>new.id),0)
    - coalesce((select sum(ln.grams) from gold_loans ln where ln.lot_id=l.id),0)
    + coalesce((select sum(r.grams) from gold_loan_returns r join gold_loans ln on ln.id=r.loan_id where ln.lot_id=l.id),0)
  into avail from gold_lots l where l.id=new.lot_id;
  if new.grams > avail then raise exception 'Gram yang dijual melebihi sisa emas'; end if;
  return new; end $$;

-- pinjaman tidak boleh melebihi sisa emas
create function chk_gold_loan() returns trigger language plpgsql as $$
declare avail numeric; rets numeric;
begin
  select l.grams
    - coalesce((select sum(s.grams) from gold_sales s where s.lot_id=l.id),0)
    - coalesce((select sum(ln.grams) from gold_loans ln where ln.lot_id=l.id and ln.id<>new.id),0)
    + coalesce((select sum(r.grams) from gold_loan_returns r join gold_loans ln on ln.id=r.loan_id where ln.lot_id=l.id and ln.id<>new.id),0)
  into avail from gold_lots l where l.id=new.lot_id;
  select coalesce(sum(grams),0) into rets from gold_loan_returns where loan_id=new.id;
  if new.grams < rets then raise exception 'Berat pinjaman kurang dari yang sudah dikembalikan'; end if;
  if new.grams - rets > avail then raise exception 'Gram yang dipinjamkan melebihi sisa emas'; end if;
  return new; end $$;
create trigger gold_loan_chk before insert or update on gold_loans for each row execute function chk_gold_loan();

-- pengembalian tidak boleh melebihi pinjaman
create function chk_gold_return() returns trigger language plpgsql as $$
begin
  if new.grams + coalesce((select sum(grams) from gold_loan_returns where loan_id=new.loan_id and id<>new.id),0)
     > (select grams from gold_loans where id=new.loan_id) then
    raise exception 'Pengembalian melebihi jumlah pinjaman'; end if;
  return new; end $$;
create trigger gold_return_chk before insert or update on gold_loan_returns for each row execute function chk_gold_return();
