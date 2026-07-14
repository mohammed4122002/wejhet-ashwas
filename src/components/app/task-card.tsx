"use client";

import { useState } from "react";
import { Timer, RefreshCw, Trash2, Repeat, Clock } from "lucide-react";
import type { LocalTask } from "@/lib/db/dexie";
import type { TaskStatus } from "@/lib/supabase/database.types";
import { Card } from "@/components/ui/card";
import { TaskStatusControl } from "./task-status-control";
import { PomodoroDialog } from "./pomodoro-dialog";
import { usePomodoroLog } from "@/hooks/use-pomodoro-log";
import { cn } from "@/lib/utils";

export function TaskCard({
  task,
  subjectName,
  timeLabel,
  onStatusChange,
  onPostpone,
  onDelete,
}: {
  task: LocalTask;
  subjectName?: string;
  /** وقت الفترة من الجدول (HH:MM) — يُظهر المهمة بمكانها من اليوم الفعلي. */
  timeLabel?: string;
  onStatusChange: (task: LocalTask, next: TaskStatus) => void;
  onPostpone?: (task: LocalTask) => void;
  onDelete?: (id: string) => void;
}) {
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const isReview = task.task_type === "review";
  const isDone = task.status === "done";

  return (
    <Card className={cn("flex flex-col gap-3 p-4", isDone && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {timeLabel && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-bg-raised px-2 py-0.5 text-secondary tabular-nums text-text-secondary">
                <Clock className="size-3" aria-hidden />
                {timeLabel}
              </span>
            )}
            {isReview && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-accent-copper/10 px-2 py-0.5 text-secondary text-accent-copper">
                <Repeat className="size-3" aria-hidden />
                مراجعة
              </span>
            )}
            <h3
              className={cn(
                "text-h3 text-text-primary",
                isDone && "line-through"
              )}
            >
              {task.title}
            </h3>
          </div>
          {subjectName && (
            <span className="text-secondary text-text-muted">{subjectName}</span>
          )}
        </div>
        <TaskStatusControl
          status={task.status}
          onChange={(next) => onStatusChange(task, next)}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPomodoroOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-pill bg-bg-raised px-3 py-1.5 text-secondary text-text-secondary transition-colors hover:text-brand-400"
        >
          <Timer className="size-4" aria-hidden />
          بومودورو
        </button>

        <TaskTimeSummary taskId={task.id} />

        {onPostpone && (
          <button
            type="button"
            onClick={() => onPostpone(task)}
            className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-secondary text-text-muted transition-colors hover:text-text-secondary"
          >
            <RefreshCw className="size-4" aria-hidden />
            أجّلها لليوم
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-secondary text-text-muted transition-colors hover:text-brand-400"
          >
            <Trash2 className="size-4" aria-hidden />
            حذف
          </button>
        )}
      </div>

      {pomodoroOpen && (
        <PomodoroDialog
          task={task}
          open={pomodoroOpen}
          onOpenChange={setPomodoroOpen}
          onComplete={() => onStatusChange(task, "done")}
        />
      )}
    </Card>
  );
}

/** ملخّص الوقت الفعلي والجلسات للمهمة (يظهر فقط بعد أول جلسة). */
function TaskTimeSummary({ taskId }: { taskId: string }) {
  const { totalMinutes, sessions } = usePomodoroLog(taskId);
  if (sessions.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-secondary text-text-muted">
      <Clock className="size-3.5" aria-hidden />
      {totalMinutes} دقيقة · {sessions.length}{" "}
      {sessions.length === 1 ? "جلسة" : "جلسات"}
    </span>
  );
}
