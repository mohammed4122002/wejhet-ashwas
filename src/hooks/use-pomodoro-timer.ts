"use client";

import { useEffect, useRef, useState } from "react";
import { nowISO } from "@/lib/db/ids";

const DEFAULT_FOCUS = 25;
const DEFAULT_BREAK = 5;

export type PomodoroPhase = "focus" | "break";

export interface PomodoroSessionLog {
  type: PomodoroPhase;
  durationMinutes: number;
  startedAt: string;
  endedAt: string;
}

/**
 * محرّك مؤقّت بومودورو (تركيز/استراحة بالتناوب) — مستخرج من PomodoroDialog
 * الأصلي ليُستخدم من جلسة مربوطة بمهمة وجلسة عامة معاً بنفس المنطق بالضبط.
 * يعتمد الزمن الحقيقي (Date.now()) لا عدّاد تنازلي بسيط، فيصمد أمام خمول
 * التبويب. `onSessionEnd` يُستدعى عند اكتمال كل طور طبيعياً؛ الاستدعاء لا
 * يقرّر شيئاً عن المهمة أو التخزين — هذا مسؤولية المكوّن المستهلك.
 */
export function usePomodoroTimer(
  onSessionEnd: (log: PomodoroSessionLog) => void | Promise<void>
) {
  const [focusMin, setFocusMin] = useState(DEFAULT_FOCUS);
  const [breakMin, setBreakMin] = useState(DEFAULT_BREAK);
  const [phase, setPhase] = useState<PomodoroPhase>("focus");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(DEFAULT_FOCUS * 60);

  const endRef = useRef<number | null>(null); // طابع نهاية الطور الجاري (ms)
  const startedAtRef = useRef<string | null>(null); // بداية الطور الجاري (للتسجيل)

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
      if (rem <= 0) void handlePhaseEnd();
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function start() {
    if (running) return;
    if (!startedAtRef.current) startedAtRef.current = nowISO();
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
    const plannedMin = phase === "focus" ? focusMin : breakMin;
    await onSessionEnd({
      type: phase,
      durationMinutes: plannedMin,
      startedAt: startedAtRef.current ?? nowISO(),
      endedAt: nowISO(),
    });

    const nextPhase: PomodoroPhase = phase === "focus" ? "break" : "focus";
    const nextDurationSec = (nextPhase === "focus" ? focusMin : breakMin) * 60;
    setPhase(nextPhase);
    setRemaining(nextDurationSec);

    if (nextPhase === "break") {
      // الاستراحة تبلّش تلقائياً بعد التركيز مباشرة
      startedAtRef.current = nowISO();
      endRef.current = Date.now() + nextDurationSec * 1000;
      setRunning(true);
    } else {
      // انتهت الاستراحة — يرجع لطور التركيز متوقّفاً، القرار للطالب يبلّش
      startedAtRef.current = null;
      setRunning(false);
      endRef.current = null;
    }
  }

  /** إنهاء الطور الجاري قبل اكتماله: يسجّل الوقت الفعلي المنقضي لو دقيقة فأكثر. */
  async function finishEarly() {
    setRunning(false);
    endRef.current = null;
    if (startedAtRef.current) {
      const plannedSec = (phase === "focus" ? focusMin : breakMin) * 60;
      const elapsedMin = Math.round((plannedSec - remaining) / 60);
      if (elapsedMin >= 1) {
        await onSessionEnd({
          type: phase,
          durationMinutes: elapsedMin,
          startedAt: startedAtRef.current,
          endedAt: nowISO(),
        });
      }
      startedAtRef.current = null;
    }
  }

  return {
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
  };
}
