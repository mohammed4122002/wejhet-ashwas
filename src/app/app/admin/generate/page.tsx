"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Subject {
  id: string;
  name_ar: string;
}

interface Unit {
  id: string;
  name_ar: string;
}

interface Lesson {
  id: string;
  name_ar: string;
}

interface GeneratedQuestion {
  question_text: string;
  choices: Array<{ key: string; text: string }>;
  correct_answer: string;
  explanation_text: string;
  difficulty: string;
}

export default function GenerateQuestionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [scope, setScope] = useState<"general" | "unit" | "lesson">("general");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "">("");
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchUnits(selectedSubject);
      setSelectedUnit("");
      setSelectedLesson("");
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedUnit) {
      fetchLessons(selectedUnit);
      setSelectedLesson("");
    }
  }, [selectedUnit]);

  async function fetchSubjects() {
    try {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch {
      setMessage("فشل تحميل المواد");
    }
  }

  async function fetchUnits(subjectId: string) {
    try {
      const res = await fetch(`/api/units?subject_id=${subjectId}`);
      if (!res.ok) throw new Error("Failed to fetch units");
      const data = await res.json();
      setUnits(data.units || []);
    } catch {
      setMessage("فشل تحميل الوحدات");
    }
  }

  async function fetchLessons(unitId: string) {
    try {
      const res = await fetch(`/api/lessons?unit_id=${unitId}`);
      if (!res.ok) throw new Error("Failed to fetch lessons");
      const data = await res.json();
      setLessons(data.lessons || []);
    } catch {
      setMessage("فشل تحميل الدروس");
    }
  }

  async function handleGenerate() {
    if (!selectedSubject) {
      setMessage("اختر المادة");
      return;
    }

    if (scope === "unit" && !selectedUnit) {
      setMessage("اختر الوحدة");
      return;
    }

    if (scope === "lesson" && !selectedLesson) {
      setMessage("اختر الدرس");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const subject = subjects.find((s) => s.id === selectedSubject);
      const requestBody = {
        subject_id: selectedSubject,
        subject_name: subject?.name_ar || "",
        unit_id: selectedUnit || undefined,
        lesson_id: selectedLesson || undefined,
        count: parseInt(count) || 5,
        difficulty: difficulty || undefined,
        scope,
      };

      const res = await fetch("/api/admin/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "فشل توليد الأسئلة");
      }

      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setGeneratedQuestions(data.questions);
        setShowResults(true);
        setMessage(`تم توليد ${data.questions.length} أسئلة`);
      } else {
        setMessage("لم يتم توليد أسئلة");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveQuestions() {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/admin/save-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: selectedSubject,
          unit_id: selectedUnit || undefined,
          lesson_id: selectedLesson || undefined,
          questions: generatedQuestions,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "فشل حفظ الأسئلة");
      }

      setMessage(`تم حفظ ${generatedQuestions.length} أسئلة`);

      setGeneratedQuestions([]);
      setShowResults(false);
      setSelectedSubject("");
      setSelectedUnit("");
      setSelectedLesson("");
      setScope("general");
      setCount("5");
      setDifficulty("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  if (showResults) {
    return (
      <div className="space-y-6">
        <Link href="/app/admin" className="text-sm text-primary hover:underline">
          ← العودة
        </Link>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold">الأسئلة المولدة</h1>
          <p className="text-sm text-muted-foreground">
            عدد الأسئلة: {generatedQuestions.length}
          </p>
        </div>

        {message && (
          <div className="p-3 rounded bg-blue-50 dark:bg-blue-950 text-sm">
            {message}
          </div>
        )}

        <div className="space-y-4">
          {generatedQuestions.map((q, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">
                  السؤال {idx + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">{q.question_text}</p>
                </div>

                <div className="space-y-2">
                  {q.choices.map((choice) => (
                    <div
                      key={choice.key}
                      className={`p-3 rounded border ${
                        choice.key === q.correct_answer
                          ? "border-green-500 bg-green-50 dark:bg-green-950"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <span className="font-semibold">{choice.key}.</span> {choice.text}
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <p className="text-sm font-semibold mb-1">الشرح:</p>
                  <p className="text-sm">{q.explanation_text}</p>
                </div>

                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                    الصعوبة: {q.difficulty}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSaveQuestions}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "جاري الحفظ..." : "حفظ الأسئلة"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShowResults(false);
              setGeneratedQuestions([]);
              setMessage("");
            }}
            disabled={loading}
          >
            إلغاء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/app/admin" className="text-sm text-primary hover:underline">
        ← العودة
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">توليد الأسئلة التلقائي</h1>
        <p className="text-muted-foreground">
          اختر المادة والنطاق وعدد الأسئلة، ثم اضغط &quot;توليد&quot;
        </p>
      </div>

      {message && (
        <div className="p-3 rounded bg-red-50 dark:bg-red-950 text-sm">
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>معاملات التوليد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">المادة *</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded bg-background text-foreground"
            >
              <option value="">اختر المادة</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar}
                </option>
              ))}
            </select>
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <label className="text-sm font-medium">النطاق</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "general" | "unit" | "lesson")}
              className="w-full px-3 py-2 border rounded bg-background text-foreground"
            >
              <option value="general">المادة كاملة</option>
              <option value="unit">وحدة محددة</option>
              <option value="lesson">درس محدد</option>
            </select>
          </div>

          {/* Unit (conditional) */}
          {(scope === "unit" || scope === "lesson") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">الوحدة</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-background text-foreground"
              >
                <option value="">اختر الوحدة</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name_ar}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lesson (conditional) */}
          {scope === "lesson" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">الدرس</label>
              <select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-background text-foreground"
              >
                <option value="">اختر الدرس</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name_ar}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium">عدد الأسئلة</label>
            <Input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="5"
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm font-medium">مستوى الصعوبة (اختياري)</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard" | "")}
              className="w-full px-3 py-2 border rounded bg-background text-foreground"
            >
              <option value="">بدون تحديد</option>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !selectedSubject}
            className="w-full"
          >
            {loading ? "جاري التوليد..." : "توليد الأسئلة"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
