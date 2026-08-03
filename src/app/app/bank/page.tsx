import { redirect } from "next/navigation";
import { QUESTION_BANK_ENABLED } from "@/lib/domain/feature-flags";
import { BankClient } from "./bank-client";

/** الوصول المباشر للرابط محجوب أيضاً طالما المفتاح مطفأ، لا التنقّل فقط. */
export default function BankPage() {
  if (!QUESTION_BANK_ENABLED) redirect("/app");
  return <BankClient />;
}
