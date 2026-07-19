"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ListTodo,
  CalendarDays,
  Library,
  BarChart3,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app", label: "اليوم", icon: ListTodo, exact: true },
  { href: "/app/schedule", label: "الجدول", icon: CalendarDays },
  { href: "/app/bank", label: "البنك", icon: Library },
  { href: "/app/progress", label: "رحلتي", icon: BarChart3 },
  { href: "/app/more", label: "المزيد", icon: LayoutGrid },
];

/** المسارات التابعة لتبويب «المزيد» — يبقى مفعّلاً وأنت داخلها. */
const MORE_PATHS = [
  "/app/more",
  "/app/rewards",
  "/app/compete",
  "/app/doubts",
  "/app/settings",
  "/app/challenge",
];

/**
 * شريط تنقّل سفلي للموبايل (يختفي على الشاشات الأوسع).
 * الطلاب يستخدمون الهاتف بيد واحدة — الأقسام الخمسة الأساسية بمتناول الإبهام.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="التنقّل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-subtle bg-bg-overlay pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active =
            href === "/app/more"
              ? MORE_PATHS.some((p) => pathname.startsWith(p))
              : exact
                ? pathname === href
                : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2 transition-colors",
                active ? "text-brand-400" : "text-text-muted"
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span className="text-secondary leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
