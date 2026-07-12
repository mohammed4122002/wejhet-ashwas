"use client";

import { useMemo, useState } from "react";
import { FileCheck, Clock, Play, Repeat, Trophy } from "lucide-react";
import { useMockExams, useMockAttempts } from "@/hooks/use-mock-exams";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useTasks } from "@/hooks/use-tasks";
import { MockRunner } from "@/components/app/mock-runner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LocalMockExam } from "@/lib/db/dexie";
import type { MockResult } from "@/lib/domain/quiz";
import { todayISO } from "@/lib/db/ids";
import { cn } from "@/lib/utils";

interface FinishedState {
  exam: LocalMockExam;
  result: MockResult;
}

export default function MockPage() {
  const exams = useMockExams();
  const { subjects } = useCurriculum();
  const { saveAttempt } = useMockAttempts();
  const { addTask } = useTasks();

  const [instructions, setInstructions] = useState<LocalMockExam | null>(null);
  const [taking, setTaking] = useState<LocalMockExam | null>(null);
  const [finished, setFinished] = useState<FinishedState | null>(null);

  const subjectName = useMemo(() => {
    const m = new Map(subjects.map((s) => [s.id, s.name_ar]));
    return (id: string | null) => (id ? m.get(id) : undefined);
  }, [subjects]);

  // شاشة التعليمات — مثل غلاف ورقة الامتحان الحقيقية
  if (instructions && !taking && !finished) {
    const exam = instructions;
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="flex flex-col items-center gap-1 text-center">
          <span className="text-secondary text-text-muted">اختبار محاكاة</span>
          <h1 className="text-h1 text-text-primary">{exam.title}</h1>
          <p className="text-body text-text-secondary">
            {subjectName(exam.subject_id) ?? ""} · {exam.question_ids.length} سؤال ·{" "}
            {exam.duration_minutes} دقيقة
          </p>
        </header>

        <Card className="border-brand-500/40">
          <CardHeader>
            <CardTitle className="text-h3">تعليمات الاختبار — اقرأها كأنك بالقاعة</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-body text-text-secondary">
              <li className="flex gap-2">
                <span className="text-brand-400">١.</span>
                المؤقّت حقيقي ولا يتوقّف إطلاقاً — تماماً كقاعة الامتحان.
              </li>
              <li className="flex gap-2">
                <span className="text-brand-400">٢.</span>
                عند انتهاء الوقت يُسلَّم الاختبار تلقائياً بما أجبت.
              </li>
              <li className="flex gap-2">
                <span className="text-brand-400">٣.</span>
                جهّز ورقة وقلماً للمسودة، وضع هاتفك بوضع عدم الإزعاج.
              </li>
              <li className="flex gap-2">
                <span className="text-brand-400">٤.</span>
                لا يمكن تعديل الإجابات بعد التسليم — راجِع قبل ما تسلّم.
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              setTaking(exam);
              setInstructions(null);
            }}
          >
            أنا جاهز — ابدأ الآن
          </Button>
          <Button variant="secondary" onClick={() => setInstructions(null)}>
            رجوع
          </Button>
        </div>
      </div>
    );
  }

  // شاشة الاختبار الجاري
  if (taking && !finished) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 text-text-primary">{taking.title}</h1>
        <MockRunner
          exam={taking}
          onFinish={(result, answers, startedAt) => {
            void saveAttempt(taking.id, answers, result.scorePercent, startedAt);
            setFinished({ exam: taking, result });
          }}
        />
      </div>
    );
  }

  // شاشة النتيجة المفصّلة
  if (finished) {
    const { exam, result } = finished;
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1 text-text-primary">نتيجة الاختبار</h1>
        <Card className={cn(result.scorePercent >= 50 && "shadow-glow-success")}>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <Trophy
              className={cn(
                "size-10",
                result.scorePercent >= 50 ? "text-status-done" : "text-brand-400"
              )}
              aria-hidden
            />
            <span className="text-display text-text-primary">
              {result.scorePercent}%
            </span>
            <p className="text-body text-text-secondary">
              {result.correct} إجابة صحيحة من {result.total}
            </p>
          </CardContent>
        </Card>

        {/* تحليل الضعف بالوحدة + مهام مراجعة مقترحة */}
        {result.weaknessByUnit.some((u) => u.ratio < 1) && (
          <section className="flex flex-col gap-3">
            <h2 className="text-h2 text-text-primary">أين تحتاج مراجعة؟</h2>
            {result.weaknessByUnit
              .filter((u) => u.ratio < 1)
              .map((u) => (
                <Card key={u.unitId} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex flex-col">
                    <span className="text-body text-text-primary">
                      {u.unitName ?? "وحدة"}
                    </span>
                    <span className="text-secondary tabular-nums text-text-muted">
                      {u.correct}/{u.total} · {Math.round(u.ratio * 100)}%
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      void addTask({
                        title: `مراجعة وحدة: ${u.unitName ?? ""}`.trim(),
                        task_date: todayISO(),
                        subject_id: exam.subject_id,
                        task_type: "review",
                      })
                    }
                  >
                    <Repeat aria-hidden /> مهمة مراجعة
                  </Button>
                </Card>
              ))}
          </section>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => {
              setFinished(null);
              setTaking(exam);
            }}
          >
            <Play aria-hidden /> أعد الاختبار
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFinished(null);
              setTaking(null);
            }}
          >
            رجوع للقائمة
          </Button>
        </div>
      </div>
    );
  }

  // قائمة الاختبارات
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">اختبارات المحاكاة</h1>
        <p className="text-body text-text-secondary">
          بزمن حقيقي مثل الامتحان — المؤقّت لا يتوقف، والتسليم تلقائي عند انتهاء
          الوقت.
        </p>
      </header>

      {exams.length > 0 ? (
        exams.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="size-5 text-brand-400" aria-hidden />
                  {e.title}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-secondary text-text-secondary">
                    <Clock className="size-4" aria-hidden />
                    {e.duration_minutes} دقيقة
                  </span>
                  <Button size="sm" onClick={() => setInstructions(e)}>
                    <Play aria-hidden /> ابدأ الاختبار
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-secondary text-text-muted">
                {subjectName(e.subject_id) ?? "—"} · {e.question_ids.length} سؤال
              </p>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <FileCheck className="size-8 text-text-muted" aria-hidden />
            <p className="text-body text-text-secondary">
              لا توجد اختبارات محاكاة متاحة لموادك بعد.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
