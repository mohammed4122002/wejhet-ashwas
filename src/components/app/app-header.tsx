import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SyncStatus } from "./sync-status";
import { logoutAction } from "@/app/(auth)/actions";

/** ترويسة التطبيق داخل المنطقة المحمية: الشعار + حالة المزامنة + خروج. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-subtle bg-bg-overlay backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/app" aria-label="الصفحة الرئيسية">
          <Logo size={36} withWordmark />
        </Link>
        <div className="flex items-center gap-3">
          <SyncStatus />
          <Link
            href="/app/settings"
            aria-label="الإعدادات"
            className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
          >
            <Settings className="size-4" aria-hidden />
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-secondary text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
            >
              <LogOut className="size-4" aria-hidden />
              خروج
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
