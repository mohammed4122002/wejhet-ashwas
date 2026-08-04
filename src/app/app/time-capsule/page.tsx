"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Lock, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { subscribeToPush } from "@/lib/push";

interface CapsuleState {
  status: "none" | "skipped" | "written";
  unlock_at: string | null;
  unlocked: boolean;
  written_at: string | null;
  message: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TimeCapsulePage() {
  const [state, setState] = useState<CapsuleState | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/time-capsule");
    if (res.ok) setState(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit() {
    if (!message.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/time-capsule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل الحفظ");
      }
      void subscribeToPush();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (!state) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-400" aria-hidden />
      </div>
    );
  }

  const canWrite = state.status !== "written" && !state.unlocked;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/app/more" className="text-secondary text-brand-400 hover:underline">
        ← رجوع
      </Link>

      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-pill bg-brand-500/15">
          <Mail className="size-7 text-brand-400" aria-hidden />
        </div>
        <h1 className="text-h1 text-text-primary">كبسولة الزمن</h1>
        <p className="text-body text-text-secondary">
          رسالة منك لنفسك — تُفتح يوم إعلان نتائج التوجيهي.
        </p>
      </header>

      {/* الحالة 1: مكتوبة ومفتوحة — الكشف */}
      {state.status === "written" && state.unlocked && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-brand-400" aria-hidden />
              رسالتك وصلت أخيراً
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="whitespace-pre-wrap text-body leading-relaxed text-text-primary">
              {state.message}
            </p>
            {state.written_at && (
              <p className="text-secondary text-text-muted">
                كتبتها بتاريخ {formatDate(state.written_at)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* الحالة 2: مكتوبة ولسا مقفولة */}
      {state.status === "written" && !state.unlocked && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Lock className="size-8 text-text-muted" aria-hidden />
            <p className="text-body text-text-primary">
              رسالتك محفوظة ومقفولة 🔒
            </p>
            <p className="text-secondary text-text-muted">
              {state.unlock_at
                ? `رح تنفتح تلقائياً بتاريخ ${formatDate(state.unlock_at)}`
                : "رح تنفتح تلقائياً يوم إعلان النتائج"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* الحالة 3: ما كتب شي ولسا الوقت متاح */}
      {canWrite && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="اكتب رسالتك هون..."
              className="w-full rounded-input border border-strong bg-bg-surface p-4 text-body text-text-primary"
            />
            {error && <p className="text-secondary text-brand-400">{error}</p>}
            <Button onClick={submit} disabled={saving || !message.trim()}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              أرسل رسالتك
            </Button>
            <p className="text-secondary text-text-muted">
              مقفولة فور الإرسال — ما بتقدر تعدّلها بعدين.
            </p>
          </CardContent>
        </Card>
      )}

      {/* الحالة 4: ما كتب شي وخلص الوقت */}
      {state.status !== "written" && state.unlocked && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <p className="text-body text-text-secondary">
              ما كتبت رسالة قبل ما تُعلن النتائج هالسنة 🙂
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
