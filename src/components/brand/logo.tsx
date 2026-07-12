import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * شعار المنصة (الأصلي، design.md §1).
 * - العلامة فقط: `public/brand/logo.png`
 * - القفل الكامل مع النص: `public/brand/logo-full.png`
 */
export function Logo({
  size = 40,
  withWordmark = false,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/brand/logo.png"
        alt="وجهة أشوس"
        width={size}
        height={size}
        className="rounded-card"
        priority
      />
      {withWordmark && (
        <span className="text-h2 font-bold text-text-primary">وجهة أشوس</span>
      )}
    </span>
  );
}

/** القفل الكامل (العلامة + الاسم) — لشاشات الترحيب والمصادقة. */
export function LogoFull({ width = 220 }: { width?: number }) {
  return (
    <Image
      src="/brand/logo-full.png"
      alt="وجهة أشوس"
      width={width}
      height={width}
      className="h-auto w-auto"
      priority
    />
  );
}
