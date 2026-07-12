"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db/dexie";
import { enqueue } from "@/lib/db/sync-queue";
import { createClient } from "@/lib/supabase/client";
import { useAppUser } from "@/components/app/app-data-provider";
import type { RewardSystem } from "@/lib/supabase/database.types";

export type ReminderKind =
  | "study_reminders"
  | "motivational_reminders"
  | "religious_reminders";

/** التفضيلات (الملف الشخصي + التذكيرات) — local-first: تُكتب محلياً وتتزامن. */
export function usePrefs() {
  const {
    userId,
    email,
    track,
    rewardSystem: fallbackReward,
    autoScheduleApply: fallbackAuto,
    displayName: fallbackName,
    avatarUrl: fallbackAvatar,
  } = useAppUser();

  const profile = useLiveQuery(() => getDB().profiles.get(userId), [userId]);
  const reminders = useLiveQuery(
    () => getDB().reminder_settings.get(userId),
    [userId]
  );

  const rewardSystem: RewardSystem = profile?.reward_system ?? fallbackReward;
  const autoScheduleApply = profile?.auto_schedule_apply ?? fallbackAuto;
  const displayName = profile?.display_name ?? fallbackName;
  const avatarUrl = profile?.avatar_url ?? fallbackAvatar;

  const reminderFlags = {
    study_reminders: reminders?.study_reminders ?? true,
    motivational_reminders: reminders?.motivational_reminders ?? true,
    religious_reminders: reminders?.religious_reminders ?? false,
  };

  async function saveProfile(patch: {
    reward_system?: RewardSystem;
    auto_schedule_apply?: boolean;
    display_name?: string | null;
    avatar_url?: string | null;
  }) {
    const db = getDB();
    const current =
      (await db.profiles.get(userId)) ??
      ({
        id: userId,
        track,
        reward_system: fallbackReward,
        auto_schedule_apply: fallbackAuto,
        created_at: null,
        display_name: fallbackName,
        avatar_url: fallbackAvatar,
      } as NonNullable<typeof profile>);
    const next = { ...current, ...patch };
    await db.profiles.put(next);
    await enqueue("profiles", "upsert", userId, next as Record<string, unknown>);
  }

  async function setRewardSystem(rs: RewardSystem) {
    await saveProfile({ reward_system: rs });
  }

  async function setAutoScheduleApply(v: boolean) {
    await saveProfile({ auto_schedule_apply: v });
  }

  async function setDisplayName(name: string) {
    await saveProfile({ display_name: name.trim() || null });
  }

  /** يرفع صورة البروفايل لتخزين Supabase ويحفظ رابطها (يحتاج اتصالاً). */
  async function uploadAvatar(file: File): Promise<string> {
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) throw error;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`; // كسر الكاش بعد التحديث
    await saveProfile({ avatar_url: url });
    return url;
  }

  /** تغيير كلمة المرور (يحتاج اتصالاً). */
  async function changePassword(newPassword: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function setReminder(kind: ReminderKind, value: boolean) {
    const db = getDB();
    const current =
      (await db.reminder_settings.get(userId)) ??
      ({
        user_id: userId,
        study_reminders: true,
        motivational_reminders: true,
        religious_reminders: false,
      } as NonNullable<typeof reminders>);
    const next = { ...current, [kind]: value };
    await db.reminder_settings.put(next);
    await enqueue(
      "reminder_settings",
      "upsert",
      userId,
      next as Record<string, unknown>
    );
  }

  return {
    email,
    rewardSystem,
    autoScheduleApply,
    displayName,
    avatarUrl,
    reminders: reminderFlags,
    setRewardSystem,
    setAutoScheduleApply,
    setReminder,
    setDisplayName,
    uploadAvatar,
    changePassword,
  };
}
