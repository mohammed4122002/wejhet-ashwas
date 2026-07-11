import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app/app-header";
import { AppDataProvider } from "@/components/app/app-data-provider";
import { AppNav } from "@/components/app/app-nav";

/** تخطيط المنطقة المحمية (/app). middleware يضمن وجود جلسة + فرع مختار. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("track, reward_system, auto_schedule_apply")
    .eq("id", user.id)
    .maybeSingle();
  // middleware يضمن وجود الفرع، لكن دفاعاً في العمق نوجّه لو غاب
  if (!profile?.track) redirect("/onboarding/track");

  return (
    <AppDataProvider
      user={{
        userId: user.id,
        track: profile.track,
        rewardSystem: profile.reward_system,
        autoScheduleApply: profile.auto_schedule_apply,
      }}
    >
      <div className="min-h-screen">
        <AppHeader />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <AppNav />
          <main className="py-6">{children}</main>
        </div>
      </div>
    </AppDataProvider>
  );
}
