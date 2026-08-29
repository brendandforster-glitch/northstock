-- NorthStock worldwide marketplace migration
-- Run this once in the Supabase SQL Editor before deploying the international UI.

alter table public.companies
  add column if not exists country_code text;

alter table public.listings
  add column if not exists country_code text,
  add column if not exists currency_code text;

alter table public.buyer_requests
  add column if not exists country_code text,
  add column if not exists currency_code text;

alter table public.saved_searches
  add column if not exists country_code text;

-- Classify existing Canadian and US records from their current region values.
update public.companies
set country_code = case
  when province in (
    'British Columbia', 'Alberta', 'Saskatchewan', 'Manitoba', 'Ontario',
    'Quebec', 'New Brunswick', 'Nova Scotia', 'Prince Edward Island',
    'Newfoundland and Labrador', 'Yukon', 'Northwest Territories', 'Nunavut'
  ) then 'CA'
  else 'US'
end
where country_code is null or country_code = '';

update public.listings
set country_code = case
  when province in (
    'British Columbia', 'Alberta', 'Saskatchewan', 'Manitoba', 'Ontario',
    'Quebec', 'New Brunswick', 'Nova Scotia', 'Prince Edward Island',
    'Newfoundland and Labrador', 'Yukon', 'Northwest Territories', 'Nunavut'
  ) then 'CA'
  else 'US'
end
where country_code is null or country_code = '';

update public.listings
set currency_code = case when country_code = 'CA' then 'CAD' else 'USD' end
where currency_code is null or currency_code = '';

update public.buyer_requests
set country_code = case
  when province in (
    'British Columbia', 'Alberta', 'Saskatchewan', 'Manitoba', 'Ontario',
    'Quebec', 'New Brunswick', 'Nova Scotia', 'Prince Edward Island',
    'Newfoundland and Labrador', 'Yukon', 'Northwest Territories', 'Nunavut'
  ) then 'CA'
  else 'US'
end
where country_code is null or country_code = '';

update public.buyer_requests
set currency_code = case when country_code = 'CA' then 'CAD' else 'USD' end
where currency_code is null or currency_code = '';

update public.saved_searches
set country_code = case
  when province in (
    'British Columbia', 'Alberta', 'Saskatchewan', 'Manitoba', 'Ontario',
    'Quebec', 'New Brunswick', 'Nova Scotia', 'Prince Edward Island',
    'Newfoundland and Labrador', 'Yukon', 'Northwest Territories', 'Nunavut'
  ) then 'CA'
  when coalesce(province, '') = '' then null
  else 'US'
end
where country_code is null or country_code = '';

alter table public.listings alter column currency_code set default 'USD';
alter table public.buyer_requests alter column currency_code set default 'USD';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'companies_country_code_format'
  ) then
    alter table public.companies add constraint companies_country_code_format
      check (country_code is null or country_code ~ '^[A-Z]{2}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'listings_international_code_format'
  ) then
    alter table public.listings add constraint listings_international_code_format
      check (
        (country_code is null or country_code ~ '^[A-Z]{2}$') and
        (currency_code is null or currency_code ~ '^[A-Z]{3}$')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'buyer_requests_international_code_format'
  ) then
    alter table public.buyer_requests add constraint buyer_requests_international_code_format
      check (
        (country_code is null or country_code ~ '^[A-Z]{2}$') and
        (currency_code is null or currency_code ~ '^[A-Z]{3}$')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'saved_searches_country_code_format'
  ) then
    alter table public.saved_searches add constraint saved_searches_country_code_format
      check (country_code is null or country_code ~ '^[A-Z]{2}$');
  end if;
end $$;

create index if not exists listings_country_code_idx
  on public.listings (country_code);
create index if not exists listings_currency_code_idx
  on public.listings (currency_code);
create index if not exists companies_country_code_idx
  on public.companies (country_code);
create index if not exists buyer_requests_country_code_idx
  on public.buyer_requests (country_code);
create index if not exists saved_searches_country_code_idx
  on public.saved_searches (country_code);

comment on column public.companies.country_code is 'ISO 3166-1 alpha-2 country code';
comment on column public.listings.country_code is 'ISO 3166-1 alpha-2 country code';
comment on column public.listings.currency_code is 'ISO 4217 currency code for the listing price';
comment on column public.buyer_requests.country_code is 'ISO 3166-1 alpha-2 country code';
comment on column public.buyer_requests.currency_code is 'ISO 4217 currency code for the request budget';
comment on column public.saved_searches.country_code is 'ISO 3166-1 alpha-2 country filter';
