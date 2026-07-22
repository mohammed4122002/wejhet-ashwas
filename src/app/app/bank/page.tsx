"use client";

import { useState } from "react";
import {
  Download,
  CheckCircle2,
  Play,
  Loader2,
  BookOpen,
  RotateCcw,
  Repeat,
} from "lucide-react";
import { useCurriculum } from "@/hooks/use-curriculum";
import {
  useDownloadedSubjectIds,
  useQuestionCountByLesson,
} from "@/hooks/use-question-bank";
import { useTasks } from "@/hooks/use-tasks";
import { downloadSubjectQuestions } from "@/lib/db/question-bank";
import { getDB, type LocalQuestionItem } from "@/lib/db/dexie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionRunner } from "@/components/app/question-runner";
import { weakestLesson, type AttemptResult } from "@/lib/domain/quiz";
import { todayISO } from "@/lib/db/ids";
import { cn } from "@/lib/utils";

interface PracticeCtx {
  questions: LocalQuestionItem[];
  subjectId: string;
  subjectName: string;
}

export default function BankPage() {
  const { subjects, unitsOf, lessonsOf } = useCurriculum();
  const downloaded = useDownloadedSubjectIds();
  const countByLesson = useQuestionCountByLesson();
  const { addTask } = useTasks();

  const [practice, setPractice] = useState<PracticeCtx | null>(null);
  const [results, setResults] = useState<AttemptResult[] | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(subjectId: string) {
    setError(null);
    setDownloading(subjectId);
    try {
      await downloadSubjectQuestions(subjectId);
    } catch {
      setError("تعذّر التحميل — تأكّد من اتصالك بالإنترنت.");
    } finally {
      setDownloading(null);
    }
  }

  async function startSubject(subjectId: string, subjectName: string) {
    const qs = await getDB()
      .question_bank_items.where("subject_id")
      .equals(subjectId)
      .toArray();
    if (qs.length) {
      setResults(null);
      setPractice({ questions: shuffle(qs), subjectId, subjectName });
    }
  }

  async function startLesson(
    lessonId: string,
    subjectId: string,
    subjectName: string
  ) {
    const qs = await getDB()
      .question_bank_items.where("lesson_id")
      .equals(lessonId)
      .toArray();
    if (qs.length) {
      setResults(null);
      setPractice({ questions: qs, subjectId, subjectName });
    }
  }

  // شاشة الجلسة النشطة
  if (practice && !results) {
    const lessonNameById = new Map(
      subjects.flatMap((s) => unitsOf(s.id)).flatMap((u) => lessonsOf(u.id)).map((l) => [l.id, l.name_ar])
    );
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setPractice(null)}
          className="self-start text-secondary text-text-muted hover:text-text-secondary"
        >
          ← رجوع لبنك الأسئلة
        </button>
        <h1 className="text-h2 text-text-primary">تمرين: {practice.subjectName}</h1>
        <QuestionRunner
          questions={practice.questions}
          lessonName={(id) => (id ? lessonNameById.get(id) : undefined)}
          onFinish={setResults}
        />
      </div>
    );
  }

  // شاشة تحليل نهاية الجلسة
  if (practice && results) {
    const weak = weakestLesson(results);
    const correct = results.filter((r) => r.isCorrect).length;
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1 text-text-primary">انتهت الجلسة</h1>
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <p className="text-body text-text-secondary">
              نتيجتك:{" "}
              <span className="text-text-primary">
                {correct} من {results.length} صحيحة
              </span>
            </p>
            {weak && weak.ratio < 1 && (
              <div className="flex flex-col gap-3 rounded-input border border-strong bg-bg-surface p-4">
                <p className="text-body text-brand-400">
                  أضعف جزئية بهاي الجلسة: {weak.lessonName ?? "—"} (
                  {weak.correct}/{weak.total})
                </p>
                <Button
                  variant="secondary"
                  className="self-start"
                  onClick={() => {
                    void addTask({
                      title: `مراجعة: ${weak.lessonName ?? practice.subjectName}`,
                      task_date: todayISO(),
                      subject_id: practice.subjectId,
                      lesson_id: weak.lessonId,
                      task_type: "review",
                    });
                    setPractice(null);
                    setResults(null);
                  }}
                >
                  <Repeat aria-hidden /> أنشئ مهمة مراجعة عليها
                </Button>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() =>
                  startSubject(practice.subjectId, practice.subjectName)
                }
              >
                <RotateCcw aria-hidden /> أعد التمرين
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setPractice(null);
                  setResults(null);
                }}
              >
                رجوع
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // شاشة التصفّح
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">بنك الأسئلة</h1>
        <p className="text-body text-text-secondary">
          حمّل مادة للعمل بدون نت، وتمرّن على أسئلتها مع شرح الحل.
        </p>
      </header>

      {error && (
        <p className="rounded-input border border-strong bg-bg-surface px-4 py-3 text-secondary text-brand-400">
          {error}
        </p>
      )}

      {subjects.map((s) => {
        const isDownloaded = downloaded.has(s.id);
        const units = unitsOf(s.id);
        const subjectQuestionCount = units
          .flatMap((u) => lessonsOf(u.id))
          .reduce((sum, l) => sum + (countByLesson.get(l.id) ?? 0), 0);

        return (
          <Card key={s.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="size-5 text-brand-400" aria-hidden />
                  {s.name_ar}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isDownloaded ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-status-done/10 px-3 py-1.5 text-secondary text-status-done">
                        <CheckCircle2 className="size-4" aria-hidden />
                        محمّلة ({subjectQuestionCount})
                      </span>
                      {subjectQuestionCount > 0 && (
                        <Button size="sm" onClick={() => startSubject(s.id, s.name_ar)}>
                          <Play aria-hidden /> تمرين شامل
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={downloading === s.id}
                      onClick={() => download(s.id)}
                    >
                      {downloading === s.id ? (
                        <Loader2 className="animate-spin" aria-hidden />
                      ) : (
                        <Download aria-hidden />
                      )}
                      حمّل للعمل بدون نت
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {isDownloaded && subjectQuestionCount > 0 && (
              <CardContent className="flex flex-col gap-3">
                {units.map((u) => {
                  const lessons = lessonsOf(u.id).filter(
                    (l) => (countByLesson.get(l.id) ?? 0) > 0
                  );
                  if (lessons.length === 0) return null;
                  return (
                    <div key={u.id} className="flex flex-col gap-1.5">
                      <h3 className="text-h3 text-text-secondary">{u.name_ar}</h3>
                      <div className="flex flex-wrap gap-2">
                        {lessons.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => startLesson(l.id, s.id, s.name_ar)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-pill border border-strong bg-bg-surface px-3 py-1.5 text-secondary text-text-primary transition-colors hover:border-brand-400"
                            )}
                          >
                            {l.name_ar}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/** خلط بسيط (Fisher–Yates) لتنويع ترتيب الأسئلة. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
