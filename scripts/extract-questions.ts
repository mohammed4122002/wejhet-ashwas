import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function extractQuestionsFromMaterials() {
  console.log("جاري استخراج الأسئلة من الملفات...\n");

  // احصل على قائمة الملفات
  const { data: materials, error: materialsError } = await supabase
    .from("materials")
    .select("*")
    .order("created_at", { ascending: false });

  if (materialsError) {
    console.error("خطأ في جلب الملفات:", materialsError);
    process.exit(1);
  }

  if (!materials || materials.length === 0) {
    console.log("لا توجد ملفات مرفوعة");
    return;
  }

  console.log(`وجدت ${materials.length} ملف\n`);

  for (const material of materials) {
    console.log(`📄 ${material.title}`);
    console.log(`   النوع: ${material.file_type}`);
    console.log(`   المادة: ${material.subject}`);
    console.log(`   الرابط: ${material.file_url}\n`);
  }
}

extractQuestionsFromMaterials();
