import { AppHeader } from "@/components/app/app-header";

/** تخطيط المنطقة المحمية (/app). middleware يضمن وجود جلسة + فرع مختار. */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
