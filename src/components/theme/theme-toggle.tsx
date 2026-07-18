"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Theme = "dark" | "light";

/** يقرأ الوضع الحالي من صنف <html> (ضبطه سكربت ما-قبل-الرسم في layout). */
function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

/** يطبّق الوضع على <html> ويحفظه محلياً (يعمل offline بالكامل). */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // تجاهُل تعذّر الوصول للتخزين (وضع خاص) — الوضع يبقى مطبَّقاً للجلسة
  }
}

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "dark", label: "داكن", icon: Moon },
  { value: "light", label: "فاتح", icon: Sun },
];

/**
 * مبدّل المظهر (فاتح/داكن) — أزرار مجزّأة واضحة.
 * الوضع الداكن هو الافتراضي؛ الفاتح مستوحى من غروب هوية «وجهة أشوس».
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  // بعد الإماهة نقرأ الوضع الفعلي من DOM (لتفادي عدم التطابق مع الخادم)
  useEffect(() => setTheme(readTheme()), []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="المظهر"
      className="inline-flex gap-1 rounded-input border border-strong bg-bg-base p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(value)}
            className={cn(
              "flex items-center gap-2 rounded-[7px] px-4 py-2 text-body transition-colors",
              active
                ? "bg-brand-500 text-text-on-brand"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
