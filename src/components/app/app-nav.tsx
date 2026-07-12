"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ListTodo,
  CalendarClock,
  HelpCircle,
  Library,
  BarChart3,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/app", label: "اليوم", icon: ListTodo, exact: true },
  { href: "/app/schedule", label: "الجدول", icon: CalendarDays },
  { href: "/app/bank", label: "بنك الأسئلة", icon: Library },
  { href: "/app/progress", label: "التقدّم", icon: BarChart3 },
  { href: "/app/rewards", label: "إنجازي", icon: Sparkles },
  { href: "/app/mock", label: "المحاكاة", icon: FileCheck },
  { href: "/app/exams", label: "العد التنازلي", icon: CalendarClock },
  { href: "/app/doubts", label: "الشكوك", icon: HelpCircle },
];

/** شريط تنقّل أقسام حلقة الاستخدام اليومي. */
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-subtle pb-3">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-pill px-4 py-2 text-secondary transition-colors",
              active
                ? "bg-brand-500 text-text-on-brand"
                : "bg-bg-surface text-text-secondary hover:text-text-primary"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
