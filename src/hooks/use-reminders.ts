"use client";

import { useTasks } from "@/hooks/use-tasks";
import { useDoubts } from "@/hooks/use-doubts";
import { usePrefs } from "@/hooks/use-prefs";
import { buildReminders, type ReminderItem } from "@/lib/domain/reminders";

/** تذكيرات داخل التطبيق مبنية من حالة المهام والشكوك، مفلترة حسب الإعدادات. */
export function useReminders(): ReminderItem[] {
  const { tasksForDate, carryOver } = useTasks();
  const { unresolved } = useDoubts();
  const { reminders } = usePrefs();

  return buildReminders({
    todayTodo: tasksForDate.filter((t) => t.status !== "done").length,
    overdue: carryOver.length,
    doneToday: tasksForDate.filter((t) => t.status === "done").length,
    unresolvedDoubts: unresolved.length,
    flags: reminders,
  });
}
