create table if not exists public.barberbe_tv_sessions (
  code text primary key,
  controller_token_hash text,
  paired boolean not null default false,
  payload jsonb not null default '{"mode":"idle","updatedAt":0,"featuredProducts":[]}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.barberbe_tv_sessions enable row level security;

create index if not exists barberbe_tv_sessions_expires_at_idx
  on public.barberbe_tv_sessions (expires_at);
