import Image from "next/image";

/** تخطيط صفحات المصادقة: بطاقة موسّطة على خلفية غامقة مع الشعار. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      {/* قفل عمودي أنيق: العلامة كأيقونة + الاسم كنص */}
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/brand/logo.png"
          alt="وجهة أشوس"
          width={88}
          height={88}
          priority
          className="rounded-card shadow-glow-brand"
        />
        <span className="text-h1 font-bold text-text-primary">وجهة أشوس</span>
      </div>

      <div className="w-full max-w-md">{children}</div>

      <p className="text-secondary text-text-muted">
        رحلتك نحو هدفك تبدأ بخطوة — وأنت صاحب القرار.
      </p>
    </main>
  );
}
