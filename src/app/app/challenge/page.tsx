"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Timer, Trophy, RotateCcw, Zap, Check, X } from "lucide-react";
import { getDB, type LocalQuestionItem } from "@/lib/db/dexie";
import { useAttempts } from "@/hooks/use-attempts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fireTaskComplete } from "@/lib/confetti";
import { cn } from "@/lib/utils";

const CHALLENGE_SECONDS = 30;

type Phase = "loading" | "ready" | "running" | "result";

interface Choice {
  key: string;
  text: string;
}

export default function DailyChallengePage() {
  const { recordAttempt } = useAttempts();
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<LocalQuestionItem | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [timer, setTimer] = useState(CHALLENGE_SECONDS);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQuestion = useCallback(async () => {
    setPhase("loading");
    setSelected(null);
    setIsCorrect(null);
    setTimer(CHALLENGE_SECONDS);

    const db = getDB();
    const count = await db.question_bank_items.count();
    if (count === 0) {
      setPhase("ready");
      setQuestion(null);
      return;
    }
    const allIds = await db.question_bank_items.toCollection().primaryKeys();
    const randomIdx = Math.floor(Math.random() * allIds.length);
    const q = await db.question_bank_items.get(allIds[randomIdx]);
    if (q) {
      setQuestion(q);
      setChoices(Array.isArray(q.choices) ? (q.choices as unknown as Choice[]) : []);
    }
    setPhase("ready");
  }, []);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  useEffect(() => {
    const stored = localStorage.getItem("wejhet_challenge_streak");
    const data = stored ? JSON.parse(stored) : null;
    const today = new Date().toISOString().split("T")[0];
    if (data?.date === today) {
      setStreak(data.count);
    }
  }, []);

  function startTimer() {
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function handleTimeout() {
    setIsCorrect(false);
    setPhase("result");
  }

  async function handleAnswer(key: string) {
    if (phase !== "running" || selected) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSelected(key);
    const correct = key === question?.correct_answer;
    setIsCorrect(correct);
    setPhase("result");

    if (question) {
      const timeSpent = CHALLENGE_SECONDS - timer;
      await recordAttempt(question.id, correct, timeSpent);
    }

    if (correct) {
      const today = new Date().toISOString().split("T")[0];
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem(
        "wejhet_challenge_streak",
        JSON.stringify({ date: today, count: newStreak })
      );
      void fireTaskComplete();
    }
  }

  function nextChallenge() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    loadQuestion();
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!question && phase !== "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <Zap className="size-12 text-text-muted" />
        <h1 className="text-h1 text-text-primary">التحدي اليومي</h1>
        <p className="text-body text-text-secondary">
          لا توجد أسئلة محمّلة بعد. حمّل أسئلة مادة من البنك أولاً!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-text-primary">التحدي اليومي</h1>
          <p className="text-secondary text-text-secondary">
            سؤال عشوائي — 30 ثانية فقط!
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 rounded-pill bg-accent-copper/10 px-3 py-1.5">
            <Trophy className="size-4 text-accent-copper" aria-hidden />
            <span className="text-secondary font-medium text-accent-copper">
              {streak} صح اليوم
            </span>
          </div>
        )}
      </header>

      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          {/* المؤقّت */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer
                className={cn(
                  "size-5",
                  timer <= 10 && phase === "running"
                    ? "text-status-overdue animate-pulse"
                    : "text-text-muted"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "text-h2 tabular-nums",
                  timer <= 10 && phase === "running"
                    ? "text-status-overdue"
                    : "text-text-primary"
                )}
              >
                {timer}s
              </span>
            </div>
            {phase === "ready" && (
              <Button onClick={startTimer} size="sm">
                ابدأ التحدي
              </Button>
            )}
          </div>

          {/* نص السؤال */}
          {question && (
            <p className="text-body text-text-primary leading-relaxed">
              {question.question_text}
            </p>
          )}

          {/* الخيارات */}
          <div className="flex flex-col gap-2">
            {choices.map((c) => {
              const isThis = selected === c.key;
              const isAnswer = question?.correct_answer === c.key;
              const showResult = phase === "result";

              return (
                <button
                  key={c.key}
                  type="button"
                  disabled={phase !== "running"}
                  onClick={() => handleAnswer(c.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-input border px-4 py-3 text-start transition-all",
                    showResult && isAnswer
                      ? "border-status-done bg-status-done/10"
                      : showResult && isThis && !isAnswer
                        ? "border-status-overdue bg-status-overdue/10"
                        : phase === "running"
                          ? "border-subtle hover:border-brand-500/40 hover:bg-bg-raised"
                          : "border-subtle opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md border text-secondary font-medium",
                      showResult && isAnswer
                        ? "border-status-done bg-status-done text-text-on-brand"
                        : showResult && isThis && !isAnswer
                          ? "border-status-overdue bg-status-overdue text-text-on-brand"
                          : "border-strong"
                    )}
                  >
                    {showResult && isAnswer ? (
                      <Check className="size-4" />
                    ) : showResult && isThis && !isAnswer ? (
                      <X className="size-4" />
                    ) : (
                      c.key
                    )}
                  </span>
                  <span className="text-body text-text-primary">{c.text}</span>
                </button>
              );
            })}
          </div>

          {/* النتيجة */}
          {phase === "result" && (
            <div className="flex flex-col gap-3">
              <div
                className={cn(
                  "rounded-card px-4 py-3 text-center",
                  isCorrect
                    ? "bg-status-done/10 text-status-done"
                    : "bg-status-overdue/10 text-status-overdue"
                )}
              >
                <p className="text-h3">
                  {isCorrect
                    ? "أحسنت! إجابة صحيحة"
                    : timer === 0
                      ? "انتهى الوقت!"
                      : "إجابة خاطئة — لا بأس، حاول مرة أخرى"}
                </p>
              </div>

              {question?.explanation_text && (
                <div className="rounded-card border border-subtle bg-bg-surface p-4">
                  <p className="text-secondary text-text-secondary">
                    {question.explanation_text}
                  </p>
                </div>
              )}

              <Button onClick={nextChallenge} className="gap-2">
                <RotateCcw className="size-4" aria-hidden />
                تحدٍّ جديد
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
