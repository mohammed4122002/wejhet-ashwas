"use client";

import { cn } from "@/lib/utils";

/** مفتاح تبديل (toggle) بسيط ومتوافق مع RTL. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors",
        checked ? "bg-brand-500" : "bg-bg-raised border border-strong"
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-text-primary transition-transform",
          // RTL: المفتاح المفعّل يتحرّك لليسار
          checked ? "-translate-x-6" : "-translate-x-1"
        )}
      />
    </button>
  );
}
