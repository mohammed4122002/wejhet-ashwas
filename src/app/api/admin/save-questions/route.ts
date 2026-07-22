import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

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

export async function POST(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  try {
    const body = await request.json() as {
      subject_id: string;
      unit_id?: string;
      lesson_id?: string;
      questions: Record<string, unknown>[];
    };
    const { subject_id, unit_id, lesson_id, questions } = body;

    if (!subject_id || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "البيانات المطلوبة ناقصة" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // تحضير الأسئلة للإدراج
    const questionsToInsert: Database["public"]["Tables"]["question_bank_items"]["Insert"][] =
      questions.map((q) => {
        const difficulty = String(q.difficulty || "medium");
        const isValidDifficulty = ["easy", "medium", "hard"].includes(difficulty);
        return {
          subject_id,
          unit_id: unit_id || null,
          lesson_id: lesson_id || null,
          question_text: String(q.question_text),
          choices: q.choices as Json,
          correct_answer: String(q.correct_answer),
          explanation_text: String(q.explanation_text),
          difficulty: (isValidDifficulty ? difficulty : "medium") as "easy" | "medium" | "hard",
          source: "practice",
          skill_type: "understanding",
        };
      });

    const { data, error } = await admin
      .from("question_bank_items")
      .insert(questionsToInsert)
      .select("id");

    if (error) {
      console.error("Database insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      message: `تم حفظ ${data?.length || 0} أسئلة`,
    });
  } catch (e) {
    console.error("Save questions error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل الحفظ" },
      { status: 500 }
    );
  }
}
