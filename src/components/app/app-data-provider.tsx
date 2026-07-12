"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { hydrateFromServer } from "@/lib/db/hydrate";
import { flushQueue } from "@/lib/db/sync-engine";
import { getDB } from "@/lib/db/dexie";
import type { RewardSystem, Track } from "@/lib/supabase/database.types";

export interface AppUser {
  userId: string;
  track: Track;
  rewardSystem: RewardSystem;
  autoScheduleApply: boolean;
}

const AppUserContext = createContext<AppUser | null>(null);

/** بيانات المستخدم الحالي (المعرّف + الفرع + نظام المكافأة) داخل المنطقة المحمية. */
export function useAppUser(): AppUser {
  const u = useContext(AppUserContext);
  if (!u) {
    throw new Error("useAppUser خارج AppDataProvider — تأكّد من التخطيط المحمي.");
  }
  return u;
}

/** اختصار: معرّف المستخدم فقط. */
export function useUserId(): string {
  return useAppUser().userId;
}

/**
 * مزوّد بيانات المنطقة المحمية:
 * - يوفّر معرّف المستخدم لكل المكوّنات (بدون استعلام مصادقة متكرّر).
 * - يرطّب Dexie من الخادم مرة عند الدخول + كلما رجع الاتصال، ثم يرفع الطابور.
 */
export function AppDataProvider({
  user,
  children,
}: {
  user: AppUser;
  children: ReactNode;
}) {
  const userId = user.userId;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // بذر التفضيلات محلياً من سياق الخادم لو لسا مو موجودة (عرض فوري + offline)
    async function seedPrefs() {
      const db = getDB();
      if (!(await db.profiles.get(userId))) {
        await db.profiles.put({
          id: userId,
          track: user.track,
          reward_system: user.rewardSystem,
          auto_schedule_apply: user.autoScheduleApply,
          created_at: null,
        });
      }
      if (!(await db.reminder_settings.get(userId))) {
        await db.reminder_settings.put({
          user_id: userId,
          study_reminders: true,
          motivational_reminders: true,
          religious_reminders: false,
        });
      }
    }

    async function sync() {
      await seedPrefs().catch(() => {});
      await hydrateFromServer(userId).catch(() => {
        /* بدون اتصال أو خطأ مؤقّت — نكمل ببيانات Dexie المحلية */
      });
      await flushQueue().catch(() => {});
      if (!cancelled) setReady(true);
    }
    void sync();

    const onOnline = () => void sync();
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
    // القيم الأخرى من user ثابتة لنفس userId (بذر أولي فقط)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // لا نحجب الواجهة على الترطيب — العرض المحلي فوري (local-first).
  // `ready` متاح لو احتجناه لاحقاً لمؤشّر تحميل أولي.
  void ready;

  return (
    <AppUserContext.Provider value={user}>{children}</AppUserContext.Provider>
  );
}
