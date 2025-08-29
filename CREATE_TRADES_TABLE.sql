-- Create trades table for Win/Loss tracking
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text not null,
  pair text not null,
  side text not null check (side in ('LONG','SHORT')),
  leverage numeric not null,
  duration text not null,
  amount numeric not null,
  entry_price numeric not null,
  exit_price numeric,
  pnl numeric default 0,
  status text not null default 'OPEN' check (status in ('OPEN','WIN','LOSS')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists trades_user_idx on public.trades(user_id);
create index if not exists trades_status_idx on public.trades(status);
create index if not exists trades_created_idx on public.trades(created_at desc);

-- Enable RLS
alter table public.trades enable row level security;

-- Drop existing policies if they exist
drop policy if exists insert_own_trades on public.trades;
drop policy if exists select_own_trades on public.trades;

-- Create policies for authenticated users
create policy insert_own_trades
on public.trades for insert to authenticated
with check (auth.uid()::text = user_id);

create policy select_own_trades
on public.trades for select to authenticated
using (auth.uid()::text = user_id);

-- Create policy for admin access (service role)
create policy admin_all_trades
on public.trades for all to service_role
using (true)
with check (true);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_trades_updated_at on public.trades;
create trigger update_trades_updated_at
  before update on public.trades
  for each row
  execute function update_updated_at_column();
