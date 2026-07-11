import { BookOpen, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REWARD_SYSTEMS, TRACKS } from "@/lib/domain/constants";
import type { SubjectTrack } from "@/lib/supabase/database.types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("track, reward_system")
    .eq("id", user!.id)
    .maybeSingle();

  // مواد الطالب = المشتركة + مواد فرعه (RLS يسمح بالقراءة العامة للمنهج)
  const trackFilter: SubjectTrack[] = profile?.track
    ? ["shared", profile.track]
    : ["shared"];
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name_ar, slug, track")
    .in("track", trackFilter)
    .order("order_index");

  const trackLabel =
    TRACKS.find((t) => t.value === profile?.track)?.label ?? "—";
  const rewardLabel =
    REWARD_SYSTEMS.find((r) => r.value === profile?.reward_system)?.label ?? "—";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-h1 text-text-primary">مرحباً بك 👋</h1>
        <p className="text-body text-text-secondary">
          فرعك: <span className="text-text-primary">{trackLabel}</span> · نظام
          المكافأة: <span className="text-text-primary">{rewardLabel}</span>
        </p>
      </section>

      {/* مواد الطالب حسب فرعه (بيانات المنهج البذرية) */}
      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-h2 text-text-primary">
          <BookOpen className="size-5 text-brand-400" aria-hidden />
          موادك
        </h2>

        {subjects && subjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Card key={s.id} className="transition-colors hover:border-brand-400">
                <CardHeader>
                  <CardTitle>{s.name_ar}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary text-text-muted">
                    {s.track === "shared" ? "مادة مشتركة" : trackLabel}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Compass className="size-8 text-text-muted" aria-hidden />
              <p className="text-body text-text-secondary">
                لسا ما توفّرت بيانات المواد. رح تظهر هون بعد تطبيق مخطط قاعدة
                البيانات وتشغيل بيانات المنهج البذرية.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ملاحظة صادقة عن مرحلة البناء الحالية (الجلسة 1 — الأساس) */}
      <Card className="border-brand-500/30">
        <CardHeader>
          <CardTitle className="text-h3">الخطوة الجاية</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-text-secondary">
            خلّصنا الأساس: الدخول، اختيار الفرع، وطبقة العمل بدون إنترنت. حلقة
            الاستخدام اليومي (الجدولة، مهام اليوم، البومودورو، صندوق الشكوك) رح
            تنبني بالجلسة الجاية.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
