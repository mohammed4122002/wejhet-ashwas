"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Config {
  unlock_at: string;
  notified_at: string | null;
  updated_at: string;
}

/** يحوّل ISO لصيغة datetime-local (يستخدم توقيت الجهاز المحلي للعرض والإدخال). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function TimeCapsuleAdminPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/time-capsule-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setConfig(data.config);
          setValue(toLocalInput(data.config.unlock_at));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function save() {
    if (!value) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/time-capsule-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock_at: new Date(value).toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل الحفظ");
      }
      setToast({ type: "success", msg: "تم تحديث تاريخ الفتح" });
      const refreshed = await fetch("/api/admin/time-capsule-config").then((r) =>
        r.json()
      );
      setConfig(refreshed.config);
    } catch (e) {
      setToast({
        type: "error",
        msg: e instanceof Error ? e.message : "فشل الحفظ",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/admin" className="text-secondary text-brand-400 hover:underline">
        ← العودة
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">كبسولة الزمن</h1>
        <p className="text-body text-text-secondary">
          تاريخ واحد مشترك لكل الطلاب — لما يحين، تنفتح كل الرسائل المكتوبة
          ويوصل الجميع إشعار.
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

      <Card>
        <CardHeader>
          <CardTitle>تاريخ فتح الكبسولات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!config ? (
            <Loader2 className="size-6 animate-spin text-brand-400" />
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label>تاريخ ووقت الفتح</Label>
                <input
                  type="datetime-local"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="h-11 w-full rounded-input border border-strong bg-bg-surface px-4 text-body text-text-primary"
                />
              </div>

              <div className="flex flex-col gap-1 text-secondary text-text-muted">
                <p>
                  إشعار الفتح:{" "}
                  {config.notified_at
                    ? `أُرسل بتاريخ ${new Date(config.notified_at).toLocaleString("ar-EG")}`
                    : "لسا ما أُرسل — رح يُرسل تلقائياً أول يوم بعد الفتح"}
                </p>
                <p>
                  آخر تحديث: {new Date(config.updated_at).toLocaleString("ar-EG")}
                </p>
              </div>

              <Button onClick={save} disabled={saving || !value} className="self-start">
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                احفظ التاريخ
              </Button>
              <p className="text-secondary text-text-muted">
                تغيير التاريخ يُعيد ضبط علم الإرسال تلقائياً — يعني لو غيّرته
                لتاريخ مستقبلي بعد إرسال سابق، رح يُرسل الإشعار مرة ثانية بموعده
                الجديد.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
