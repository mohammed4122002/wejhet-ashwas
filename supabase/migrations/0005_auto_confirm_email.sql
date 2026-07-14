-- ============================================================================
--  دخول مباشر بلا تأكيد بريد: نؤكّد بريد أي مستخدم جديد لحظة إنشائه.
--  يعمل مع أي إعداد، لكن يُفضّل أيضاً إطفاء "Confirm email" من لوحة Supabase
--  (Authentication → Providers → Email) لتفادي إرسال رسائل وحدود معدّلها.
-- ============================================================================

create or replace function public.auto_confirm_new_user()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_confirm on auth.users;
create trigger trg_auto_confirm
  before insert on auth.users
  for each row execute function public.auto_confirm_new_user();
