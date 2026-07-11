"use client";

import { cn } from "@/lib/utils";

/**
 * بطاقة اختيار (radio) — تُستخدم لاختيار الفرع ونظام المكافأة.
 * المحدّدة تُبرز بحدّ برتقالي وتوهّج خفيف من العلامة (design.md §4).
 */
export function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-1 rounded-card border p-4 transition-colors",
        checked
          ? "border-brand-500 bg-bg-raised shadow-glow-brand"
          : "border-strong bg-bg-surface hover:border-brand-400"
      )}
    >
      <div className="flex items-center gap-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="size-4 accent-brand-500"
        />
        <span className="text-h3 text-text-primary">{title}</span>
      </div>
      <span className="pr-7 text-secondary text-text-secondary">
        {description}
      </span>
    </label>
  );
}
