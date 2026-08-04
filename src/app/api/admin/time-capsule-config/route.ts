import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    return null;
  }
  return user;
}

export async function GET() {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("time_capsule_config")
    .select("unlock_at, notified_at, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ config: data });
}

export async function PATCH(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  try {
    const { unlock_at } = (await request.json()) as { unlock_at?: string };
    if (!unlock_at || Number.isNaN(new Date(unlock_at).getTime())) {
      return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("time_capsule_config")
      .update({
        unlock_at,
        // نُعيد ضبط علم الإرسال حتى لو غيّرنا التاريخ بعد إرسال سابق
        notified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل الحفظ" },
      { status: 500 }
    );
  }
}
