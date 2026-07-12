"use client";

import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { usePrefs } from "@/hooks/use-prefs";

/** صورة/اسم الطالب بالترويسة — رابط للإعدادات. */
export function HeaderAvatar() {
  const { avatarUrl, displayName } = usePrefs();
  return (
    <Link
      href="/app/settings"
      className="inline-flex items-center gap-2 rounded-pill px-2 py-1 transition-colors hover:bg-bg-surface"
      aria-label="الملف الشخصي والإعدادات"
    >
      <span className="flex size-8 items-center justify-center overflow-hidden rounded-pill border border-strong bg-bg-raised">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={32} height={32} className="size-full object-cover" />
        ) : (
          <UserRound className="size-4 text-text-muted" aria-hidden />
        )}
      </span>
      {displayName && (
        <span className="hidden text-secondary text-text-secondary sm:inline">
          {displayName}
        </span>
      )}
    </Link>
  );
}
