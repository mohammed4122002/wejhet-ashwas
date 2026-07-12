-- ============================================================================
--  بذر بنك الأسئلة + اختبارات المحاكاة — الجلسة 3 (بيانات تجريبية)
--
--  ملاحظة: هذا محتوى تجريبي بسيط للاختبار فقط. المحتوى الرسمي يجي بملفات جاهزة
--  من صاحب المشروع ويُستورد عبر scripts/import-questions.ts (خطة §أ.7).
--  آمن للتشغيل أكثر من مرة (idempotent) عبر not exists على نص السؤال/العنوان.
-- ============================================================================

insert into question_bank_items
  (subject_id, unit_id, lesson_id, skill_type, difficulty, source, exam_year,
   question_text, choices, correct_answer, explanation_text)
select s.id, u.id, l.id, v.skill, v.difficulty, v.source, v.exam_year,
       v.qtext, v.choices::jsonb, v.correct, v.expl
from (values
  -- الرياضيات
  ('math','المشتقة','application','easy','practice',null,
   'ما هي مشتقة الدالة f(x) = x²؟',
   '[{"key":"a","text":"x"},{"key":"b","text":"2x"},{"key":"c","text":"x²"},{"key":"d","text":"2"}]',
   'b','حسب قاعدة القوة: مشتقة xⁿ هي n·xⁿ⁻¹، إذن مشتقة x² هي 2x.'),
  ('math','المشتقة','understanding','medium','past_exam',2024,
   'ميل المماس لمنحنى الدالة عند نقطة يساوي:',
   '[{"key":"a","text":"قيمة الدالة عند النقطة"},{"key":"b","text":"المشتقة عند النقطة"},{"key":"c","text":"التكامل عند النقطة"},{"key":"d","text":"صفر دائماً"}]',
   'b','ميل المماس عند نقطة يساوي قيمة المشتقة الأولى عند تلك النقطة.'),
  ('math','النهايات','application','medium','practice',null,
   'قيمة النهاية lim(x→2) (x² − 4)/(x − 2) تساوي:',
   '[{"key":"a","text":"0"},{"key":"b","text":"2"},{"key":"c","text":"4"},{"key":"d","text":"غير معرّفة"}]',
   'c','بتحليل البسط: (x−2)(x+2)/(x−2) = x+2، وبالتعويض x=2 نحصل على 4.'),
  ('math','التكامل المحدود','application','hard','practice',null,
   'قيمة التكامل المحدود ∫₀¹ 2x dx تساوي:',
   '[{"key":"a","text":"1"},{"key":"b","text":"2"},{"key":"c","text":"0.5"},{"key":"d","text":"4"}]',
   'a','تكامل 2x هو x²، وبتطبيق الحدود [0,1]: 1² − 0² = 1.'),
  -- اللغة العربية
  ('arabic','الجملة الاسمية','understanding','easy','practice',null,
   'ما نوع الجملة: «العِلمُ نورٌ»؟',
   '[{"key":"a","text":"جملة فعلية"},{"key":"b","text":"جملة اسمية"},{"key":"c","text":"شبه جملة"},{"key":"d","text":"جملة شرطية"}]',
   'b','الجملة تبدأ باسم (العلم) وهو مبتدأ، و(نور) خبر، فهي جملة اسمية.'),
  ('arabic','التشبيه','analysis','medium','past_exam',2023,
   'في قول الشاعر «العلمُ كالنورِ»، ما أداة التشبيه؟',
   '[{"key":"a","text":"العلم"},{"key":"b","text":"النور"},{"key":"c","text":"الكاف"},{"key":"d","text":"لا يوجد"}]',
   'c','أداة التشبيه هنا هي الكاف في «كالنور»، والمشبّه «العلم» والمشبّه به «النور».'),
  -- التاريخ
  ('history','القضية الفلسطينية','understanding','medium','past_exam',2024,
   'صدر وعد بلفور في عام:',
   '[{"key":"a","text":"1917"},{"key":"b","text":"1948"},{"key":"c","text":"1936"},{"key":"d","text":"1967"}]',
   'a','صدر وعد بلفور عام 1917 من وزير خارجية بريطانيا آنذاك.'),
  ('history','حضارة بلاد الرافدين','understanding','easy','practice',null,
   'قامت حضارة بلاد الرافدين بين نهرَي:',
   '[{"key":"a","text":"النيل والأردن"},{"key":"b","text":"دجلة والفرات"},{"key":"c","text":"الفرات والليطاني"},{"key":"d","text":"دجلة والنيل"}]',
   'b','بلاد الرافدين (ميزوبوتاميا) تقع بين نهرَي دجلة والفرات.')
) as v(slug, lesson, skill, difficulty, source, exam_year, qtext, choices, correct, expl)
join subjects s on s.slug = v.slug
join units u on u.subject_id = s.id
join lessons l on l.unit_id = u.id and l.name_ar = v.lesson
where not exists (
  select 1 from question_bank_items q
  where q.lesson_id = l.id and q.question_text = v.qtext
);

-- ============ اختبارات محاكاة (تجميع أسئلة المادة) ============
insert into mock_exams (subject_id, title, duration_minutes, question_ids)
select s.id, 'محاكاة الرياضيات — تدريبي', 30,
       array(select q.id from question_bank_items q where q.subject_id = s.id order by q.question_text)
from subjects s
where s.slug = 'math'
  and not exists (select 1 from mock_exams m where m.title = 'محاكاة الرياضيات — تدريبي');
