"use client";

import { useMemo, useRef, useState } from "react";
import { Check, X, ChevronLeft, Lightbulb } from "lucide-react";
import type { LocalQuestionItem } from "@/lib/db/dexie";
import type { AttemptResult } from "@/lib/domain/quiz";
import { useAttempts } from "@/hooks/use-attempts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Choice {
  key: string;
  text: string;
}

/** يشغّل مجموعة أسئلة: اختيار → تصحيح فوري + شرح → التالي → إنهاء. */
export function QuestionRunner({
  questions,
  lessonName,
  onFinish,
}: {
  questions: LocalQuestionItem[];
  lessonName?: (lessonId: string | null) => string | undefined;
  onFinish: (results: AttemptResult[]) => void;
}) {
  const { recordAttempt } = useAttempts();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const resultsRef = useRef<AttemptResult[]>([]);
  const startRef = useRef<number>(Date.now());

  const q = questions[idx];
  const choices = useMemo<Choice[]>(
    () => (Array.isArray(q?.choices) ? (q.choices as unknown as Choice[]) : []),
    [q]
  );

  if (!q) return null;

  const isCorrect = submitted && selected === q.correct_answer;

  async function submit() {
    if (selected == null || submitted) return;
    const correct = selected === q.correct_answer;
    const timeSpent = Math.round((Date.now() - startRef.current) / 1000);
    await recordAttempt(q.id, correct, timeSpent);
    resultsRef.current.push({
      lessonId: q.lesson_id,
      lessonName: lessonName?.(q.lesson_id),
      isCorrect: correct,
    });
    setSubmitted(true);
  }

  function next() {
    if (idx + 1 >= questions.length) {
      onFinish(resultsRef.current);
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setSubmitted(false);
    startRef.current = Date.now();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-secondary text-text-secondary">
        <span>
          سؤال {idx + 1} من {questions.length}
        </span>
        {lessonName?.(q.lesson_id) && (
          <span className="text-text-muted">{lessonName(q.lesson_id)}</span>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <p className="text-h3 text-text-primary">{q.question_text}</p>

          <div className="flex flex-col gap-2">
            {choices.map((c) => {
              const chosen = selected === c.key;
              const correctChoice = c.key === q.correct_answer;
              return (
                <button
                  key={c.key}
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelected(c.key)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-input border px-4 py-3 text-start text-body transition-colors",
                    !submitted && chosen && "border-brand-500 bg-bg-raised",
                    !submitted && !chosen && "border-strong hover:border-brand-400",
                    submitted && correctChoice && "border-status-done bg-status-done/10 text-status-done",
                    submitted && chosen && !correctChoice && "border-brand-600 bg-brand-600/10 text-brand-400",
                    submitted && !correctChoice && !chosen && "border-strong opacity-60"
                  )}
                >
                  <span>{c.text}</span>
                  {submitted && correctChoice && <Check className="size-4 shrink-0" aria-hidden />}
                  {submitted && chosen && !correctChoice && <X className="size-4 shrink-0" aria-hidden />}
                </button>
              );
            })}
          </div>

          {/* الشرح بعد التصحيح */}
          {submitted && (
            <div
              className={cn(
                "flex flex-col gap-1 rounded-input border p-4",
                isCorrect ? "border-status-done/40 bg-status-done/5" : "border-strong bg-bg-surface"
              )}
            >
              <span className="flex items-center gap-2 text-secondary font-medium text-brand-400">
                <Lightbulb className="size-4" aria-hidden />
                {isCorrect ? "إجابة صحيحة!" : "شرح الحل"}
              </span>
              <p className="text-body text-text-secondary">{q.explanation_text}</p>
            </div>
          )}

          <div className="flex justify-end">
            {!submitted ? (
              <Button onClick={submit} disabled={selected == null}>
                تحقّق
              </Button>
            ) : (
              <Button onClick={next}>
                {idx + 1 >= questions.length ? "إنهاء الجلسة" : "التالي"}
                <ChevronLeft aria-hidden />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
