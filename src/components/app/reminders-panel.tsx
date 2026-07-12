"use client";

import { useEffect } from "react";
import { BookMarked, Sparkles, Moon } from "lucide-react";
import { useReminders } from "@/hooks/use-reminders";
import type { ReminderLayer } from "@/lib/domain/reminders";
import { showNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const LAYER_META: Record<
  ReminderLayer,
  { icon: typeof BookMarked; className: string }
> = {
  study: { icon: BookMarked, className: "text-brand-400" },
  motivational: { icon: Sparkles, className: "text-accent-gold" },
  religious: { icon: Moon, className: "text-accent-copper" },
};

/** لوحة التذكيرات داخل التطبيق + إشعار متصفّح لمرّة واحدة بالجلسة. */
export function RemindersPanel() {
  const reminders = useReminders();

  // إشعار متصفّح واحد لأهم تذكير دراسي (مرة كل جلسة)
  useEffect(() => {
    const study = reminders.find((r) => r.layer === "study");
    if (!study) return;
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem("notified") === "1") return;
    sessionStorage.setItem("notified", "1");
    showNotification("وجهة أشوس", study.text);
  }, [reminders]);

  if (reminders.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      {reminders.map((r) => {
        const meta = LAYER_META[r.layer];
        const Icon = meta.icon;
        return (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-card border border-strong bg-bg-surface px-4 py-3"
          >
            <Icon className={cn("size-5 shrink-0", meta.className)} aria-hidden />
            <span className="text-body text-text-secondary">{r.text}</span>
          </div>
        );
      })}
    </section>
  );
}
