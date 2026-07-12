"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Download, Loader2, AlertTriangle } from "lucide-react";
import type { LocalMockExam } from "@/lib/db/dexie";
import { useMockQuestions } from "@/hooks/use-mock-exams";
import { useCurriculum } from "@/hooks/use-curriculum";
import { downloadMockExam } from "@/lib/db/question-bank";
import { scoreMock, type MockQuestion, type MockResult } from "@/lib/domain/quiz";
import { nowISO } from "@/lib/db/ids";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Choice {
  key: string;
  text: string;
}

function fmt(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * تشغيل اختبار محاكاة بزمن حقيقي لا يتوقف + تسليم تلقائي عند انتهاء الوقت
 * (خطة §أ.12).
 */
export function MockRunner({
  exam,
  onFinish,
}: {
  exam: LocalMockExam;
  onFinish: (
    result: MockResult,
    answers: Record<string, string>,
    startedAt: string
  ) => void;
}) {
  const questions = useMockQuestions(exam);
  const { units } = useCurriculum();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(exam.duration_minutes * 60);
  const [downloading, setDownloading] = useState(false);
  const startedAtRef = useRef<string>(nowISO());
  const endRef = useRef<number>(Date.now() + exam.duration_minutes * 60 * 1000);
  const submittedRef = useRef(false);

  const unitName = useMemo(
    () => new Map(units.map((u) => [u.id, u.name_ar])),
    [units]
  );

  const doSubmit = useMemo(
    () =>
      function submit() {
        if (submittedRef.current) return;
        submittedRef.current = true;
        const mq: MockQuestion[] = questions.map((q) => ({
          id: q.id,
          unit_id: q.unit_id,
          unit_name: q.unit_id ? unitName.get(q.unit_id) : undefined,
          correct_answer: q.correct_answer,
        }));
        onFinish(scoreMock(answers, mq), answers, startedAtRef.current);
      },
    [questions, answers, unitName, onFinish]
  );

  // مؤقّت لا يتوقف — تسليم تلقائي عند الوصول للصفر
  useEffect(() => {
    if (questions.length === 0) return;
    const tick = () => {
      const rem = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) doSubmit();
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [questions.length, doSubmit]);

  // محاكاة قاعة الامتحان: تحذير قبل مغادرة الصفحة والاختبار جارٍ
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  async function download() {
    setDownloading(true);
    try {
      await downloadMockExam(exam.id);
    } finally {
      setDownloading(false);
    }
  }

  // الأسئلة غير محمّلة محلياً
  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangle className="size-8 text-brand-400" aria-hidden />
          <p className="text-body text-text-secondary">
            لازم تحمّل أسئلة هذا الاختبار مرة وحدة (وأنت متصل) عشان يشتغل بدون نت.
          </p>
          <Button onClick={download} disabled={downloading}>
            {downloading ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Download aria-hidden />
            )}
            حمّل أسئلة الاختبار
          </Button>
        </CardContent>
      </Card>
    );
  }

  const lowTime = remaining <= 60;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-4">
      {/* مؤقّت ثابت */}
      <div
        className={cn(
          "sticky top-16 z-10 flex items-center justify-between gap-3 rounded-card border px-4 py-3",
          lowTime
            ? "border-brand-500 bg-bg-raised shadow-glow-brand"
            : "border-strong bg-bg-overlay backdrop-blur"
        )}
      >
        <span className="flex items-center gap-2 text-text-secondary">
          <Clock className={cn("size-5", lowTime ? "text-brand-500" : "text-brand-400")} aria-hidden />
          <span className="text-h2 tabular-nums text-text-primary">{fmt(remaining)}</span>
        </span>
        <span className="text-secondary text-text-muted">
          أجبت {answeredCount}/{questions.length}
        </span>
      </div>

      {questions.map((q, i) => {
        const choices = Array.isArray(q.choices)
          ? (q.choices as unknown as Choice[])
          : [];
        return (
          <Card key={q.id}>
            <CardContent className="flex flex-col gap-3 p-5">
              <p className="text-body text-text-primary">
                <span className="text-text-muted">{i + 1}. </span>
                {q.question_text}
              </p>
              <div className="flex flex-col gap-2">
                {choices.map((c) => {
                  const chosen = answers[q.id] === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [q.id]: c.key }))
                      }
                      className={cn(
                        "rounded-input border px-4 py-2.5 text-start text-body transition-colors",
                        chosen
                          ? "border-brand-500 bg-bg-raised text-text-primary"
                          : "border-strong hover:border-brand-400"
                      )}
                    >
                      {c.text}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button size="lg" onClick={doSubmit} className="w-full">
        سلّم الاختبار
      </Button>
    </div>
  );
}
