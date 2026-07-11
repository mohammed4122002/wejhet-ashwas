"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_REWARD_SYSTEM } from "@/lib/domain/constants";
import type {
  RewardSystem,
  Track,
} from "@/lib/supabase/database.types";

export interface OnboardingState {
  error?: string;
}

const VALID_TRACKS: Track[] = ["scientific", "literary"];
const VALID_REWARDS: RewardSystem[] = [
  "palestine_map",
  "star_constellations",
  "city_builder",
  "garden_tree",
  "minimal",
];

/**
 * حفظ الفرع (إجباري) ونظام المكافأة (اختياري، افتراضي = النجوم والأبراج).
 * يُنشئ ملف الطالب الشخصي — خطة §أ.1 و §ب.4.
 */
export async function saveProfileAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const track = String(formData.get("track") ?? "") as Track;
  const rewardRaw = String(formData.get("reward_system") ?? "");
  const reward_system: RewardSystem = VALID_REWARDS.includes(
    rewardRaw as RewardSystem
  )
    ? (rewardRaw as RewardSystem)
    : DEFAULT_REWARD_SYSTEM;

  if (!VALID_TRACKS.includes(track)) {
    return { error: "اختر فرعك (علمي أو أدبي) للمتابعة." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      track,
      reward_system,
    },
    { onConflict: "id" }
  );

  if (error) {
    return { error: "تعذّر حفظ اختيارك. حاول مرة ثانية." };
  }

  redirect("/app");
}
