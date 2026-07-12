"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db/dexie";
import { enqueue } from "@/lib/db/sync-queue";
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
    track,
    rewardSystem: fallbackReward,
    autoScheduleApply: fallbackAuto,
  } = useAppUser();

  const profile = useLiveQuery(() => getDB().profiles.get(userId), [userId]);
  const reminders = useLiveQuery(
    () => getDB().reminder_settings.get(userId),
    [userId]
  );

  const rewardSystem: RewardSystem = profile?.reward_system ?? fallbackReward;
  const autoScheduleApply = profile?.auto_schedule_apply ?? fallbackAuto;

  const reminderFlags = {
    study_reminders: reminders?.study_reminders ?? true,
    motivational_reminders: reminders?.motivational_reminders ?? true,
    religious_reminders: reminders?.religious_reminders ?? false,
  };

  async function saveProfile(patch: {
    reward_system?: RewardSystem;
    auto_schedule_apply?: boolean;
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
    rewardSystem,
    autoScheduleApply,
    reminders: reminderFlags,
    setRewardSystem,
    setAutoScheduleApply,
    setReminder,
  };
}
