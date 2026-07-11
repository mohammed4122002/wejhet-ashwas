# وجهة أشوس — رفيق طالب التوجيهي الفلسطيني

منصة عربية (RTL بالكامل، Dark Mode) لطالب التوجيهي الفلسطيني (علمي/أدبي):
جدولة أسبوعية + مهام يومية تلقائية + بومودورو + بنك أسئلة + خريطة تقدّم + نظام
مكافأة بصري. الطالب هو صاحب القرار دائماً.

> المراجع الإلزامية للبناء موجودة بجذر المشروع:
> `CLAUDE.md` (التعليمات) · `خطة_وجهة_أشوس_الشاملة.md` (الميزات + المخطط) ·
> `design.md` (توكنز التصميم).

## الستاك

Next.js 14 (App Router, TypeScript) · Tailwind CSS + توكنز `design.md` ·
Supabase (Postgres + Auth + RLS) · Dexie.js (IndexedDB / local-first) ·
TanStack Query · lucide-react.

## التشغيل المحلي

```bash
npm install
cp .env.example .env.local   # واملأ مفاتيح Supabase
npm run dev
```

الأوامر الأساسية:

```bash
npm run dev          # تشغيل محلي
npm run build        # بناء الإنتاج
npm run lint         # ESLint
npx tsc --noEmit     # فحص TypeScript الصارم
```

## قاعدة البيانات

المخطط الكامل + سياسات RLS + الخريطة الحرارية (view) بملف:
`supabase/migrations/0001_initial_schema.sql`
وبيانات المنهج البذرية بـ `supabase/seed.sql`.

**مُطبَّق فعلياً** على مشروع Supabase المخصّص لوجهة أشوس: 18 جدول، 20 سياسة RLS
(RLS مفعّل على كل جدول بلا استثناء)، الخريطة الحرارية كـview، وبيانات بذرية
(3 مواد / 8 وحدات / 18 درس). مدقّق أمان Supabase: صفر تنبيهات.

لإعادة التطبيق على مشروع آخر: شغّل `0001_initial_schema.sql` ثم `seed.sql` من
SQL Editor، وعبّي `.env.local` بـ `NEXT_PUBLIC_SUPABASE_URL` و
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (المفاتيح المحلية مُستثناة من git).

## بنية المجلدات

```
src/
  app/
    (auth)/            صفحات الدخول/التسجيل/الاستعادة + Server Actions
    onboarding/track/  شاشة "اختر فرعك" الإجبارية
    app/               المنطقة المحمية (لوحة الطالب)
    auth/callback/     رجوع مصادقة Supabase (PKCE)
  components/
    ui/                مكوّنات أساسية (Button, Input, Card, RadioCard...)
    auth/ app/ brand/  مكوّنات مخصّصة
  lib/
    supabase/          عملاء المتصفّح/الخادم + middleware + أنواع القاعدة
    db/                Dexie + طابور المزامنة + محرّك المزامنة (local-first)
    domain/            منطق أعمال نقي مستقل عن الواجهة (خطة §ب.2)
supabase/              migration المخطط + seed
```

## حالة البناء (الجلسة 1 — الأساس)

مبني وجاهز: التصميم والتوكنز، RTL + Dark، المصادقة الكاملة، شاشة اختيار الفرع
الإجبارية، المخطط الكامل + RLS + seed (ملفات)، وطبقة local-first (Dexie + طابور
مزامنة). التفاصيل بملخّص الجلسة.
