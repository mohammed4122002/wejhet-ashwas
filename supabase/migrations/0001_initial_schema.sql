-- ============================================================================
--  وجهة أشوس — المخطط الكامل لقاعدة البيانات (الجلسة 1)
--  مصدر الحقيقة: خطة_وجهة_أشوس_الشاملة.md §ب.3 + §أ.14 (صندوق الشكوك)
--
--  ملاحظة: يُبنى المخطط كاملاً من الأول (كل الجداول حتى اللي واجهتها بجلسات
--  لاحقة) لتفادي migrations متقطّعة — كما تنص CLAUDE.md (الجلسة 1، بند 3).
--
--  للتطبيق لاحقاً على مشروع Supabase مخصّص:
--    supabase db push   أو   عبر لوحة SQL Editor
-- ============================================================================

-- gen_random_uuid() متوفّرة افتراضياً على Supabase (pgcrypto). نضمنها احتياطاً.
create extension if not exists pgcrypto;

-- ============ الملفات الشخصية ============
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  track text not null check (track in ('scientific','literary')),
  reward_system text not null default 'star_constellations'
    check (reward_system in ('palestine_map','star_constellations','city_builder','garden_tree','minimal')),
  auto_schedule_apply boolean not null default false, -- "طبّق تلقائياً بدون مراجعة"
  created_at timestamptz default now()
);

-- ============ المنهج (بيانات ثابتة/بذرية) ============
create table subjects (
  id uuid primary key default gen_random_uuid(),
  track text not null check (track in ('scientific','literary','shared')),
  name_ar text not null,
  slug text unique not null,
  order_index int default 0
);

create table units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  name_ar text not null,
  order_index int default 0
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references units(id) on delete cascade,
  name_ar text not null,
  order_index int default 0
);

-- ============ الجدولة والمهام ============
create table schedule_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  title text not null,
  subject_id uuid references subjects(id),
  is_recurring boolean default true,
  created_at timestamptz default now(),
  -- updated_at يدعم استراتيجية مزامنة "آخر تعديل يفوز" (خطة §ب.5 بند 4)
  updated_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  schedule_slot_id uuid references schedule_slots(id),
  lesson_id uuid references lessons(id),
  subject_id uuid references subjects(id),
  title text not null,
  task_date date not null,
  task_type text not null default 'study' check (task_type in ('study','review')), -- 'review' = مهام التكرار المتباعد التلقائية
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  created_at timestamptz default now(),
  completed_at timestamptz,
  updated_at timestamptz default now()
);

-- ============ تواريخ الامتحانات (يغذّي: الجدولة التلقائية + وضع العد التنازلي) ============
create table exam_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  subject_id uuid references subjects(id),
  exam_date date not null
);

-- ============ بومودورو ============
create table pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  duration_minutes int not null,
  started_at timestamptz not null,
  ended_at timestamptz
);

-- ============ بنك الأسئلة ============
create table question_bank_items (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id),
  unit_id uuid references units(id),
  lesson_id uuid references lessons(id),
  skill_type text check (skill_type in ('understanding','application','analysis')),
  difficulty text check (difficulty in ('easy','medium','hard')),
  source text check (source in ('past_exam','practice')),
  exam_year int,
  question_text text not null,
  choices jsonb not null,          -- [{"key":"a","text":"..."}, ...]
  correct_answer text not null,
  explanation_text text not null,
  explanation_video_url text
);

create table question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  question_id uuid references question_bank_items(id) on delete cascade,
  is_correct boolean not null,
  time_spent_seconds int,
  answered_at timestamptz default now()
);

-- ============ المكافآت ============
create table reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  event_type text not null,        -- 'lesson_mastered' | 'unit_mastered' | 'streak_week' ...
  ref_id uuid,                     -- lesson_id أو subject_id حسب النوع
  unlocked_at timestamptz default now()
);

-- ============ التذكيرات ============
create table reminder_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  study_reminders boolean default true,
  motivational_reminders boolean default true,
  religious_reminders boolean default false
);

-- ============ صندوق الشكوك (خطة §أ.14) ============
create table doubt_box_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  task_id uuid references tasks(id),
  subject_id uuid references subjects(id),
  lesson_id uuid references lessons(id),
  question_text text not null,
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- ============ التنافسي: تحديات ولوحة صدارة ============
create table challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id),
  name text not null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  is_private boolean default true,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table challenge_participants (
  challenge_id uuid references challenges(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  display_alias text, -- اسم مستعار داخل التحدي، افتراضي لا الاسم الحقيقي
  joined_at timestamptz default now(),
  primary key (challenge_id, user_id)
);

-- لوحة الصدارة العامة (اختيارية بالكامل): مؤشر التزام أسبوعي، لا "علامات"
create table leaderboard_opt_in (
  user_id uuid primary key references profiles(id) on delete cascade,
  display_alias text not null,
  is_visible boolean not null default false
);

-- ============ اختبارات المحاكاة الكاملة ============
create table mock_exams (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id),
  title text not null,
  duration_minutes int not null,       -- مطابق لزمن الامتحان الفعلي بالمادة
  question_ids uuid[] not null          -- مصفوفة معرّفات من question_bank_items
);

