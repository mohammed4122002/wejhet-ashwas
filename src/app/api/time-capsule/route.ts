import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type LetterInsert = Database["public"]["Tables"]["time_capsule_letters"]["Insert"];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const [{ data: letter }, { data: config }] = await Promise.all([
    supabase
      .from("time_capsule_letters")
      .select("status, message, written_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("time_capsule_config")
      .select("unlock_at")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const unlockAt = config?.unlock_at ?? null;
  const unlocked = !!unlockAt && new Date(unlockAt).getTime() <= Date.now();
  const status = letter?.status ?? "none";

  return NextResponse.json({
    status,
    unlock_at: unlockAt,
    unlocked,
    written_at: letter?.written_at ?? null,
    // النص لا يُرسل إلا بعد فتح الكبسولة فعلياً — بوابة على الخادم لا الجهاز
    message: unlocked && status === "written" ? letter?.message ?? null : null,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      message?: string;
      skip?: boolean;
    };

    const { data: config } = await supabase
      .from("time_capsule_config")
      .select("unlock_at")
      .eq("id", 1)
      .maybeSingle();

    const alreadyUnlocked =
      !!config?.unlock_at && new Date(config.unlock_at).getTime() <= Date.now();
    if (alreadyUnlocked) {
      return NextResponse.json(
        { error: "خلص الوقت — الكبسولة فُتحت، ما بينكتب فيها رسالة جديدة." },
        { status: 403 }
      );
    }

    const values: LetterInsert = body.skip
      ? { user_id: user.id, status: "skipped", message: null }
      : {
          user_id: user.id,
          status: "written",
          message: (body.message ?? "").trim(),
          written_at: new Date().toISOString(),
        };

    if (!body.skip && !values.message) {
      return NextResponse.json({ error: "اكتب رسالة أولاً" }, { status: 400 });
    }

    const { error } = await supabase
      .from("time_capsule_letters")
      .upsert(values, { onConflict: "user_id" });

    if (error) {
      // انتهاك RLS (الصف موجود بحالة "written") يعني الرسالة مقفولة أصلاً
      if (error.code === "42501" || error.message.includes("policy")) {
        return NextResponse.json(
          { error: "رسالتك محفوظة ومقفولة أصلاً — ما بتقدر تعدّل عليها." },
          { status: 409 }
        );
      }
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
