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
    async function sync() {
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
  }, [userId]);

  // لا نحجب الواجهة على الترطيب — العرض المحلي فوري (local-first).
  // `ready` متاح لو احتجناه لاحقاً لمؤشّر تحميل أولي.
  void ready;

  return (
    <AppUserContext.Provider value={user}>{children}</AppUserContext.Provider>
  );
}
