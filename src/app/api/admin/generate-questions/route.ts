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

export async function POST(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      subject_id,
      subject_name,
      unit_id,
      lesson_id,
      count = 5,
      difficulty,
      scope = "general", // general, unit, lesson
    } = body;

    if (!subject_id || !subject_name) {
      return NextResponse.json(
        { error: "المادة مطلوبة" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // جمع المصادر والأسئلة الموجودة
    let sourceMaterials = "";

    // احصل على الملفات المحفوظة للمادة
    const { data: materials } = await admin
      .from("materials")
      .select("title, description, subject")
      .eq("subject", subject_name)
      .limit(5);

    if (materials && materials.length > 0) {
      sourceMaterials = `الملفات المحفوظة:\n${materials
        .map((m) => `- ${m.title}: ${m.description || ""}`)
        .join("\n")}\n\n`;
    }

    // احصل على الأسئلة الموجودة للمادة
    let questionQuery = admin
      .from("question_bank_items")
      .select("question_text, choices, correct_answer, explanation_text")
      .eq("subject_id", subject_id)
      .limit(10);

    if (unit_id && scope !== "general") {
      questionQuery = questionQuery.eq("unit_id", unit_id);
    }

    if (lesson_id && scope === "lesson") {
      questionQuery = questionQuery.eq("lesson_id", lesson_id);
    }

    const { data: questions } = await questionQuery;
    const existingQuestions: Record<string, unknown>[] = questions || [];

    // بناء السياق للـ AI
    const contextPrompt = `أنت خبير في إنشاء أسئلة امتحانات شاملة عالية الجودة للطلاب الفلسطينيين في التوجيهي.

المادة: ${subject_name}
النطاق: ${scope === "lesson" ? "درس محدد" : scope === "unit" ? "وحدة" : "المادة كاملة"}
عدد الأسئلة المطلوبة: ${count}
${difficulty ? `المستوى: ${difficulty}` : ""}

${sourceMaterials}

${
  existingQuestions.length > 0
    ? `أمثلة من الأسئلة الموجودة بالمادة (لا تكررها، لكن افهم أسلوبها):
${existingQuestions
  .slice(0, 3)
  .map((q) => `السؤال: ${q.question_text}\nالإجابة الصحيحة: ${q.correct_answer}`)
  .join("\n\n")}\n\n`
    : ""
}

الآن أنشئ ${count} أسئلة متعددة الخيارات (أ، ب، ج، د) عن المادة "${subject_name}".

الصيغة المطلوبة (JSON):
[
  {
    "question_text": "نص السؤال",
    "choices": [
      {"key": "أ", "text": "الخيار الأول"},
      {"key": "ب", "text": "الخيار الثاني"},
      {"key": "ج", "text": "الخيار الثالث"},
      {"key": "د", "text": "الخيار الرابع"}
    ],
    "correct_answer": "أ",
    "explanation_text": "شرح الإجابة الصحيحة",
    "difficulty": "${difficulty || "medium"}"
  }
]

أنشئ الأسئلة الآن:`;

    // استدعاء OpenAI API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY غير مُعرّف" },
        { status: 500 }
      );
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "أنت مساعد متخصص في إنشاء أسئلة امتحانات عالية الجودة للطلاب الفلسطينيين. أرجع دائماً JSON صحيح بصيغة الأسئلة المطلوبة.",
          },
          {
            role: "user",
            content: contextPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const openaiError = await openaiResponse.json();
      console.error("OpenAI error:", openaiError);
      return NextResponse.json(
        {
          error: `خطأ من OpenAI: ${openaiError.error?.message || "غير معروف"}`,
        },
        { status: 500 }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content || "";

    // استخراج JSON من الرد
    let generatedQuestions: Record<string, unknown>[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedQuestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error("Failed to parse OpenAI response:", parseErr);
      return NextResponse.json(
        { error: "فشل تحليل رد OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: generatedQuestions,
      sourceCount: materials?.length || 0,
      existingQuestionsCount: existingQuestions.length,
      message: `تم توليد ${generatedQuestions.length} أسئلة`,
    });
  } catch (e) {
    console.error("Generate questions error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل التوليد" },
      { status: 500 }
    );
  }
}
