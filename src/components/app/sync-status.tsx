"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { getDB } from "@/lib/db/dexie";
import { cn } from "@/lib/utils";

/**
 * مؤشّر حالة المزامنة والاتصال.
 * - غير متصل: أيقونة سحابة مقطوعة + عدد العناصر المحفوظة محلياً بانتظار الرفع.
 * - متصل مع عناصر معلّقة: "بتتم المزامنة".
 * - متصل ومتزامن: سحابة هادئة.
 */
export function SyncStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const pending = useLiveQuery(
    () => (typeof window === "undefined" ? 0 : getDB().sync_queue.count()),
    [],
    0
  );

  if (!online) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-pill bg-bg-surface px-3 py-1.5 text-secondary text-text-secondary"
        title="بتشتغل بدون إنترنت — تغييراتك محفوظة وبتتزامن أول ما يرجع الاتصال"
      >
        <CloudOff className="size-4 text-brand-400" aria-hidden />
        بدون اتصال{pending ? ` · ${pending} بانتظار المزامنة` : ""}
      </span>
    );
  }

  if (pending && pending > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-bg-surface px-3 py-1.5 text-secondary text-text-secondary">
        <RefreshCw className={cn("size-4 animate-spin text-brand-400")} aria-hidden />
        بتتم المزامنة · {pending}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-bg-surface px-3 py-1.5 text-secondary text-text-muted">
      <Cloud className="size-4 text-status-done" aria-hidden />
      متزامن
    </span>
  );
}
