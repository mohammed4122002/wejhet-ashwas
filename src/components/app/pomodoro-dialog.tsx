"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, HelpCircle, Check, CircleCheckBig } from "lucide-react";
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
import { nowISO } from "@/lib/db/ids";
import { usePomodoroLog } from "@/hooks/use-pomodoro-log";
import { useDoubts } from "@/hooks/use-doubts";
import type { LocalTask } from "@/lib/db/dexie";

const DEFAULT_FOCUS = 25;
const DEFAULT_BREAK = 5;

function fmt(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const ORDINALS = [
  "",
  "الأولى",
  "الثانية",
  "الثالثة",
  "الرابعة",
  "الخامسة",
  "السادسة",
  "السابعة",
  "الثامنة",
  "التاسعة",
  "العاشرة",
];

/** "الجلسة الثالثة" لصغار الأرقام، و"الجلسة رقم N" لما بعدها. */
function sessionLabel(n: number): string {
  return ORDINALS[n] ? `الجلسة ${ORDINALS[n]}` : `الجلسة رقم ${n}`;
}

/** بومودورو مربوط بمهمة محددة (خطة §أ.6) + صندوق الشكوك الملاصق (خطة §أ.14). */
export function PomodoroDialog({
  task,
  open,
  onOpenChange,
  onComplete,
}: {
  task: LocalTask;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** يُستدعى عند الضغط على "أنهيت المهمة" — يعلّم المهمة تمّت. */
  onComplete?: () => void;
}) {
  const { sessions, totalMinutes, logSession } = usePomodoroLog(task.id);
  const completedSessions = sessions.length;
  const isDone = task.status === "done";

  const [focusMin, setFocusMin] = useState(DEFAULT_FOCUS);
  const [breakMin, setBreakMin] = useState(DEFAULT_BREAK);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(DEFAULT_FOCUS * 60);

  const endRef = useRef<number | null>(null); // طابع نهاية الطور (ms)
  const startedAtRef = useRef<string | null>(null); // بداية طور التركيز (للتسجيل)

  // ضبط المتبقّي عند تغيير المدد وهو متوقّف
  useEffect(() => {
    if (!running) {
      setRemaining((phase === "focus" ? focusMin : breakMin) * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMin, breakMin, phase]);

  // مؤقّت يعتمد الزمن الحقيقي (يصمد أمام خمول التبويب)
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (endRef.current == null) return;
      const rem = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) handlePhaseEnd();
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function start() {
    if (running) return;
    if (phase === "focus" && !startedAtRef.current) {
      startedAtRef.current = nowISO();
    }
    endRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  }

  function pause() {
    setRunning(false);
    endRef.current = null;
  }

  function reset() {
    setRunning(false);
    endRef.current = null;
    startedAtRef.current = null;
    setRemaining((phase === "focus" ? focusMin : breakMin) * 60);
  }

  async function handlePhaseEnd() {
    if (phase === "focus") {
      // سجّل جلسة التركيز المكتملة كوقت فعلي
      await logSession(
        task.id,
        focusMin,
        startedAtRef.current ?? nowISO(),
        nowISO()
      );
      startedAtRef.current = null;
      // انتقل للاستراحة تلقائياً
      setPhase("break");
      setRemaining(breakMin * 60);
      endRef.current = Date.now() + breakMin * 60 * 1000;
      setRunning(true);
    } else {
      // انتهت الاستراحة — توقّف وارجع لطور التركيز
      setRunning(false);
      endRef.current = null;
      setPhase("focus");
      setRemaining(focusMin * 60);
    }
  }

  /** إنهاء المهمة: يسجّل الوقت الجزئي إن وُجد، يعلّم المهمة تمّت، ويغلق. */
  async function finishTask() {
    setRunning(false);
    endRef.current = null;
    // لو كنا بجلسة تركيز جارية، سجّل الدقائق المنقضية حتى الآن
    if (phase === "focus" && startedAtRef.current) {
      const elapsedMin = Math.round((focusMin * 60 - remaining) / 60);
      if (elapsedMin >= 1) {
        await logSession(task.id, elapsedMin, startedAtRef.current, nowISO());
      }
      startedAtRef.current = null;
    }
    onComplete?.();
    onOpenChange(false);
  }

  const currentOrdinal = sessionLabel(completedSessions + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>بومودورو</DialogTitle>
          <DialogDescription>{task.title}</DialogDescription>
        </DialogHeader>

        {/* عدّاد الجلسات: نقاط للمكتملة + النقطة الحالية */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-secondary text-text-secondary">
            {phase === "focus" ? currentOrdinal : "استراحة قصيرة"}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {Array.from({ length: Math.max(completedSessions + 1, 4) }).map((_, i) => {
              const isCompleted = i < completedSessions;
              const isCurrent = i === completedSessions;
              return (
                <span
                  key={i}
                  className={cn(
                    "size-2.5 rounded-full transition-colors",
                    isCompleted
                      ? "bg-brand-500"
                      : isCurrent && running && phase === "focus"
                        ? "bg-brand-400 animate-pulse"
                        : "bg-bg-raised border border-strong"
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* المؤقّت */}
        <div className="flex flex-col items-center gap-4 py-1">
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
              "flex size-44 items-center justify-center rounded-full border-4 tabular-nums",
              running && phase === "focus"
                ? "border-brand-500 shadow-glow-brand"
                : running
                  ? "border-status-done shadow-glow-success"
                  : "border-strong"
            )}
          >
            <span className="text-display text-text-primary">
              {fmt(remaining)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {running ? (
              <Button variant="secondary" onClick={pause}>
                <Pause aria-hidden /> إيقاف مؤقّت
              </Button>
            ) : (
              <Button onClick={start}>
                <Play aria-hidden /> {remaining < focusMin * 60 && phase === "focus" ? "متابعة" : "ابدأ"}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={reset} aria-label="إعادة ضبط">
              <RotateCcw aria-hidden />
            </Button>
          </div>

          {/* إعدادات المدّة (قابلة للتعديل — خطة §أ.6) */}
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

        {/* حصيلة المهمة: جلسات + وقت فعلي */}
        <div className="flex items-center justify-center gap-6 rounded-input border border-subtle bg-bg-surface py-3 text-center">
          <div className="flex flex-col">
            <span className="text-h2 tabular-nums text-text-primary">
              {completedSessions}
            </span>
            <span className="text-secondary text-text-muted">
              {completedSessions === 1 ? "جلسة" : "جلسات"} مكتملة
            </span>
          </div>
          <div className="h-8 w-px bg-bg-raised" />
          <div className="flex flex-col">
            <span className="text-h2 tabular-nums text-text-primary">
              {totalMinutes}
            </span>
            <span className="text-secondary text-text-muted">دقيقة تركيز</span>
          </div>
        </div>

        {/* زر إنهاء المهمة */}
        {!isDone ? (
          <Button
            onClick={finishTask}
            className="w-full bg-status-done text-text-on-brand hover:bg-status-done/90"
          >
            <CircleCheckBig aria-hidden /> أنهيت هذه المهمة
          </Button>
        ) : (
          <p className="flex items-center justify-center gap-2 rounded-input border border-strong bg-status-done/5 py-2.5 text-body text-status-done">
            <CircleCheckBig className="size-4" aria-hidden /> هذه المهمة تمّت
          </p>
        )}

        {/* صندوق الشكوك الملاصق — أقل احتكاك ممكن */}
        <DoubtInline task={task} />
      </DialogContent>
    </Dialog>
  );
}

/** حقل شك سريع (سطر واحد، بدون مودال إضافي) — يحفظ ويرجع فوراً. */
function DoubtInline({ task }: { task: LocalTask }) {
  const { addDoubt } = useDoubts();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    const q = text.trim();
    if (!q) return;
    await addDoubt({
      question_text: q,
      task_id: task.id,
      subject_id: task.subject_id,
      lesson_id: task.lesson_id,
    });
    setText("");
    setSaved(true);
    setExpanded(false);
    window.setTimeout(() => setSaved(false), 2500);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mx-auto inline-flex items-center gap-2 rounded-pill border border-strong px-4 py-2 text-secondary text-accent-copper transition-colors hover:bg-bg-surface"
      >
        <HelpCircle className="size-4" aria-hidden />
        {saved ? "انحفظ شكّك ✓ عندك شك ثاني؟" : "عندك شك؟ سجّله بسرعة وكمّل"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
          if (e.key === "Escape") setExpanded(false);
        }}
        placeholder="اكتب سؤالك بسطر واحد..."
      />
      <Button size="icon" onClick={save} aria-label="حفظ الشك">
        <Check aria-hidden />
      </Button>
    </div>
  );
}
