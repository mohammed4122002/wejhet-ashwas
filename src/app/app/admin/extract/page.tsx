import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { QUESTION_BANK_ENABLED } from "@/lib/domain/feature-flags";
import { ExtractQuestionsClient } from "./extract-client";

export default async function ExtractQuestionsPage() {
  await requireAdmin();
  if (!QUESTION_BANK_ENABLED) redirect("/app/admin");
  return <ExtractQuestionsClient />;
}
