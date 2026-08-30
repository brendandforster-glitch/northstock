-- NorthStock newsletter opt-in registration
-- Run once in the production Supabase SQL Editor before deploying this UI.

create or replace function public.register_newsletter_opt_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  opted_in boolean := coalesce(
    (new.raw_user_meta_data ->> 'newsletter_opt_in')::boolean,
    false
  );
  requested_audience text := lower(
    coalesce(new.raw_user_meta_data ->> 'newsletter_audience', 'member')
  );
begin
  if not opted_in or new.email is null then
    return new;
  end if;

  if requested_audience not in ('member', 'seller', 'buyer') then
    requested_audience := 'member';
  end if;

  update public.email_subscribers
  set
    subscribed = true,
    audience = requested_audience,
    unsubscribed_at = null
  where lower(email) = lower(new.email);

  if not found then
    insert into public.email_subscribers (
      email,
      subscribed,
      audience,
      unsubscribed_at
    )
    values (
      lower(new.email),
      true,
      requested_audience,
      null
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.register_newsletter_opt_in()
from public, anon, authenticated;

drop trigger if exists register_newsletter_opt_in_after_signup on auth.users;

create trigger register_newsletter_opt_in_after_signup
after insert on auth.users
for each row
execute function public.register_newsletter_opt_in();

comment on function public.register_newsletter_opt_in() is
  'Subscribes newly registered users only when newsletter_opt_in is explicitly true in their auth metadata.';
