"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { saveProfileAction, type OnboardingState } from "../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioCard } from "@/components/ui/radio-card";
import { SubmitButton } from "@/components/auth/submit-button";
import { FormMessage } from "@/components/auth/form-message";
import { Logo } from "@/components/brand/logo";
import {
  TRACKS,
  REWARD_SYSTEMS,
  DEFAULT_REWARD_SYSTEM,
} from "@/lib/domain/constants";
import type { RewardSystem, Track } from "@/lib/supabase/database.types";

const initial: OnboardingState = {};

export default function OnboardingTrackPage() {
  const [state, formAction] = useFormState(saveProfileAction, initial);
  const [track, setTrack] = useState<Track | "">("");
  const [reward, setReward] = useState<RewardSystem>(DEFAULT_REWARD_SYSTEM);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo size={56} />
        <h1 className="text-h1 text-text-primary">أهلاً فيك بوجهة أشوس</h1>
        <p className="text-body text-text-secondary">
          سؤال واحد بس نبلّش فيه: شو فرعك؟ (بتقدر تغيّر نظام المكافأة أي وقت لاحقاً
          من الإعدادات)
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-8">
        {/* اختيار الفرع — إجباري */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h2">فرعك الدراسي</CardTitle>
            <CardDescription>
              على أساسه بتظهرلك المواد بكل مكان بالمنصة.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {TRACKS.map((t) => (
              <RadioCard
                key={t.value}
                name="track"
                value={t.value}
                checked={track === t.value}
                onChange={(v) => setTrack(v as Track)}
                title={t.label}
                description={t.description}
              />
            ))}
          </CardContent>
        </Card>

        {/* اختيار نظام المكافأة — اختياري، افتراضي = النجوم والأبراج */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h2">نظام المكافأة المفضّل</CardTitle>
            <CardDescription>
              اختياري — نبلّشك بالنجوم والأبراج (الأقرب لهوية المنصة)، وبتبدّله وقت
              ما بدّك بدون ما تخسر أي تقدّم.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {REWARD_SYSTEMS.map((r) => (
              <RadioCard
                key={r.value}
                name="reward_system"
                value={r.value}
                checked={reward === r.value}
                onChange={(v) => setReward(v as RewardSystem)}
                title={r.label}
                description={r.description}
              />
            ))}
          </CardContent>
        </Card>

        <FormMessage error={state.error} />

        <SubmitButton size="lg" className="w-full" disabled={!track}>
          يلا نبدأ
        </SubmitButton>
      </form>
    </main>
  );
}
