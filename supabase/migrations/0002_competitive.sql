-- ============================================================================
--  الجلسة 5 — إضافات العنصر التنافسي (خطة §أ.10)
--
--  السبب: لوحة الصدارة والتحديات تحتاج عرض مؤشّر التزام/تقدّم كل مشارك للآخرين،
--  لكن RLS يحجب مهام/بيانات المستخدمين عن بعضهم. الحل: تخزين مؤشّر مُلخّص
--  (denormalized) يُحدّثه المستخدم بنفسه ويُقرأ ضمن حدود العضوية فقط.
-- ============================================================================

-- مؤشّر الالتزام المُعلن (لا "علامات" — خطة §أ.10) + سلسلة الأيام
alter table leaderboard_opt_in
  add column if not exists commitment_score int not null default 0,
  add column if not exists streak_days int not null default 0,
  add column if not exists updated_at timestamptz default now();

-- تقدّم المشارك ضمن التحدي (نسبي، لعرض لطيف بدل ترتيب رقمي قاسٍ)
alter table challenge_participants
  add column if not exists progress int not null default 0,
  add column if not exists updated_at timestamptz default now();

-- هدف التحدي المشترك (نص حرّ مثل "مين بيخلّص هالوحدة أول")
alter table challenges
  add column if not exists goal text;

-- ============================================================================
--  دوال SECURITY DEFINER لكسر تكرار RLS وللانضمام الآمن بكود الدعوة
-- ============================================================================

-- عضوية المستخدم بتحدٍّ — تُستخدم بسياسة قراءة المشاركين (تتجاوز RLS داخلياً)
create or replace function public.is_member_of(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from challenge_participants
    where challenge_id = cid and user_id = auth.uid()
  );
$$;

-- قراءة كل مشاركي تحدٍّ أنا عضو فيه (لعرض التقدّم النسبي)
drop policy if exists "read co-participants" on challenge_participants;
create policy "read co-participants" on challenge_participants
  for select using (public.is_member_of(challenge_id));

-- الانضمام بكود دعوة: يجد التحدي ويضيف المشارك دون كشف بقية التحديات
create or replace function public.join_challenge(code text, alias text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  select id into cid from challenges where invite_code = code;
  if cid is null then
    return null;
  end if;
  insert into challenge_participants (challenge_id, user_id, display_alias)
    values (cid, auth.uid(), coalesce(alias, 'طالب'))
    on conflict (challenge_id, user_id) do nothing;
  return cid;
end;
$$;

-- منع anon من الاستدعاء (المصادَقون فقط — مقصود)
revoke execute on function public.is_member_of(uuid) from public, anon;
revoke execute on function public.join_challenge(text, text) from public, anon;
grant execute on function public.is_member_of(uuid) to authenticated;
grant execute on function public.join_challenge(text, text) to authenticated;
