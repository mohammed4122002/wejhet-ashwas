"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { startSyncEngine } from "@/lib/db/sync-engine";

/**
 * مزوّدات العميل العامة:
 * - TanStack Query لجلب/تخزين البيانات بنمط offline-first.
 * - تشغيل محرّك المزامنة (طابور Dexie ← Supabase) عند الإقلاع.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // مناسب لبيئة offline-first: لا نعيد الجلب بعدوانية
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            networkMode: "offlineFirst",
          },
          mutations: {
            networkMode: "offlineFirst",
          },
        },
      })
  );

  useEffect(() => {
    // يبدأ الاستماع لـ navigator.onLine ويرفع طابور المزامنة بالخلفية
    const stop = startSyncEngine();
    return stop;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
