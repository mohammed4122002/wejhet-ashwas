import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🖼️ Image extraction request received");

    const body = await request.json() as { material_id?: string };
    const { material_id } = body;

    if (!material_id) {
      console.error("❌ No material_id provided");
      return NextResponse.json(
        { error: "material_id مطلوب" },
        { status: 400 }
      );
    }

    console.log("📥 Fetching material:", material_id);

    const supabase = await createClient();
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("*")
      .eq("id", material_id)
      .single();

    if (materialError || !material) {
      console.error("❌ Material not found:", materialError);
      return NextResponse.json(
        { error: "الملف غير موجود" },
        { status: 404 }
      );
    }

    console.log("✅ Material found:", material.title);

    // تحقق من OPENAI_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("❌ OPENAI_API_KEY not found");
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY غير موجود - أضفه في Vercel Environment Variables",
          debug: "تحقق من: https://vercel.com/dashboard/wejhet-ashwas/settings/environment-variables"
        },
        { status: 500 }
      );
    }

    console.log("🔗 File URL:", material.file_url);

    // تحميل الملف (PDF أو صورة)
    let imageUrl = material.file_url;

    // إذا كان الملف من Google Drive، نحتاج لتحويل الرابط
    if (material.source_type === "external_link" && material.file_url.includes("drive.google.com")) {
      // تحويل رابط Google Drive إلى رابط direct download
      const fileId = material.file_url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        console.log("🔄 Converted Google Drive URL");
      }
    }

    console.log("🤖 Calling OpenAI Vision API...");

    // استدعاء OpenAI Vision API لقراءة الصور
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "أنت متخصص في استخراج وتحسين أسئلة الامتحانات من الصور. أرجع دائماً JSON صحيح.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildVisionPrompt(material),
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    console.log("📊 OpenAI Response status:", openaiResponse.status);

    if (!openaiResponse.ok) {
      const openaiError = await openaiResponse.json();
      console.error("❌ OpenAI error:", openaiError);
      return NextResponse.json(
        {
          error: `خطأ من OpenAI: ${openaiError.error?.message || "غير معروف"}`,
          debug: JSON.stringify(openaiError).substring(0, 500),
        },
        { status: 500 }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content || "";

    console.log("📝 OpenAI Response length:", content.length);

    // تحليل النتيجة
    let extractedData: Record<string, unknown> = { questions: [] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
        console.log("✅ JSON parsed successfully, questions:", (extractedData.questions as unknown[])?.length || 0);
      } else {
        console.warn("⚠️ No JSON found in response");
        console.log("Response content:", content.substring(0, 200));
      }
    } catch (parseErr) {
      console.error("❌ Failed to parse OpenAI response:", parseErr);
      console.log("Raw response:", content);
      return NextResponse.json(
        {
          error: "فشل تحليل رد OpenAI - قد تكون الصورة غير واضحة أو لا تحتوي على أسئلة",
          debug: content.substring(0, 300),
        },
        { status: 500 }
      );
    }

    const questions = Array.isArray(extractedData.questions) ? extractedData.questions : [];

    console.log(`✅ Success! Extracted ${questions.length} questions`);

    return NextResponse.json({
      success: true,
      extracted_questions: questions,
      material: {
        id: material.id,
        title: material.title,
        file_type: material.file_type,
      },
      message: `تم استخراج ${questions.length} أسئلة من الصور بنجاح`,
    });
  } catch (e) {
    console.error("❌ Image extraction error:", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "فشل الاستخراج من الصور",
        debug: e instanceof Error ? e.stack?.substring(0, 300) : "unknown error"
      },
      { status: 500 }
    );
  }
}

function buildVisionPrompt(material: Record<string, unknown>): string {
  return `أنت متخصص في استخراج أسئلة الامتحانات من الصور والملفات.

البيانات:
- الملف: ${material.title}
- المادة: ${material.subject || "غير محددة"}
- نوع الملف: ${material.file_type}

المطلوب:
1. اقرأ جميع الأسئلة الموجودة في الصورة
2. استخرج نص كل سؤال بالكامل
3. حسّن صياغة النصوص (إملاء، تركيب، وضوح)
4. استخرج الخيارات (أ، ب، ج، د) إن وجدت
5. حدّد مستوى الصعوبة (easy, medium, hard)

ملاحظات:
- إذا كانت الكتابة غير واضحة، حاول قراءتها بأفضل ما يمكنك
- احرص على الدقة في نقل الأسئلة
- لا تضيف أسئلة من عندك، فقط استخرج الموجودة

أرجع النتيجة بصيغة JSON صحيحة:
{
  "questions": [
    {
      "original_text": "النص الأصلي للسؤال كما في الصورة",
      "improved_text": "النص المحسّن والمصحح",
      "choices": [
        {"key": "أ", "text": "الخيار الأول"},
        {"key": "ب", "text": "الخيار الثاني"},
        {"key": "ج", "text": "الخيار الثالث"},
        {"key": "د", "text": "الخيار الرابع"}
      ],
      "difficulty": "medium"
    }
  ]
}`;
}
