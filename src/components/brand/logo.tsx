import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * شعار المنصة.
 * TODO(brand): الملف الحالي public/brand/logo.svg عنصر نائب (placeholder)
 * مبني بهوية design.md. يُستبدل بالشعار الأصلي عالي الدقة (SVG/PNG) أول ما يتوفر
 * — نفس المسار، بدون تغيير بهذا المكوّن. (design.md §7)
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
        src="/brand/logo.svg"
        alt="وجهة أشوس"
        width={size}
        height={size}
        priority
      />
      {withWordmark && (
        <span className="text-h2 font-bold text-text-primary">وجهة أشوس</span>
      )}
    </span>
  );
}
