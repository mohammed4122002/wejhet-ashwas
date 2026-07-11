-- ============================================================================
--  بيانات بذرية للمنهج — الجلسة 1 (CLAUDE.md بند 5: مادتين-ثلاث مواد تجريبية)
--
--  ملاحظة: هذا محتوى منهج تجريبي مبسّط للاختبار فقط. المحتوى الرسمي الكامل
--  (كل المواد + بنك الأسئلة) رح يجي بملفات جاهزة من صاحب المشروع لاحقاً،
--  ويُستورد عبر سكربت الاستيراد بالجلسة 3 (خطة §أ.7).
--
--  آمن للتشغيل أكثر من مرة (idempotent) بفضل on conflict على slug.
-- ============================================================================

-- ---------- المواد ----------
insert into subjects (track, name_ar, slug, order_index) values
  ('shared',     'اللغة العربية', 'arabic',  1),
  ('scientific', 'الرياضيات',     'math',    2),
  ('literary',   'التاريخ',       'history', 3)
on conflict (slug) do nothing;

-- ---------- وحدات + دروس: اللغة العربية (مشتركة) ----------
insert into units (subject_id, name_ar, order_index)
select id, v.name_ar, v.order_index
from subjects s
cross join (values
  ('النحو والصرف', 1),
  ('البلاغة',      2),
  ('الأدب والنصوص', 3)
) as v(name_ar, order_index)
where s.slug = 'arabic'
  and not exists (
    select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar
  );

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index
from units u
join subjects s on s.id = u.subject_id and s.slug = 'arabic'
cross join lateral (values
  ('النحو والصرف', 'الجملة الاسمية',   1),
  ('النحو والصرف', 'الجملة الفعلية',   2),
  ('النحو والصرف', 'إعراب الأفعال',    3),
  ('البلاغة',      'التشبيه',          1),
  ('البلاغة',      'الاستعارة',        2),
  ('الأدب والنصوص', 'الشعر الجاهلي',   1),
  ('الأدب والنصوص', 'الأدب الحديث',    2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (
    select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar
  );

-- ---------- وحدات + دروس: الرياضيات (علمي) ----------
insert into units (subject_id, name_ar, order_index)
select id, v.name_ar, v.order_index
from subjects s
cross join (values
  ('التفاضل والتكامل', 1),
  ('الهندسة التحليلية', 2),
  ('الاحتمالات',        3)
) as v(name_ar, order_index)
where s.slug = 'math'
  and not exists (
    select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar
  );

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index
from units u
join subjects s on s.id = u.subject_id and s.slug = 'math'
cross join lateral (values
  ('التفاضل والتكامل', 'النهايات',        1),
  ('التفاضل والتكامل', 'المشتقة',         2),
  ('التفاضل والتكامل', 'التكامل المحدود', 3),
  ('الهندسة التحليلية', 'المتجهات',       1),
  ('الهندسة التحليلية', 'معادلة المستقيم', 2),
  ('الاحتمالات',        'التباديل والتوافيق', 1),
  ('الاحتمالات',        'الاحتمال الشرطي',    2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (
    select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar
  );

-- ---------- وحدات + دروس: التاريخ (أدبي) ----------
insert into units (subject_id, name_ar, order_index)
select id, v.name_ar, v.order_index
from subjects s
cross join (values
  ('الحضارات القديمة', 1),
  ('التاريخ الحديث',   2)
) as v(name_ar, order_index)
where s.slug = 'history'
  and not exists (
    select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar
  );

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index
from units u
join subjects s on s.id = u.subject_id and s.slug = 'history'
cross join lateral (values
  ('الحضارات القديمة', 'حضارة بلاد الرافدين', 1),
  ('الحضارات القديمة', 'الحضارة الكنعانية',   2),
  ('التاريخ الحديث',   'النهضة العربية',      1),
  ('التاريخ الحديث',   'القضية الفلسطينية',   2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (
    select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar
  );