create table mock_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  mock_exam_id uuid references mock_exams(id),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  answers jsonb,                        -- {"question_id": "chosen_answer", ...}
  score_percent numeric
);

-- ============================================================================
--  Row Level Security — إلزامي على كل جدول فيه بيانات مستخدم (لا استثناءات)
-- ============================================================================
alter table profiles enable row level security;
alter table schedule_slots enable row level security;
alter table tasks enable row level security;
alter table pomodoro_sessions enable row level security;
alter table question_attempts enable row level security;
alter table reward_events enable row level security;
alter table reminder_settings enable row level security;
alter table exam_schedule enable row level security;
alter table doubt_box_entries enable row level security;
alter table challenges enable row level security;
alter table challenge_participants enable row level security;
alter table leaderboard_opt_in enable row level security;
alter table mock_exam_attempts enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own schedule" on schedule_slots for all using (auth.uid() = user_id);
create policy "own tasks" on tasks for all using (auth.uid() = user_id);
create policy "own pomodoro" on pomodoro_sessions for all using (auth.uid() = user_id);
create policy "own attempts" on question_attempts for all using (auth.uid() = user_id);
create policy "own rewards" on reward_events for all using (auth.uid() = user_id);
create policy "own reminders" on reminder_settings for all using (auth.uid() = user_id);
create policy "own exam dates" on exam_schedule for all using (auth.uid() = user_id);
create policy "own doubts" on doubt_box_entries for all using (auth.uid() = user_id);
create policy "own attempts mock" on mock_exam_attempts for all using (auth.uid() = user_id);

-- التنافسي: القراءة لأعضاء نفس التحدي فقط، الكتابة لصاحب السجل
create policy "read own challenges" on challenges for select using (
  auth.uid() = creator_id or exists (
    select 1 from challenge_participants cp where cp.challenge_id = id and cp.user_id = auth.uid()
  )
);
create policy "create challenge" on challenges for insert with check (auth.uid() = creator_id);
create policy "manage own participation" on challenge_participants for all using (auth.uid() = user_id);
create policy "manage own leaderboard opt-in" on leaderboard_opt_in for all using (auth.uid() = user_id);
create policy "read visible leaderboard" on leaderboard_opt_in for select using (is_visible = true or auth.uid() = user_id);

-- subjects / units / lessons / question_bank_items / mock_exams:
-- قراءة عامة للجميع (بيانات منهج مشتركة، لا كتابة من العميل)
alter table subjects enable row level security;
alter table units enable row level security;
alter table lessons enable row level security;
alter table question_bank_items enable row level security;
alter table mock_exams enable row level security;
create policy "public read subjects" on subjects for select using (true);
create policy "public read units" on units for select using (true);
create policy "public read lessons" on lessons for select using (true);
create policy "public read questions" on question_bank_items for select using (true);
create policy "public read mock exams" on mock_exams for select using (true);

-- ============================================================================
--  الخريطة الحرارية — view محسوبة (لا جدول منفصل بالـMVP، خطة §ب.3 الملاحظة).
--  الإتقان يتراكم من: مهام "تمّت" + محاولات أسئلة صحيحة (خطة §أ.5 و§4.1).
--  security_invoker=true ⇒ RLS الجداول الأساسية يطبَّق ⇒ كل طالب يشوف بياناته فقط.
-- ============================================================================
create or replace view heatmap_unit_progress
with (security_invoker = true) as
select
  p.id as user_id,
  un.subject_id,
  un.id as unit_id,
  un.name_ar as unit_name,
  (select count(*) from lessons l where l.unit_id = un.id) as total_lessons,
  (
    select count(distinct x.lesson_id) from (
      select t.lesson_id
        from tasks t
        join lessons l2 on l2.id = t.lesson_id
       where l2.unit_id = un.id
         and t.user_id = p.id
         and t.status = 'done'
         and t.lesson_id is not null
      union
      select l3.id as lesson_id
        from question_attempts qa
        join question_bank_items qbi on qbi.id = qa.question_id
        join lessons l3 on l3.id = qbi.lesson_id
       where l3.unit_id = un.id
         and qa.user_id = p.id
         and qa.is_correct
    ) x
  ) as mastered_lessons
from profiles p
cross join units un;

-- ============================================================================
--  محفّزات مساعدة
-- ============================================================================

-- 1) تحديث updated_at تلقائياً على الجداول المحلية القابلة للكتابة (دعم المزامنة)
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_schedule_slots_updated_at
  before update on schedule_slots
  for each row execute function set_updated_at();

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- 2) عند إنشاء ملف شخصي جديد، أنشئ إعدادات التذكير الافتراضية له تلقائياً.
--    (الملف الشخصي نفسه يُنشأ من شاشة "اختر فرعك" لأن track إجباري بلا افتراضي.)
create or replace function handle_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into reminder_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger trg_profile_created
  after insert on profiles
  for each row execute function handle_new_profile();
