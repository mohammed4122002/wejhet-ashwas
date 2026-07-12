"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  Compass,
  Rocket,
} from "lucide-react";
import { useSchedule } from "@/hooks/use-schedule";
import { useDailyStats } from "@/hooks/use-daily-stats";
import { useHeatmap } from "@/hooks/use-heatmap";
import { useDoubts } from "@/hooks/use-doubts";
import { useDownloadedSubjectIds } from "@/hooks/use-question-bank";
import { useTasks } from "@/hooks/use-tasks";
import {
  nextStep,
  buildChecklist,
  checklistComplete,
} from "@/lib/domain/next-step";
import { masteryRatio } from "@/lib/domain/heatmap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * لوحة الإرشاد التربوي:
 * - طالب جديد ← «خارطة البداية» (4 خطوات تأسيسية).
 * - بعد اكتمالها ← «الخطوة التالية» — توصية واحدة ذكية حسب حالته.
 */
export function GuidePanel() {
  const { slots } = useSchedule();
  const stats = useDailyStats();
  const { progress } = useHeatmap();
  const { unresolved } = useDoubts();
  const downloaded = useDownloadedSubjectIds();
  const { carryOver } = useTasks();

  const checklist = buildChecklist({
    hasSchedule: slots.length > 0,
    completedTasks: stats.completedTasks,
    pomodoroCount: stats.pomodoroCount,
    hasDownloadedQuestions: downloaded.size > 0,
  });

  // ===== طالب جديد: خارطة البداية =====
  if (!checklistComplete(checklist)) {
    const doneCount = checklist.filter((i) => i.done).length;
    return (
      <Card className="border-brand-500/40">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-h3 text-text-primary">
              <Rocket className="size-5 text-brand-400" aria-hidden />
              خارطة بدايتك
            </span>
            <span className="rounded-pill bg-bg-raised px-3 py-1 text-secondary tabular-nums text-text-secondary">
              {doneCount}/{checklist.length}
            </span>
          </div>

          {/* شريط تقدّم الخارطة */}
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-bg-raised">
            <div
              className="h-full rounded-pill bg-brand-500 transition-all"
              style={{ width: `${(doneCount / checklist.length) * 100}%` }}
            />
          </div>

          <ul className="flex flex-col gap-1">
            {checklist.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-input px-3 py-2.5 transition-colors",
                    item.done
                      ? "text-text-muted"
                      : "text-text-primary hover:bg-bg-raised"
                  )}
                >
                  <span className="flex items-center gap-2.5 text-body">
                    {item.done ? (
                      <CheckCircle2 className="size-5 shrink-0 text-status-done" aria-hidden />
                    ) : (
                      <Circle className="size-5 shrink-0 text-status-todo" aria-hidden />
                    )}
                    <span className={cn(item.done && "line-through")}>
                      {item.label}
                    </span>
                  </span>
                  {!item.done && (
                    <ChevronLeft className="size-4 shrink-0 text-brand-400" aria-hidden />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  // ===== طالب مستمر: الخطوة التالية الذكية =====
  const started = [...progress.values()].filter(
    (u) => u.totalLessons > 0 && u.masteredLessons > 0 && masteryRatio(u) < 1
  );
  const weakest = started.length
    ? started.reduce((a, b) => (masteryRatio(a) <= masteryRatio(b) ? a : b))
    : null;

  const step = nextStep({
    hasSchedule: slots.length > 0,
    overdue: carryOver.length,
    todayTodo: stats.todayTotal - stats.todayDone,
    todayDone: stats.todayDone,
    weakestStartedUnit: weakest
      ? { unitName: weakest.unitName, ratio: masteryRatio(weakest) }
      : null,
    unresolvedDoubts: unresolved.length,
    hasDownloadedQuestions: downloaded.size > 0,
  });

  return (
    <Card className="border-brand-500/40">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-secondary text-brand-400">
            <Compass className="size-4" aria-hidden />
            الخطوة التالية المقترحة
          </span>
          <span className="text-h3 text-text-primary">{step.title}</span>
          <span className="text-secondary text-text-secondary">
            {step.description}
          </span>
        </div>
        <Button asChild className="shrink-0 self-start sm:self-center">
          <Link href={step.href}>{step.cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
