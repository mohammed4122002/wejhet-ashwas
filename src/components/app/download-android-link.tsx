import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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
