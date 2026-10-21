-- Jalankan sekali di Supabase > SQL Editor (fitur: hutang emas / pinjam emas)
create table gold_borrows(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lot_id uuid not null unique references gold_lots on delete cascade, -- stok baru dari emas pinjaman
  person text not null,
  grams numeric(12,4) not null check (grams>0),
  borrow_date date not null default current_date,
  note text,
  created_at timestamptz default now());

create table gold_borrow_returns(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  borrow_id uuid not null references gold_borrows on delete cascade,
  from_lot_id uuid not null references gold_lots on delete cascade, -- emas dari stok yang diserahkan
  return_date date not null default current_date,
  grams numeric(12,4) not null check (grams>0),
  note text,
  created_at timestamptz default now());

do $$ declare t text; begin
  foreach t in array array['gold_borrows','gold_borrow_returns'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own_rows" on %I for all using (user_id=auth.uid()) with check (user_id=auth.uid())', t);
  end loop; end $$;

-- sisa lot = gram - terjual - sedang dipinjamkan - diserahkan untuk bayar hutang emas
create or replace function chk_gold_sale() returns trigger language plpgsql as $$
declare avail numeric;
begin
  select l.grams
    - coalesce((select sum(s.grams) from gold_sales s where s.lot_id=l.id and s.id<>new.id),0)
    - coalesce((select sum(ln.grams) from gold_loans ln where ln.lot_id=l.id),0)
    + coalesce((select sum(r.grams) from gold_loan_returns r join gold_loans ln on ln.id=r.loan_id where ln.lot_id=l.id),0)
    - coalesce((select sum(br.grams) from gold_borrow_returns br where br.from_lot_id=l.id),0)
  into avail from gold_lots l where l.id=new.lot_id;
  if new.grams > avail then raise exception 'Gram yang dijual melebihi sisa emas'; end if;
  return new; end $$;

create or replace function chk_gold_loan() returns trigger language plpgsql as $$
declare avail numeric; rets numeric;
begin
  select l.grams
    - coalesce((select sum(s.grams) from gold_sales s where s.lot_id=l.id),0)
    - coalesce((select sum(ln.grams) from gold_loans ln where ln.lot_id=l.id and ln.id<>new.id),0)
    + coalesce((select sum(r.grams) from gold_loan_returns r join gold_loans ln on ln.id=r.loan_id where ln.lot_id=l.id and ln.id<>new.id),0)
    - coalesce((select sum(br.grams) from gold_borrow_returns br where br.from_lot_id=l.id),0)
  into avail from gold_lots l where l.id=new.lot_id;
  select coalesce(sum(grams),0) into rets from gold_loan_returns where loan_id=new.id;
  if new.grams < rets then raise exception 'Berat pinjaman kurang dari yang sudah dikembalikan'; end if;
  if new.grams - rets > avail then raise exception 'Gram yang dipinjamkan melebihi sisa emas'; end if;
  return new; end $$;

create function chk_gold_borrow_return() returns trigger language plpgsql as $$
declare avail numeric;
begin
  if new.grams + coalesce((select sum(grams) from gold_borrow_returns where borrow_id=new.borrow_id and id<>new.id),0)
     > (select grams from gold_borrows where id=new.borrow_id) then
    raise exception 'Pengembalian melebihi jumlah hutang emas'; end if;
  select l.grams
    - coalesce((select sum(s.grams) from gold_sales s where s.lot_id=l.id),0)
    - coalesce((select sum(ln.grams) from gold_loans ln where ln.lot_id=l.id),0)
    + coalesce((select sum(r.grams) from gold_loan_returns r join gold_loans ln on ln.id=r.loan_id where ln.lot_id=l.id),0)
    - coalesce((select sum(br.grams) from gold_borrow_returns br where br.from_lot_id=l.id and br.id<>new.id),0)
  into avail from gold_lots l where l.id=new.from_lot_id;
  if new.grams > avail then raise exception 'Gram dikembalikan melebihi sisa emas pada lot tersebut'; end if;
  return new; end $$;
create trigger gold_borrow_return_chk before insert or update on gold_borrow_returns for each row execute function chk_gold_borrow_return();
