-- ============================================================================
--  منهاج التوجيهي الفلسطيني — بنية واقعية كاملة (كل مواد الفرعين)
--
--  ملاحظة تعليمية مهمة: هذه بنية استرشادية تحاكي المنهاج الفلسطيني الفعلي
--  (وحدات ودروس بأسمائها المتعارفة). المنهاج يتغيّر شبه سنوياً ويختلف أحياناً
--  بين الضفة وغزة — **التدقيق النهائي من وزارة التربية للسنة المستهدفة**،
--  وسكربت scripts/import-questions.ts هو المسار الرسمي للمحتوى الكامل.
--
--  آمن للتشغيل أكثر من مرة (idempotent).
-- ============================================================================

-- ---------- المواد (مشتركة 1-4، علمي 10-13، أدبي 20-23) ----------
insert into subjects (track, name_ar, slug, order_index) values
  ('shared',     'اللغة الإنجليزية',      'english',    2),
  ('shared',     'التربية الإسلامية',     'islamic',    3),
  ('shared',     'تكنولوجيا المعلومات',   'ict',        4),
  ('scientific', 'الفيزياء',              'physics',   11),
  ('scientific', 'الكيمياء',              'chemistry', 12),
  ('scientific', 'الأحياء',               'biology',   13),
  ('literary',   'الجغرافيا',             'geography', 21),
  ('literary',   'علم النفس والاجتماع',   'psychology',22),
  ('literary',   'الثقافة العلمية',       'science-culture', 23)
on conflict (slug) do nothing;

-- إعادة ترتيب المواد الموجودة ضمن المجموعات
update subjects set order_index = 1  where slug = 'arabic';
update subjects set order_index = 10 where slug = 'math';
update subjects set order_index = 20 where slug = 'history';

-- ---------- دالة النمط: وحدات ثم دروس (نفس نمط seed.sql الآمن) ----------

