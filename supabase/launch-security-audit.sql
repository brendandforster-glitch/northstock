-- NorthStock launch security audit (read-only)
-- Run this in the Supabase SQL Editor and inspect every result set.

-- 1. Every application table in public should have RLS enabled.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- 2. Release blocker: this result must be empty for application tables.
select
  c.relname as table_without_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not c.relrowsecurity
order by c.relname;

-- 3. Review all policies, including roles and expressions.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as check_expression
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 4. Sensitive tables should not grant broad privileges to anon.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'admin_users',
    'buyer_request_responses',
    'email_campaign_recipients',
    'email_campaigns',
    'leads',
    'saved_listings',
    'saved_search_alerts_sent',
    'saved_searches',
    'seller_invites',
    'seller_requests'
  )
order by table_name, grantee, privilege_type;

-- 5. Review any policy whose USING or WITH CHECK expression is unconditionally true.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and (
    coalesce(trim(qual), '') in ('true', '(true)')
    or coalesce(trim(with_check), '') in ('true', '(true)')
  )
order by tablename, cmd, policyname;

-- 6. Inspect SECURITY DEFINER functions. Each requires an explicit review of
-- ownership, search_path, input validation, and executable roles.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  p.proconfig as function_settings
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.proname;

-- 7. Review exposed storage buckets and their public/private setting.
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
order by name;

-- 8. Duplicate application ownership checks worth resolving before launch.
select user_id, count(*) as company_count
from public.companies
where user_id is not null
group by user_id
having count(*) > 1
order by company_count desc;

select request_id, seller_user_id, count(*) as response_count
from public.buyer_request_responses
group by request_id, seller_user_id
having count(*) > 1
order by response_count desc;
