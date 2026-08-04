"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserRound, Settings, LogOut } from "lucide-react";
import { usePrefs } from "@/hooks/use-prefs";
import { logoutAction } from "@/app/(auth)/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function Avatar({ avatarUrl }: { avatarUrl: string | null }) {
  return (
    <span className="flex size-8 items-center justify-center overflow-hidden rounded-pill border border-strong bg-bg-raised">
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" width={32} height={32} className="size-full object-cover" />
      ) : (
        <UserRound className="size-4 text-text-muted" aria-hidden />
      )}
    </span>
  );
}

/**
 * صورة/اسم الطالب بالترويسة.
 * - الموبايل: الضغط يفتح قائمة صغيرة (الإعدادات / تسجيل خروج) بدل ما يكون
 *   زر "خروج" منفصل شاغل مساحة بالترويسة الضيقة.
 * - الشاشات الأوسع: رابط مباشر للإعدادات، وزر الخروج يبقى ظاهراً لجنبه
 *   (مساحة كافية بلا حاجة لقائمة).
 */
export function HeaderAvatar() {
  const { avatarUrl, displayName } = usePrefs();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* الموبايل: زر يفتح قائمة */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-pill px-2 py-1 transition-colors hover:bg-bg-surface sm:hidden"
        aria-label="حساب الطالب"
      >
        <Avatar avatarUrl={avatarUrl} />
      </button>

      {/* الشاشات الأوسع: رابط مباشر، زي ما كان */}
      <Link
        href="/app/settings"
        className="hidden items-center gap-2 rounded-pill px-2 py-1 transition-colors hover:bg-bg-surface sm:inline-flex"
        aria-label="الملف الشخصي والإعدادات"
      >
        <Avatar avatarUrl={avatarUrl} />
        {displayName && (
          <span className="text-secondary text-text-secondary">{displayName}</span>
        )}
      </Link>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{displayName || "حسابي"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-input border border-strong px-4 py-3 text-body text-text-primary transition-colors hover:bg-bg-surface"
            >
              <Settings className="size-5 text-brand-400" aria-hidden />
              الإعدادات
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-input border border-strong px-4 py-3 text-body text-text-primary transition-colors hover:bg-bg-surface"
              >
                <LogOut className="size-5 text-brand-400" aria-hidden />
                تسجيل خروج
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
