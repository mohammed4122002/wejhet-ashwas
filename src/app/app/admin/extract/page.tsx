"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Material {
  id: string;
  title: string;
  file_type: string;
  subject: string;
  file_url: string;
}

interface ExtractedQuestion {
  original_text: string;
  improved_text: string;
  choices?: Array<{ key: string; text: string }>;
  correct_answer?: string;
  difficulty?: string;
}

interface Subject {
  id: string;
  name_ar: string;
}

// إزالة الأسئلة المكرّرة عند دمج نتائج دفعات متعددة.
function dedupeByText(items: ExtractedQuestion[]): ExtractedQuestion[] {
  const seen = new Set<string>();
  const out: ExtractedQuestion[] = [];
  for (const q of items) {
    const key = (q.improved_text || q.original_text || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

export default function ExtractQuestionsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [targetSubjectId, setTargetSubjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  // صفحة الاستئناف للملفات الكبيرة (null = اكتمل الملف أو لا يوجد تقسيم)
  const [nextStartPage, setNextStartPage] = useState<number | null>(null);

  useEffect(() => {
    fetchMaterials();
    fetchSubjects();
  }, []);

  async function fetchMaterials() {
    try {
      const res = await fetch("/api/admin/materials");
      if (!res.ok) throw new Error("Failed to fetch materials");
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch {
      setMessage("فشل تحميل الملفات");
    }
  }

  async function fetchSubjects() {
    try {
      const res = await fetch("/api/subjects");
      if (!res.ok) return;
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch {
      // اختيار المادة يدوياً يبقى متاحاً حتى لو فشل الجلب
    }
  }

  async function runExtraction(startPage: number, append: boolean) {
    setLoading(true);
    setMessage(append ? "جاري استكمال الاستخراج…" : "");
    try {
      const res = await fetch("/api/smart-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_id: selectedMaterial,
          start_page: startPage,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "فشل الاستخراج");
      }

      const data = await res.json();
      const incoming: ExtractedQuestion[] = data.extracted_questions || [];

      setExtractedQuestions((prev) =>
        append ? dedupeByText([...prev, ...incoming]) : incoming
      );
      setStats(data.summary);
      setNextStartPage(data.pagination?.next_start_page ?? null);
      if (!append) {
        // المادة المطابقة تلقائياً (يمكن للمشرف تغييرها قبل الحفظ)
        setTargetSubjectId(data.resolved_subject_id || "");
      }
      setShowResults(true);
      setMessage(data.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  async function handleExtract() {
    if (!selectedMaterial) {
      setMessage("اختر ملفاً للاستخراج");
      return;
    }
    setExtractedQuestions([]);
    setNextStartPage(null);
    await runExtraction(1, false);
  }

  async function handleContinueExtraction() {
    if (!nextStartPage) return;
    await runExtraction(nextStartPage, true);
  }

  async function handleSaveExtractedQuestions() {
    if (extractedQuestions.length === 0) {
      setMessage("لا توجد أسئلة للحفظ");
      return;
    }
    if (!targetSubjectId) {
      setMessage("اختر المادة التي ستُحفظ ضمنها الأسئلة");
      return;
    }

    try {
      setLoading(true);
      const material = materials.find((m) => m.id === selectedMaterial);

      const res = await fetch("/api/admin/save-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: targetSubjectId,
          questions: extractedQuestions.map((q) => ({
            question_text: q.improved_text,
            choices: q.choices || [],
            correct_answer: q.correct_answer || q.choices?.[0]?.key || "أ",
            explanation_text: `مستخرجة من: ${material?.title ?? "ملف"}`,
            difficulty: q.difficulty || "medium",
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "فشل الحفظ");
      }

      setMessage(`تم حفظ ${extractedQuestions.length} أسئلة بنجاح`);
      setExtractedQuestions([]);
      setNextStartPage(null);
      setShowResults(false);
      setSelectedMaterial("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "خطأ في الحفظ");
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
          <h1 className="text-2xl font-bold">الأسئلة المستخرجة</h1>

          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {extractedQuestions.length}
                    </div>
                    <p className="text-sm text-muted-foreground">أسئلة مستخرجة</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">1</div>
                    <p className="text-sm text-muted-foreground">ملف</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {nextStartPage !== null && (
          <Card className="border-amber-500/40">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm">
                الملف كبير ولم تكتمل كل صفحاته بعد. اضغط لاستكمال استخراج بقية
                الأسئلة (تُضاف إلى القائمة الحالية).
              </p>
              <Button
                onClick={handleContinueExtraction}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                {loading ? "جاري الاستكمال…" : "استكمل الاستخراج ⏩"}
              </Button>
            </CardContent>
          </Card>
        )}

        {message && (
          <div className="p-3 rounded bg-blue-50 dark:bg-blue-950 text-sm">
            {message}
          </div>
        )}

        {extractedQuestions.length > 0 && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              <label className="text-sm font-semibold">
                احفظ الأسئلة ضمن مادة:
              </label>
              <select
                value={targetSubjectId}
                onChange={(e) => setTargetSubjectId(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-background text-foreground"
              >
                <option value="">— اختر المادة —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                تم اقتراح المادة تلقائياً حسب اسم الملف؛ يمكنك تعديلها.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {extractedQuestions.map((q, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">السؤال {idx + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">النص الأصلي:</p>
                  <p className="font-semibold">{q.original_text}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">النص المحسّن:</p>
                  <p className="font-semibold text-green-600">{q.improved_text}</p>
                </div>

                {q.choices && q.choices.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">الخيارات:</p>
                    {q.choices.map((choice) => (
                      <div
                        key={choice.key}
                        className="p-2 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <span className="font-semibold">{choice.key}.</span> {choice.text}
                      </div>
                    ))}
                  </div>
                )}

                {q.difficulty && (
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                      الصعوبة: {q.difficulty}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSaveExtractedQuestions}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "جاري الحفظ..." : "حفظ الأسئلة المحسّنة"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShowResults(false);
              setExtractedQuestions([]);
              setNextStartPage(null);
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
        <h1 className="text-3xl font-bold">استخراج وتحسين الأسئلة</h1>
        <p className="text-muted-foreground">
          اختر ملفاً واترك لنا استخراج الأسئلة وتحسين صياغتها تلقائياً
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded text-sm ${
          message.includes("فشل") || message.includes("خطأ")
            ? "bg-red-50 dark:bg-red-950"
            : "bg-blue-50 dark:bg-blue-950"
        }`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>الملفات المرفوعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {materials.length === 0 ? (
            <p className="text-muted-foreground">لا توجد ملفات مرفوعة</p>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {materials.map((material) => (
                  <label
                    key={material.id}
                    className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                      selectedMaterial === material.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="material"
                      value={material.id}
                      checked={selectedMaterial === material.id}
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{material.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {material.file_type} • {material.subject}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                onClick={handleExtract}
                disabled={loading || !selectedMaterial}
                className="w-full"
              >
                {loading ? "جاري الاستخراج..." : "استخرج وحسّن الأسئلة"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
