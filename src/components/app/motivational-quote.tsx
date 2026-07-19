"use client";

import { useState, useEffect } from "react";
import { Quote as QuoteIcon } from "lucide-react";
import { randomQuote } from "@/lib/domain/quotes";

/**
 * عبارة تحفيزية تظهر عند فتح التطبيق.
 * تُخزّن آخر index محلياً لتجنّب التكرار المتتالي.
 */
export function MotivationalQuote() {
  const [quote, setQuote] = useState<{ text: string; source?: string } | null>(null);

  useEffect(() => {
    const lastIdx = Number(localStorage.getItem("wejhet_last_quote_idx") ?? "-1");
    const { quote: q, index } = randomQuote(lastIdx >= 0 ? lastIdx : undefined);
    localStorage.setItem("wejhet_last_quote_idx", String(index));
    setQuote(q);
  }, []);

  if (!quote) return null;

  return (
    <div className="flex items-start gap-3 rounded-card border border-brand-500/20 bg-brand-500/5 p-4">
      <QuoteIcon className="mt-0.5 size-5 shrink-0 text-brand-400" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-body text-text-primary">{quote.text}</p>
        {quote.source && (
          <span className="text-secondary text-text-muted">— {quote.source}</span>
        )}
      </div>
    </div>
  );
}
