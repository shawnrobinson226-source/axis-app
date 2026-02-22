create table if not exists fractures (
  id text primary key,
  label text not null,
  description text not null,
  signals_json text not null,
  created_at text not null default (datetime('now'))
);

create table if not exists redirects (
  id text primary key,
  label text not null,
  steps_json text not null,
  created_at text not null default (datetime('now'))
);

create table if not exists entries (
  id text primary key,
  trigger text not null,
  fracture_id text not null,
  fracture_label text not null,
  reframe text not null,
  redirect_id text not null,
  redirect_label text not null,
  redirect_steps_json text not null,
  created_at text not null default (datetime('now'))
);

create index if not exists idx_entries_created_at on entries(created_at);
create index if not exists idx_entries_fracture_id on entries(fracture_id);