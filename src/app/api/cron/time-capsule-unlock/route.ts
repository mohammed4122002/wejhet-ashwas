import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * يُستدعى يومياً عبر Vercel Cron (راجع vercel.json). لما يحين تاريخ فتح
 * كبسولة الزمن ولسا ما أُرسل الإشعار، يبعت Push لكل طالب كتب رسالة فعلاً —
 * ثم يسجّل notified_at حتى لا يتكرّر الإرسال. محمي بـ CRON_SECRET كي لا
 * يُستدعى الرابط علناً.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return NextResponse.json(
      { error: "مفاتيح VAPID غير مُعرَّفة" },
      { status: 500 }
    );
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const admin = createAdminClient();

  const { data: config } = await admin
    .from("time_capsule_config")
    .select("unlock_at, notified_at")
    .eq("id", 1)
    .maybeSingle();

  if (!config) {
    return NextResponse.json({ skipped: "no config" });
  }
  const unlocked = new Date(config.unlock_at).getTime() <= Date.now();
  if (!unlocked || config.notified_at) {
    return NextResponse.json({
      skipped: !unlocked ? "not yet unlocked" : "already notified",
    });
  }

  // فقط الطلاب اللي كتبوا رسالة فعلاً — ما في داعي نزعج اللي تجاوزوها
  const { data: writers } = await admin
    .from("time_capsule_letters")
    .select("user_id")
    .eq("status", "written");

  const userIds = (writers ?? []).map((w) => w.user_id);
  if (userIds.length === 0) {
    await admin
      .from("time_capsule_config")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", 1);
    return NextResponse.json({ sent: 0, reason: "no letters written" });
  }

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  const payload = JSON.stringify({
    title: "وصلتك رسالة من الماضي 💌",
    body: "كتبت رسالة لنفسك قبل سنة — افتحها الآن.",
    url: "/app/time-capsule",
  });

  let sent = 0;
  const staleIds: string[] = [];

  await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (e) {
        const statusCode = (e as { statusCode?: number }).statusCode;
        // 404/410 = الاشتراك لم يعد صالحاً (المتصفح ألغاه) — ننظّفه
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id);
        }
      }
    })
  );

  if (staleIds.length) {
    await admin.from("push_subscriptions").delete().in("id", staleIds);
  }

  await admin
    .from("time_capsule_config")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", 1);

  return NextResponse.json({
    sent,
    stale_removed: staleIds.length,
    eligible_users: userIds.length,
  });
}
