import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const unit_id = request.nextUrl.searchParams.get("unit_id");

    if (!unit_id) {
      return NextResponse.json(
        { error: "unit_id مطلوب" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lessons")
      .select("id, name_ar")
      .eq("unit_id", unit_id)
      .order("order_index", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lessons: data || [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "خطأ في الخادم" },
      { status: 500 }
    );
  }
}
