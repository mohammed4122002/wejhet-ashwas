"use client";

import { Award, Lock, Sparkles } from "lucide-react";
import type { Badge } from "@/lib/domain/rewards";
import { cn } from "@/lib/utils";

/** شارات نصية مشتركة بين كل قوالب المكافأة. */
export function RewardBadges({ badges }: { badges: Badge[] }) {
  const visible = badges.filter((b) => !b.hidden || b.earned);
  const hiddenCount = badges.filter((b) => b.hidden && !b.earned).length;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-h2 text-text-primary">شاراتك</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((b) => (
          <div
            key={b.id}
            className={cn(
              "flex items-center gap-3 rounded-card border p-4 transition-colors",
              b.earned && b.hidden
                ? "border-accent-copper/50 bg-bg-surface shadow-glow-brand"
                : b.earned
                  ? "border-brand-500/40 bg-bg-surface shadow-glow-brand"
                  : "border-subtle bg-bg-surface opacity-60"
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-pill",
                b.earned && b.hidden
                  ? "bg-accent-copper/15 text-accent-copper"
                  : b.earned
                    ? "bg-brand-500/15 text-brand-400"
                    : "bg-bg-raised text-text-muted"
              )}
            >
              {b.earned && b.hidden ? (
                <Sparkles className="size-5" aria-hidden />
              ) : b.earned ? (
                <Award className="size-5" aria-hidden />
              ) : (
                <Lock className="size-4" aria-hidden />
              )}
            </span>
            <div className="flex flex-col">
              <span className={cn("text-h3", b.earned ? "text-text-primary" : "text-text-secondary")}>
                {b.label}
              </span>
              <span className="text-secondary text-text-muted">{b.description}</span>
            </div>
          </div>
        ))}
      </div>
      {hiddenCount > 0 && (
        <p className="text-secondary text-text-muted">
          + {hiddenCount} شارة سرّية مخفية — اكتشفها بنفسك!
        </p>
      )}
    </div>
  );
}
