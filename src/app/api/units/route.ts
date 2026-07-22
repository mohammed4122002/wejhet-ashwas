import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const subject_id = request.nextUrl.searchParams.get("subject_id");

    if (!subject_id) {
      return NextResponse.json(
        { error: "subject_id مطلوب" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("units")
      .select("id, name_ar")
      .eq("subject_id", subject_id)
      .order("order_index", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ units: data || [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "خطأ في الخادم" },
      { status: 500 }
    );
  }
}