-- ===== اللغة الإنجليزية =====
insert into units (subject_id, name_ar, order_index)
select s.id, v.name_ar, v.order_index from subjects s
cross join (values
  ('القراءة والاستيعاب', 1), ('القواعد', 2), ('الكتابة', 3), ('المفردات والتعبير', 4)
) as v(name_ar, order_index)
where s.slug = 'english'
  and not exists (select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar);

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index from units u
join subjects s on s.id = u.subject_id and s.slug = 'english'
cross join lateral (values
  ('القراءة والاستيعاب', 'النصوص الأدبية', 1),
  ('القراءة والاستيعاب', 'النصوص العلمية', 2),
  ('القراءة والاستيعاب', 'الاستنتاج والتحليل', 3),
  ('القواعد', 'الأزمنة Tenses', 1),
  ('القواعد', 'المبني للمجهول Passive', 2),
  ('القواعد', 'الجمل الشرطية Conditionals', 3),
  ('القواعد', 'الكلام المنقول Reported Speech', 4),
  ('الكتابة', 'كتابة المقال', 1),
  ('الكتابة', 'كتابة التقرير', 2),
  ('الكتابة', 'الرسالة الرسمية', 3),
  ('المفردات والتعبير', 'المرادفات والأضداد', 1),
  ('المفردات والتعبير', 'التعابير الاصطلاحية', 2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar);

-- ===== التربية الإسلامية =====
insert into units (subject_id, name_ar, order_index)
select s.id, v.name_ar, v.order_index from subjects s
cross join (values
  ('العقيدة', 1), ('الحديث والسيرة', 2), ('الفقه', 3), ('التلاوة والتجويد', 4)
) as v(name_ar, order_index)
where s.slug = 'islamic'
  and not exists (select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar);

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index from units u
join subjects s on s.id = u.subject_id and s.slug = 'islamic'
cross join lateral (values
  ('العقيدة', 'الإيمان بالقضاء والقدر', 1),
  ('العقيدة', 'أثر الإيمان في حياة المسلم', 2),
  ('الحديث والسيرة', 'أحاديث في الأخلاق', 1),
  ('الحديث والسيرة', 'دروس من السيرة النبوية', 2),
  ('الفقه', 'المعاملات المالية', 1),
  ('الفقه', 'أحكام الأسرة', 2),
  ('التلاوة والتجويد', 'أحكام النون الساكنة والتنوين', 1),
  ('التلاوة والتجويد', 'أحكام المدود', 2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar);

-- ===== تكنولوجيا المعلومات =====
insert into units (subject_id, name_ar, order_index)
select s.id, v.name_ar, v.order_index from subjects s
cross join (values
  ('البرمجة والخوارزميات', 1), ('قواعد البيانات', 2), ('الشبكات والإنترنت', 3)
) as v(name_ar, order_index)
where s.slug = 'ict'
  and not exists (select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar);

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index from units u
join subjects s on s.id = u.subject_id and s.slug = 'ict'
cross join lateral (values
  ('البرمجة والخوارزميات', 'الخوارزميات والمخططات الانسيابية', 1),
  ('البرمجة والخوارزميات', 'الجمل الشرطية', 2),
  ('البرمجة والخوارزميات', 'الحلقات التكرارية', 3),
  ('قواعد البيانات', 'تصميم قواعد البيانات', 1),
  ('قواعد البيانات', 'لغة الاستعلام SQL', 2),
  ('الشبكات والإنترنت', 'أساسيات الشبكات', 1),
  ('الشبكات والإنترنت', 'الأمن الرقمي والحماية', 2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar);

-- ===== الفيزياء =====
insert into units (subject_id, name_ar, order_index)
select s.id, v.name_ar, v.order_index from subjects s
cross join (values
  ('الحركة الدورانية والاتزان', 1), ('الكهرباء', 2), ('المغناطيسية', 3), ('الفيزياء الحديثة', 4)
) as v(name_ar, order_index)
where s.slug = 'physics'
  and not exists (select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar);

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index from units u
join subjects s on s.id = u.subject_id and s.slug = 'physics'
cross join lateral (values
  ('الحركة الدورانية والاتزان', 'عزم القوة', 1),
  ('الحركة الدورانية والاتزان', 'الزخم الزاوي', 2),
  ('الحركة الدورانية والاتزان', 'اتزان الأجسام', 3),
  ('الكهرباء', 'المجال والجهد الكهربائي', 1),
  ('الكهرباء', 'المواسعات', 2),
  ('الكهرباء', 'دارات التيار المستمر', 3),
  ('المغناطيسية', 'المجال المغناطيسي', 1),
  ('المغناطيسية', 'الحث الكهرومغناطيسي', 2),
  ('الفيزياء الحديثة', 'الظاهرة الكهروضوئية', 1),
  ('الفيزياء الحديثة', 'الفيزياء النووية', 2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar);

-- ===== الكيمياء =====
insert into units (subject_id, name_ar, order_index)
select s.id, v.name_ar, v.order_index from subjects s
cross join (values
  ('الاتزان الكيميائي', 1), ('الأحماض والقواعد', 2), ('الكيمياء الكهربائية', 3), ('الكيمياء العضوية', 4)
) as v(name_ar, order_index)
where s.slug = 'chemistry'
  and not exists (select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar);

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index from units u
join subjects s on s.id = u.subject_id and s.slug = 'chemistry'
cross join lateral (values
  ('الاتزان الكيميائي', 'ثابت الاتزان', 1),
  ('الاتزان الكيميائي', 'مبدأ لوشاتلييه', 2),
  ('الأحماض والقواعد', 'مفهوم الحموضة والقاعدية', 1),
  ('الأحماض والقواعد', 'المحاليل المنظّمة', 2),
  ('الأحماض والقواعد', 'التسحيح', 3),
  ('الكيمياء الكهربائية', 'الخلايا الجلفانية', 1),
  ('الكيمياء الكهربائية', 'التحليل الكهربائي', 2),
  ('الكيمياء العضوية', 'الهيدروكربونات', 1),
  ('الكيمياء العضوية', 'الكحولات والألدهيدات', 2),
  ('الكيمياء العضوية', 'الأحماض الكربوكسيلية', 3)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar);

-- ===== الأحياء =====
insert into units (subject_id, name_ar, order_index)
select s.id, v.name_ar, v.order_index from subjects s
cross join (values
  ('الوراثة', 1), ('التنظيم العصبي', 2), ('التنظيم الهرموني', 3), ('المناعة', 4)
) as v(name_ar, order_index)
where s.slug = 'biology'
  and not exists (select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar);

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index from units u
join subjects s on s.id = u.subject_id and s.slug = 'biology'
cross join lateral (values
  ('الوراثة', 'قوانين مندل', 1),
  ('الوراثة', 'DNA وتضاعفه', 2),
  ('الوراثة', 'بناء البروتين', 3),
  ('التنظيم العصبي', 'الخلية العصبية والسيال', 1),
  ('التنظيم العصبي', 'الدماغ والحبل الشوكي', 2),
  ('التنظيم الهرموني', 'الغدد الصماء', 1),
  ('التنظيم الهرموني', 'التوازن الداخلي', 2),
  ('المناعة', 'أنواع المناعة', 1),
  ('المناعة', 'الأمراض المناعية', 2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar);

-- ===== الجغرافيا =====
insert into units (subject_id, name_ar, order_index)
select s.id, v.name_ar, v.order_index from subjects s
cross join (values
  ('الجغرافيا الطبيعية', 1), ('الجغرافيا البشرية', 2), ('جغرافية فلسطين', 3), ('الخرائط ونظم المعلومات', 4)
) as v(name_ar, order_index)
where s.slug = 'geography'
  and not exists (select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar);

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index from units u
join subjects s on s.id = u.subject_id and s.slug = 'geography'
cross join lateral (values
  ('الجغرافيا الطبيعية', 'المناخ وعناصره', 1),
  ('الجغرافيا الطبيعية', 'التضاريس', 2),
  ('الجغرافيا البشرية', 'السكان والهجرة', 1),
  ('الجغرافيا البشرية', 'العمران والمدن', 2),
  ('جغرافية فلسطين', 'الموقع والأهمية', 1),
  ('جغرافية فلسطين', 'الموارد الطبيعية والمياه', 2),
  ('الخرائط ونظم المعلومات', 'قراءة الخرائط', 1),
  ('الخرائط ونظم المعلومات', 'نظم المعلومات الجغرافية GIS', 2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar);

-- ===== علم النفس والاجتماع =====
insert into units (subject_id, name_ar, order_index)
select s.id, v.name_ar, v.order_index from subjects s
cross join (values
  ('مدخل إلى علم النفس', 1), ('الشخصية والصحة النفسية', 2), ('علم الاجتماع', 3)
) as v(name_ar, order_index)
where s.slug = 'psychology'
  and not exists (select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar);

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index from units u
join subjects s on s.id = u.subject_id and s.slug = 'psychology'
cross join lateral (values
  ('مدخل إلى علم النفس', 'النمو الإنساني', 1),
  ('مدخل إلى علم النفس', 'التعلم والذاكرة', 2),
  ('الشخصية والصحة النفسية', 'سمات الشخصية', 1),
  ('الشخصية والصحة النفسية', 'التكيف والضغوط', 2),
  ('علم الاجتماع', 'المجتمع والثقافة', 1),
  ('علم الاجتماع', 'الأسرة والتنشئة الاجتماعية', 2),
  ('علم الاجتماع', 'المشكلات الاجتماعية', 3)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar);

-- ===== الثقافة العلمية =====
insert into units (subject_id, name_ar, order_index)
select s.id, v.name_ar, v.order_index from subjects s
cross join (values
  ('الطاقة', 1), ('الصحة والغذاء', 2), ('التكنولوجيا والبيئة', 3)
) as v(name_ar, order_index)
where s.slug = 'science-culture'
  and not exists (select 1 from units u where u.subject_id = s.id and u.name_ar = v.name_ar);

insert into lessons (unit_id, name_ar, order_index)
select u.id, v.name_ar, v.order_index from units u
join subjects s on s.id = u.subject_id and s.slug = 'science-culture'
cross join lateral (values
  ('الطاقة', 'مصادر الطاقة', 1),
  ('الطاقة', 'الطاقة المتجددة', 2),
  ('الصحة والغذاء', 'التغذية السليمة', 1),
  ('الصحة والغذاء', 'أمراض العصر', 2),
  ('التكنولوجيا والبيئة', 'تكنولوجيا الاتصالات', 1),
  ('التكنولوجيا والبيئة', 'التلوث وحماية البيئة', 2)
) as v(unit_name, name_ar, order_index)
where u.name_ar = v.unit_name
  and not exists (select 1 from lessons l where l.unit_id = u.id and l.name_ar = v.name_ar);
