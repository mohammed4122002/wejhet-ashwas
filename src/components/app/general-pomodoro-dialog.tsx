"use client";

import { Play, Pause, RotateCcw, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer";
import { usePomodoroLog, useTodayPomodoroStats } from "@/hooks/use-pomodoro-log";
import { fmt, DoubtInline } from "@/components/app/pomodoro-dialog";

/**
 * جلسة بومودورو عامة — بلا مهمة محدّدة، لطالب بدّه يركّز الآن بدون ما يمرّ
 * أولاً بإضافة/اختيار مهمة. تُسجَّل بنفس جدول pomodoro_sessions بـ task_id
 * فارغ، فتُحتسب تلقائياً ضمن "دقيقة تركيز" وشارات البومودورو بالصفحة الرئيسية.
 */
export function GeneralPomodoroDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { logSession } = usePomodoroLog();
  const { focusCount, breakCount, focusMinutes } = useTodayPomodoroStats();

  const {
    focusMin,
    setFocusMin,
    breakMin,
    setBreakMin,
    phase,
    running,
    remaining,
    start,
    pause,
    reset,
    finishEarly,
  } = usePomodoroTimer((log) =>
    logSession(null, log.type, log.durationMinutes, log.startedAt, log.endedAt)
  );

  async function endSession() {
    await finishEarly();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3">
        <DialogHeader>
          <DialogTitle>جلسة تركيز عامة</DialogTitle>
          <DialogDescription>بدون مهمة محدّدة — ركّز بس، وسجّل تلقائياً.</DialogDescription>
        </DialogHeader>

        {/* المؤقّت */}
        <div className="flex flex-col items-center gap-3">
          <span
            className={cn(
              "text-secondary rounded-pill px-3 py-1",
              phase === "focus"
                ? "bg-status-progress/10 text-brand-400"
                : "bg-status-done/10 text-status-done"
            )}
          >
            {phase === "focus" ? "وقت التركيز" : "استراحة"}
          </span>

          <div
            className={cn(
              "flex size-40 items-center justify-center rounded-full border-4 tabular-nums",
              running && phase === "focus"
                ? "border-brand-500 shadow-glow-brand"
                : running
                  ? "border-status-done shadow-glow-success"
                  : "border-strong"
            )}
          >
            <span className="text-display text-text-primary">{fmt(remaining)}</span>
          </div>

          <div className="flex items-center gap-3">
            {running ? (
              <Button variant="secondary" onClick={pause}>
                <Pause aria-hidden /> إيقاف مؤقّت
              </Button>
            ) : (
              <Button onClick={start}>
                <Play aria-hidden />{" "}
                {remaining < focusMin * 60 && phase === "focus" ? "متابعة" : "ابدأ"}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={reset} aria-label="إعادة ضبط">
              <RotateCcw aria-hidden />
            </Button>
          </div>

          {!running && (
            <div className="flex items-center gap-4 text-secondary text-text-secondary">
              <label className="flex items-center gap-2">
                تركيز
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={focusMin}
                  onChange={(e) => setFocusMin(Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 w-16 text-center"
                />
              </label>
              <label className="flex items-center gap-2">
                استراحة
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={breakMin}
                  onChange={(e) => setBreakMin(Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 w-16 text-center"
                />
              </label>
            </div>
          )}
        </div>

        {/* حصيلة اليوم: جلسات تركيز + استراحات + دقائق (كل الجلسات، مربوطة بمهام أو عامة) */}
        <div className="flex items-center justify-center gap-4 rounded-input border border-subtle bg-bg-surface py-3 text-center">
          <div className="flex flex-col">
            <span className="text-h2 tabular-nums text-text-primary">{focusCount}</span>
            <span className="text-secondary text-text-muted">جلسات دراسة اليوم</span>
          </div>
          <div className="h-8 w-px bg-bg-raised" />
          <div className="flex flex-col">
            <span className="text-h2 tabular-nums text-text-primary">{breakCount}</span>
            <span className="text-secondary text-text-muted">استراحات اليوم</span>
          </div>
          <div className="h-8 w-px bg-bg-raised" />
          <div className="flex flex-col">
            <span className="text-h2 tabular-nums text-text-primary">{focusMinutes}</span>
            <span className="text-secondary text-text-muted">دقيقة تركيز</span>
          </div>
        </div>

        <Button variant="secondary" onClick={endSession} className="w-full">
          <Square aria-hidden /> إنهاء الجلسة
        </Button>

        {/* صندوق الشكوك الملاصق — بلا ربط بمهمة */}
        <DoubtInline />
      </DialogContent>
    </Dialog>
  );
}
