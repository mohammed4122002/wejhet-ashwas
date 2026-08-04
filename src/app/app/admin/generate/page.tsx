import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { QUESTION_BANK_ENABLED } from "@/lib/domain/feature-flags";
import { GenerateQuestionsClient } from "./generate-client";

export default async function GenerateQuestionsPage() {
  await requireAdmin();
  if (!QUESTION_BANK_ENABLED) redirect("/app/admin");
  return <GenerateQuestionsClient />;
}
