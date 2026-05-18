-- The Realtor OS — Supabase Schema (consolidated, single-run)
-- Run this once in the SQL Editor of your new Realtor OS Supabase project.

-- ===========================================================================
-- License keys (gate signup)
-- ===========================================================================
create table if not exists license_keys (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  used boolean default false,
  used_by uuid references auth.users(id),
  used_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Profiles (agent profile + brand)
-- ===========================================================================
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  brokerage_name text,
  license_key text,
  brand_color text default '#0f2d1a',
  accent_color text default '#22c55e',
  logo_url text,
  -- Agent-specific
  license_number text,
  brokerage_address text,
  license_state text,
  default_commission_rate numeric default 3.0,
  default_brokerage_split numeric default 70,
  specialties text,
  service_areas text,
  timezone text,
  preferred_showing_platform text,
  primary_market_area text,
  property_type_focus text,
  client_focus text,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Clients (buyers / sellers / past clients)
-- ===========================================================================
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  email text,
  phone text,
  brokerage_name text,
  client_type text default 'Buyer',
  transaction_status text default 'Active',
  property_type text,
  budget_min numeric,
  budget_max numeric,
  pre_approved boolean default false,
  pre_approval_amount numeric,
  pre_approval_expiry date,
  desired_location text,
  must_haves text,
  deal_breakers text,
  timeline text,
  referred_by text,
  closing_date date,
  preferred_contact text,
  priority text default 'Medium',
  notes text,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Projects (Active Listings)
-- ===========================================================================
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references clients(id) on delete set null,
  seller_id uuid references clients(id) on delete set null,
  name text not null,
  status text default 'Active',
  -- Address
  property_address text,
  city text,
  state text,
  zip text,
  -- Listing details
  list_price numeric,
  sale_price numeric,
  commission_rate numeric default 3.0,
  commission_amount numeric,
  listing_type text default 'Exclusive Right to Sell',
  property_type text,
  bedrooms integer,
  bathrooms numeric,
  square_feet integer,
  year_built integer,
  mls_number text,
  days_on_market integer default 0,
  showing_count integer default 0,
  offer_count integer default 0,
  open_house_count integer default 0,
  photos_link text,
  virtual_tour_link text,
  listing_date date,
  listing_expiry date,
  priority text default 'Medium',
  notes text,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Leads (NEW: pipeline)
-- ===========================================================================
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  email text,
  phone text,
  lead_type text default 'Buyer',
  lead_source text,
  stage text default 'New Lead',
  property_type text,
  budget_min numeric,
  budget_max numeric,
  desired_location text,
  timeline text,
  notes text,
  last_contact date,
  next_follow_up date,
  assigned_listing uuid references projects(id) on delete set null,
  converted boolean default false,
  converted_client_id uuid references clients(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Open Houses (NEW)
-- ===========================================================================
create table if not exists open_houses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  listing_id uuid references projects(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  status text default 'Scheduled',
  visitors integer default 0,
  expected_visitors integer default 0,
  sign_ins jsonb default '[]',
  notes text,
  follow_ups_sent boolean default false,
  leads_generated integer default 0,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Showings (NEW: replaces time_entries)
-- ===========================================================================
create table if not exists showings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references clients(id) on delete cascade,
  listing_id uuid references projects(id) on delete set null,
  property_address text,
  showing_date date default current_date,
  showing_time time,
  duration_minutes integer default 30,
  status text default 'Scheduled',
  client_feedback text,
  agent_notes text,
  interest_level integer,
  offer_likely boolean default false,
  follow_up_needed boolean default false,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Transactions (NEW: deal milestones)
-- ===========================================================================
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  listing_id uuid references projects(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  transaction_type text default 'Sale',
  status text default 'Under Contract',
  offer_price numeric,
  accepted_price numeric,
  earnest_money numeric,
  earnest_money_received boolean default false,
  inspection_date date,
  inspection_complete boolean default false,
  inspection_objections_deadline date,
  inspection_resolved boolean default false,
  appraisal_date date,
  appraisal_complete boolean default false,
  appraisal_contingency_deadline date,
  financing_deadline date,
  financing_approved boolean default false,
  title_ordered boolean default false,
  title_clear boolean default false,
  final_walkthrough_date date,
  final_walkthrough_complete boolean default false,
  closing_docs_sent_date date,
  closing_date date,
  closing_complete boolean default false,
  keys_delivered boolean default false,
  commission_received boolean default false,
  commission_rate numeric default 3.0,
  brokerage_split numeric default 70,
  gross_commission numeric,
  net_commission numeric,
  notes text,
  milestones jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Documents (Document Vault — replaces SOPs)
-- ===========================================================================
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references clients(id) on delete set null,
  listing_id uuid references projects(id) on delete set null,
  title text not null,
  category text,
  document_type text default 'Template',
  description text,
  content text,
  file_link text,
  status text default 'Active',
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Invoices (Commission Hub)
-- ===========================================================================
create table if not exists invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references clients(id) on delete cascade,
  listing_id uuid references projects(id) on delete set null,
  transaction_id uuid references transactions(id) on delete set null,
  invoice_number text,
  title text,
  status text default 'Expected',
  invoice_date date,
  due_date date,
  closing_date date,
  amount numeric default 0,
  amount_paid numeric default 0,
  payment_method text,
  payment_link text,
  commission_rate numeric,
  sale_price numeric,
  gross_commission numeric,
  brokerage_split_percent numeric,
  net_commission numeric,
  notes text,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Tasks
-- ===========================================================================
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  name text not null,
  status text default 'To Do',
  priority text default 'Medium',
  due_date date,
  notes text,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Follow-ups
-- ===========================================================================
create table if not exists follow_ups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  title text not null,
  type text,
  follow_up_type text,
  status text default 'To Do',
  follow_up_date date,
  channel text,
  property_interest text,
  notes text,
  outcome text,
  outcome_detail text,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Weekly Business Reviews
-- ===========================================================================
create table if not exists weekly_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  week_start date not null,
  new_listings integer default 0,
  showings_given integer default 0,
  offers_written integer default 0,
  offers_accepted integer default 0,
  closings_this_week integer default 0,
  gross_commission_week numeric default 0,
  new_leads integer default 0,
  open_houses_held integer default 0,
  listings_expiring_soon text,
  buyers_needing_attention text,
  leads_to_follow_up text,
  deals_at_risk text,
  top_win text,
  top_challenge text,
  prospecting_done text,
  marketing_done text,
  top_priority_1 text,
  top_priority_2 text,
  top_priority_3 text,
  listings_to_follow_up text,
  buyers_to_check_in text,
  open_houses_to_prep text,
  prospecting_plan text,
  market_notes text,
  momentum_rating integer,
  prospecting_rating integer,
  business_rating integer,
  energy_rating integer,
  notes text,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- Market Notes (NEW)
-- ===========================================================================
create table if not exists market_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  week_date date default current_date,
  area text,
  avg_list_price numeric,
  avg_sale_price numeric,
  avg_dom integer,
  list_to_sale_ratio numeric,
  active_listings integer,
  new_listings integer,
  closed_sales integer,
  months_of_inventory numeric,
  market_trend text default 'Neutral',
  notes text,
  created_at timestamp with time zone default now()
);

-- ===========================================================================
-- RLS — enable on every table
-- ===========================================================================
alter table profiles       enable row level security;
alter table clients        enable row level security;
alter table projects       enable row level security;
alter table leads          enable row level security;
alter table open_houses    enable row level security;
alter table showings       enable row level security;
alter table transactions   enable row level security;
alter table documents      enable row level security;
alter table invoices       enable row level security;
alter table tasks          enable row level security;
alter table follow_ups     enable row level security;
alter table weekly_reviews enable row level security;
alter table market_notes   enable row level security;
alter table license_keys   enable row level security;

-- ===========================================================================
-- RLS policies — profiles (per-action, prevents the INSERT race condition)
-- ===========================================================================
drop policy if exists "Users see own profile" on profiles;
drop policy if exists "Profile select own"    on profiles;
drop policy if exists "Profile insert own"    on profiles;
drop policy if exists "Profile update own"    on profiles;

create policy "Profile select own" on profiles
  for select using (auth.uid() = id);

create policy "Profile insert own" on profiles
  for insert with check (auth.uid() = id);

create policy "Profile update own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ===========================================================================
-- RLS policies — owned-by-user tables (FOR ALL using user_id = auth.uid())
-- ===========================================================================
drop policy if exists "Users see own clients"        on clients;
create policy "Users see own clients"        on clients        for all using (auth.uid() = user_id);

drop policy if exists "Users see own projects"       on projects;
create policy "Users see own projects"       on projects       for all using (auth.uid() = user_id);

drop policy if exists "Users see own leads"          on leads;
create policy "Users see own leads"          on leads          for all using (auth.uid() = user_id);

drop policy if exists "Users see own open houses"    on open_houses;
create policy "Users see own open houses"    on open_houses    for all using (auth.uid() = user_id);

drop policy if exists "Users see own showings"       on showings;
create policy "Users see own showings"       on showings       for all using (auth.uid() = user_id);

drop policy if exists "Users see own transactions"   on transactions;
create policy "Users see own transactions"   on transactions   for all using (auth.uid() = user_id);

drop policy if exists "Users see own documents"      on documents;
create policy "Users see own documents"      on documents      for all using (auth.uid() = user_id);

drop policy if exists "Users see own invoices"       on invoices;
create policy "Users see own invoices"       on invoices       for all using (auth.uid() = user_id);

drop policy if exists "Users see own tasks"          on tasks;
create policy "Users see own tasks"          on tasks          for all using (auth.uid() = user_id);

drop policy if exists "Users see own follow ups"     on follow_ups;
create policy "Users see own follow ups"     on follow_ups     for all using (auth.uid() = user_id);

drop policy if exists "Users see own weekly reviews" on weekly_reviews;
create policy "Users see own weekly reviews" on weekly_reviews for all using (auth.uid() = user_id);

drop policy if exists "Users see own market notes"   on market_notes;
create policy "Users see own market notes"   on market_notes   for all using (auth.uid() = user_id);

-- ===========================================================================
-- License keys policies — read by any authenticated user (so signup can
-- validate), update by authenticated (so signup can mark used).
-- The Stripe webhook inserts new keys with the service-role key (bypasses RLS).
-- ===========================================================================
drop policy if exists "Anyone authenticated reads license keys" on license_keys;
create policy "Anyone authenticated reads license keys"
  on license_keys for select to authenticated using (true);

drop policy if exists "Anyone reads license keys" on license_keys;
create policy "Anyone reads license keys"
  on license_keys for select using (true);

drop policy if exists "Authenticated claims license keys" on license_keys;
create policy "Authenticated claims license keys"
  on license_keys for update to authenticated using (true);

-- ===========================================================================
-- Trigger: auto-create profile row on auth.users insert.
-- Bypasses RLS via security definer — eliminates the client-side INSERT
-- race condition that we hit on Film/VA/Coach.
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, brokerage_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'brokerage_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
