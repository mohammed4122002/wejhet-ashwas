import { Logo } from "@/components/brand/logo";

/** تخطيط صفحات المصادقة: بطاقة موسّطة على خلفية غامقة مع الشعار. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo size={56} withWordmark />
      <div className="w-full max-w-md">{children}</div>
      <p className="text-secondary text-text-muted">
        رحلتك نحو هدفك تبدأ بخطوة — وأنت صاحب القرار.
      </p>
    </main>
  );
}
