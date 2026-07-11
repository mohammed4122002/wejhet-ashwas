"use client";

import { Circle, CircleDot, CheckCircle2 } from "lucide-react";
import type { TaskStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

/** ترتيب دورة الحالة عند الضغط: لسا ← قيد الدراسة ← تمّت ← لسا. */
const NEXT: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

const META: Record<
  TaskStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  todo: {
    label: "لسا",
    icon: Circle,
    className: "bg-status-todo/10 text-status-todo",
  },
  in_progress: {
    label: "قيد الدراسة",
    icon: CircleDot,
    className: "bg-status-progress/10 text-status-progress",
  },
  done: {
    label: "تمّت",
    icon: CheckCircle2,
    className: "bg-status-done/10 text-status-done",
  },
};

/** شارة حالة قابلة للضغط تدوّر بين الحالات الثلاث (خطة §أ.4، design.md §6). */
export function TaskStatusControl({
  status,
  onChange,
}: {
  status: TaskStatus;
  onChange: (next: TaskStatus) => void;
}) {
  const meta = META[status];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={() => onChange(NEXT[status])}
      className={cn(
        "inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-secondary font-medium transition-colors",
        meta.className
      )}
      aria-label={`الحالة: ${meta.label} — اضغط للتغيير`}
    >
      <Icon className="size-4" aria-hidden />
      {meta.label}
    </button>
  );
}
