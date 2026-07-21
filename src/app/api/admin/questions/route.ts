import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import type { Difficulty, QuestionSource } from "@/lib/supabase/database.types";

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

  const [subjects, units, lessons, countResult] = await Promise.all([
    admin.from("subjects").select("id, name_ar, slug, track, order_index").order("order_index"),
    admin.from("units").select("id, subject_id, name_ar, order_index").order("order_index"),
    admin.from("lessons").select("id, unit_id, name_ar, order_index").order("order_index"),
    admin.from("question_bank_items").select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    subjects: subjects.data ?? [],
    units: units.data ?? [],
    lessons: lessons.data ?? [],
    totalQuestions: countResult.count ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  const body = await request.json();
  const raw: Array<{
    subject_id: string;
    unit_id: string;
    lesson_id: string;
    question_text: string;
    choices: { key: string; text: string }[];
    correct_answer: string;
    explanation_text: string;
    difficulty?: Difficulty | null;
    source?: QuestionSource | null;
    exam_year?: number | null;
  }> = Array.isArray(body) ? body : [body];

  const questions = raw.map((q) => ({
    subject_id: q.subject_id,
    unit_id: q.unit_id,
    lesson_id: q.lesson_id,
    question_text: q.question_text,
    choices: q.choices,
    correct_answer: q.correct_answer,
    explanation_text: q.explanation_text,
    difficulty: q.difficulty ?? null,
    source: q.source ?? null,
    exam_year: q.exam_year ?? null,
  }));

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("question_bank_items")
    .insert(questions)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data?.length ?? 0 });
}

export async function DELETE(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "مطلوب معرّف السؤال" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("question_bank_items").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
