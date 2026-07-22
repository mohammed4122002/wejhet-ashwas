"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface Subject {
  id: string;
  name_ar: string;
  slug: string;
  track: string;
  order_index: number;
}
interface Unit {
  id: string;
  subject_id: string;
  name_ar: string;
  order_index: number;
}
interface Lesson {
  id: string;
  unit_id: string;
  name_ar: string;
  order_index: number;
}

interface Choice {
  key: string;
  text: string;
}

const EMPTY_CHOICES: Choice[] = [
  { key: "أ", text: "" },
  { key: "ب", text: "" },
  { key: "ج", text: "" },
  { key: "د", text: "" },
];

type Difficulty = "easy" | "medium" | "hard" | "";
type Source = "past_exam" | "practice" | "";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [subjectId, setSubjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState<Choice[]>(EMPTY_CHOICES.map((c) => ({ ...c })));
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanationText, setExplanationText] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("");
  const [source, setSource] = useState<Source>("");
  const [examYear, setExamYear] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/questions");
      if (res.status === 403) {
        setError("ليس لديك صلاحيات الإدارة.");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("فشل تحميل البيانات");
      const data = await res.json();
      setSubjects(data.subjects);
      setUnits(data.units);
      setLessons(data.lessons);
      setTotalQuestions(data.totalQuestions);
    } catch {
      setError("فشل الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filteredUnits = units.filter((u) => u.subject_id === subjectId);
  const filteredLessons = lessons.filter((l) => l.unit_id === unitId);

  function handleSubjectChange(id: string) {
    setSubjectId(id);
    setUnitId("");
    setLessonId("");
  }

  function handleUnitChange(id: string) {
    setUnitId(id);
    setLessonId("");
  }

  function updateChoice(index: number, text: string) {
    setChoices((prev) => prev.map((c, i) => (i === index ? { ...c, text } : c)));
  }

  function resetForm() {
    setQuestionText("");
    setChoices(EMPTY_CHOICES.map((c) => ({ ...c })));
    setCorrectAnswer("");
    setExplanationText("");
    setDifficulty("");
    setSource("");
    setExamYear("");
  }

  async function handleSave() {
    if (!subjectId || !unitId || !lessonId) {
      setToast({ type: "error", msg: "اختر المادة والوحدة والدرس" });
      return;
    }
    if (!questionText.trim()) {
      setToast({ type: "error", msg: "اكتب نص السؤال" });
      return;
    }
    const filledChoices = choices.filter((c) => c.text.trim());
    if (filledChoices.length < 2) {
      setToast({ type: "error", msg: "أدخل خيارين على الأقل" });
      return;
    }
    if (!correctAnswer) {
      setToast({ type: "error", msg: "اختر الإجابة الصحيحة" });
      return;
    }
    if (!explanationText.trim()) {
      setToast({ type: "error", msg: "اكتب شرح الحل" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        subject_id: subjectId,
        unit_id: unitId,
        lesson_id: lessonId,
        question_text: questionText.trim(),
        choices: filledChoices,
        correct_answer: correctAnswer,
        explanation_text: explanationText.trim(),
        difficulty: difficulty || null,
        source: source || null,
        exam_year: examYear ? parseInt(examYear) : null,
      };

      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل الحفظ");
      }

      const result = await res.json();
      setSavedCount((c) => c + result.inserted);
      setTotalQuestions((c) => c + result.inserted);
      setToast({ type: "success", msg: "تم حفظ السؤال بنجاح" });
      resetForm();
    } catch (e) {
      setToast({ type: "error", msg: e instanceof Error ? e.message : "فشل الحفظ" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="size-12 text-red-400" />
        <p className="text-h3 text-text-primary">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">إدارة الأسئلة</h1>
        <p className="text-body text-text-secondary">
          إجمالي الأسئلة: {totalQuestions} سؤال
          {savedCount > 0 && (
            <span className="text-green-400"> (أُضيف {savedCount} هذه الجلسة)</span>
          )}
        </p>
      </header>

      {toast && (
        <div
          className={`flex items-center gap-2 rounded-card border p-3 text-body ${
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0" />
          ) : (
            <AlertCircle className="size-5 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      <Card className="flex flex-col gap-5 p-5">
        <h2 className="text-h2 text-text-primary">تحديد الموقع</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>المادة</Label>
            <div className="relative">
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="flex h-11 w-full appearance-none rounded-input border border-strong bg-bg-surface pe-10 ps-4 text-body text-text-primary transition-colors focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
              >
                <option value="">— اختر المادة —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar} ({s.track === "shared" ? "مشترك" : s.track === "scientific" ? "علمي" : "أدبي"})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>الوحدة</Label>
            <div className="relative">
              <select
                value={unitId}
                onChange={(e) => handleUnitChange(e.target.value)}
                disabled={!subjectId}
                className="flex h-11 w-full appearance-none rounded-input border border-strong bg-bg-surface pe-10 ps-4 text-body text-text-primary transition-colors focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">— اختر الوحدة —</option>
                {filteredUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name_ar}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>الدرس</Label>
            <div className="relative">
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                disabled={!unitId}
                className="flex h-11 w-full appearance-none rounded-input border border-strong bg-bg-surface pe-10 ps-4 text-body text-text-primary transition-colors focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">— اختر الدرس —</option>
                {filteredLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name_ar}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-5 p-5">
        <h2 className="text-h2 text-text-primary">السؤال</h2>

        <div className="flex flex-col gap-2">
          <Label>نص السؤال</Label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            placeholder="اكتب نص السؤال هنا..."
            className="w-full rounded-input border border-strong bg-bg-surface p-4 text-body text-text-primary placeholder:text-text-muted transition-colors focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label>الخيارات (اختر الإجابة الصحيحة بالضغط عليها)</Label>
          {choices.map((choice, i) => (
            <div key={choice.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrectAnswer(choice.key)}
                className={`flex size-10 shrink-0 items-center justify-center rounded-pill border text-body font-bold transition-colors ${
                  correctAnswer === choice.key
                    ? "border-green-500 bg-green-500/20 text-green-400"
                    : "border-strong bg-bg-raised text-text-muted hover:border-brand-400"
                }`}
              >
                {choice.key}
              </button>
              <Input
                value={choice.text}
                onChange={(e) => updateChoice(i, e.target.value)}
                placeholder={`الخيار ${choice.key}`}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Label>شرح الحل</Label>
          <textarea
            value={explanationText}
            onChange={(e) => setExplanationText(e.target.value)}
            rows={2}
            placeholder="لماذا هذه الإجابة صحيحة..."
            className="w-full rounded-input border border-strong bg-bg-surface p-4 text-body text-text-primary placeholder:text-text-muted transition-colors focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-5 p-5">
        <h2 className="text-h2 text-text-primary">بيانات إضافية (اختياري)</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>الصعوبة</Label>
            <div className="relative">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="flex h-11 w-full appearance-none rounded-input border border-strong bg-bg-surface pe-10 ps-4 text-body text-text-primary transition-colors focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
              >
                <option value="">— غير محدد —</option>
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">صعب</option>
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>المصدر</Label>
            <div className="relative">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as Source)}
                className="flex h-11 w-full appearance-none rounded-input border border-strong bg-bg-surface pe-10 ps-4 text-body text-text-primary transition-colors focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
              >
                <option value="">— غير محدد —</option>
                <option value="past_exam">امتحان سابق</option>
                <option value="practice">تدريب</option>
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>سنة الامتحان</Label>
            <Input
              type="number"
              value={examYear}
              onChange={(e) => setExamYear(e.target.value)}
              placeholder="مثلاً 2024"
              min="2000"
              max="2030"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}
          حفظ السؤال
        </Button>
        <Button variant="secondary" onClick={resetForm} disabled={saving}>
          <Trash2 className="size-4" />
          مسح النموذج
        </Button>
      </div>
    </div>
  );
}
