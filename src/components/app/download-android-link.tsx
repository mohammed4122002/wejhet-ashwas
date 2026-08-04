"use client";

import { useState } from "react";
import { Download, HelpCircle, Smartphone, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * رابط تنزيل تطبيق أندرويد (APK) — يُبنى تلقائياً من نفس كود الموقع عبر
 * GitHub Actions (راجع .github/workflows/build-android.yml) وينشر على
 * GitHub Releases بوسم ثابت "android-latest"، فرابط "latest/download" لا
 * يتغيّر أبداً حتى مع صدور نسخ جديدة — تنزيل مباشر مجاني، بدون متجر تطبيقات.
 */
export const ANDROID_APK_URL =
  "https://github.com/mohammed4122002/wejhet-ashwas/releases/latest/download/wejhet-ashwas.apk";

export function DownloadAndroidLink({
  variant = "ghost",
  className,
}: {
  variant?: "ghost" | "secondary" | "primary";
  className?: string;
}) {
  return (
    <Button asChild variant={variant} size="sm" className={className}>
      <a href={ANDROID_APK_URL} download>
        <Download aria-hidden />
        نزّل تطبيق أندرويد (APK)
      </a>
    </Button>
  );
}

/** زر "؟" صغير — يشرح خطوات التثبيت على أندرويد وآيفون بدون ما يشغل مساحة. */
export function InstallHelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="كيف أثبّت التطبيق على جوالي؟"
        className="flex size-6 items-center justify-center rounded-pill text-text-muted transition-colors hover:text-brand-400"
      >
        <HelpCircle className="size-5" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>كيف أثبّت التطبيق على جوالي؟</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="size-5 text-brand-400" aria-hidden />
                <h3 className="text-h3 text-text-primary">أندرويد</h3>
              </div>
              <ol className="flex list-inside list-decimal flex-col gap-1 text-body text-text-secondary">
                <li>اضغط زر «نزّل تطبيق أندرويد (APK)».</li>
                <li>افتح الملف بعد ما ينزل من إشعارات المتصفح.</li>
                <li>
                  لو ظهرت رسالة «مصدر غير معروف»، فعّل السماح بالتثبيت من
                  هذا المصدر — خطوة عادية للتطبيقات خارج المتجر.
                </li>
                <li>اضغط «تثبيت»، وخلص.</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Share className="size-5 text-brand-400" aria-hidden />
                <h3 className="text-h3 text-text-primary">آيفون (iOS)</h3>
              </div>
              <ol className="flex list-inside list-decimal flex-col gap-1 text-body text-text-secondary">
                <li>افتح الموقع من متصفح Safari (لازم Safari تحديداً).</li>
                <li>اضغط زر «المشاركة» (مربّع وسهم لفوق) بأسفل الشاشة.</li>
                <li>اختر «إضافة إلى الشاشة الرئيسية».</li>
                <li>
                  بيصير عندك أيقونة على شاشتك تفتح متل أي تطبيق تمام —
                  بدون نت وبإشعارات.
                </li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
