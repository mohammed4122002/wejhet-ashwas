"use client";

import { useState, useEffect, useCallback } from "react";
import { randomTaskDonePhrase } from "@/lib/domain/quotes";

/**
 * نافذة منبثقة قصيرة عند إنهاء مهمة — عبارة تحفيزية سريعة تختفي تلقائياً.
 * تستخدم عبر context: triggerToast() تُظهرها، وتختفي بعد 2.5 ثانية.
 */
export function useTaskDoneToast() {
  const [message, setMessage] = useState<string | null>(null);

  const triggerToast = useCallback(() => {
    setMessage(randomTaskDonePhrase());
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(t);
  }, [message]);

  return { message, triggerToast };
}

export function TaskDoneToast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-50 flex justify-center px-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="rounded-card border border-status-done/30 bg-status-done/10 px-5 py-3 shadow-lg backdrop-blur">
        <p className="text-body font-medium text-status-done">{message}</p>
      </div>
    </div>
  );
}
