"use client";

import { useEffect, useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { subscribeToPush } from "@/lib/push";

/**
 * دعوة كتابة "كبسولة الزمن" — تظهر مرة واحدة فقط لأول زيارة لـ /app بعد
 * اختيار الفرع، وتختفي نهائياً (كتابة أو تجاوز) لأن الحالة تُخزَّن بالخادم.
 * لو تجاوزها الطالب يقدر يكتبها لاحقاً من "المزيد ← كبسولة الزمن".
 */
export function TimeCapsulePrompt() {
  const [visible, setVisible] = useState(false);
  const [writing, setWriting] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/time-capsule")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.status === "none") setVisible(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function skip() {
    setVisible(false);
    await fetch("/api/time-capsule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skip: true }),
    }).catch(() => {});
  }

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
      // نطلب إذن الإشعارات هلّق تحديداً — لحظة طبيعية ومبرَّرة للطالب
      void subscribeToPush();
      setVisible(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (!visible) return null;

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && skip()}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-pill bg-brand-500/15">
            <Mail className="size-6 text-brand-400" aria-hidden />
          </div>
          <DialogTitle>رسالة لنفسك المستقبلية</DialogTitle>
          <DialogDescription>
            اكتب كلمتين لطالب/طالبة يوم إعلان النتائج — تطلّع عليها بعد ما
            تُعلن. مقفولة تماماً لحد ما يجي وقتها.
          </DialogDescription>
        </DialogHeader>

        {!writing ? (
          <div className="flex gap-3">
            <Button onClick={() => setWriting(true)} className="flex-1">
              اكتب رسالتك
            </Button>
            <Button variant="secondary" onClick={skip}>
              لاحقاً
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              autoFocus
              placeholder="اكتب رسالتك هون..."
              className="w-full rounded-input border border-strong bg-bg-surface p-4 text-body text-text-primary"
            />
            {error && <p className="text-secondary text-brand-400">{error}</p>}
            <div className="flex gap-3">
              <Button
                onClick={submit}
                disabled={saving || !message.trim()}
                className="flex-1"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                أرسل رسالتك
              </Button>
              <Button
                variant="secondary"
                onClick={skip}
                disabled={saving}
              >
                لاحقاً
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
