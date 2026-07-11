"use client";

import { useMemo, useState } from "react";
import { Copy, Printer, Check, Trash2, HelpCircle } from "lucide-react";
import { useDoubts } from "@/hooks/use-doubts";
import { useCurriculum } from "@/hooks/use-curriculum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DoubtsPage() {
  const { doubts, unresolved, setResolved, removeDoubt } = useDoubts();
  const { subjects } = useCurriculum();
  const [copied, setCopied] = useState(false);

  const subjectName = useMemo(() => {
    const m = new Map(subjects.map((s) => [s.id, s.name_ar]));
    return (id: string | null) => (id ? m.get(id) : undefined);
  }, [subjects]);

  const resolved = doubts.filter((d) => d.is_resolved);

  async function copyAll() {
    const text = unresolved
      .map((d, i) => `${i + 1}. ${d.question_text}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* المتصفّح قد يمنع النسخ بدون تفاعل — نتجاهل بهدوء */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">صندوق الشكوك</h1>
        <p className="text-body text-text-secondary">
          الأسئلة اللي سجّلتها أثناء المذاكرة — خُذها معك لأستاذك بالمدرسة أو
          المركز.
        </p>
      </header>

      {/* الملخّص الأسبوعي */}
      <Card className={cn(unresolved.length > 0 && "border-brand-500/40")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="size-5 text-accent-copper" aria-hidden />
            {unresolved.length > 0
              ? `عندك ${unresolved.length} ${
                  unresolved.length === 1 ? "سؤال" : "أسئلة"
                } تحتاج تسألها`
              : "ما عندك أسئلة معلّقة — ممتاز!"}
          </CardTitle>
        </CardHeader>
        {unresolved.length > 0 && (
          <CardContent className="flex items-center gap-3">
            <Button variant="secondary" onClick={copyAll}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? "اننسخت" : "انسخ الكل"}
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer aria-hidden /> اطبع
            </Button>
          </CardContent>
        )}
      </Card>

      {/* المعلّقة */}
      {unresolved.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-h2 text-text-primary">أسئلة معلّقة</h2>
          {unresolved.map((d) => (
            <Card key={d.id} className="flex items-start justify-between gap-3 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-body text-text-primary">{d.question_text}</p>
                {subjectName(d.subject_id) && (
                  <span className="text-secondary text-text-muted">
                    {subjectName(d.subject_id)}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setResolved(d, true)}
                  className="inline-flex items-center gap-1.5 rounded-pill bg-status-done/10 px-3 py-1.5 text-secondary text-status-done transition-colors hover:bg-status-done/20"
                >
                  <Check className="size-4" aria-hidden />
                  تم حلّه
                </button>
                <button
                  type="button"
                  onClick={() => removeDoubt(d.id)}
                  className="rounded-pill p-2 text-text-muted transition-colors hover:text-brand-400"
                  aria-label="حذف"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </Card>
          ))}
        </section>
      )}

      {/* المحلولة */}
      {resolved.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-h2 text-text-secondary">تم حلّها</h2>
          {resolved.map((d) => (
            <Card
              key={d.id}
              className="flex items-start justify-between gap-3 p-4 opacity-60"
            >
              <p className="text-body text-text-secondary line-through">
                {d.question_text}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setResolved(d, false)}
                  className="rounded-pill px-3 py-1.5 text-secondary text-text-muted transition-colors hover:text-text-secondary"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={() => removeDoubt(d.id)}
                  className="rounded-pill p-2 text-text-muted transition-colors hover:text-brand-400"
                  aria-label="حذف"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </Card>
          ))}
        </section>
      )}

      {doubts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <HelpCircle className="size-8 text-text-muted" aria-hidden />
            <p className="text-body text-text-secondary">
              لسا ما سجّلت أي شك. أثناء البومودورو، لما يوقفك سؤال، سجّله بسرعة
              وكمّل مذاكرتك.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
