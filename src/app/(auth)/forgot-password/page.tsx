"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { requestResetAction, type AuthState } from "../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { FormMessage } from "@/components/auth/form-message";

const initial: AuthState = {};

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(requestResetAction, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h1">استعادة كلمة المرور</CardTitle>
        <CardDescription>
          أدخل بريدك ونبعتلك رابط لإعادة التعيين.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              dir="ltr"
              required
            />
          </div>

          <FormMessage error={state.error} message={state.message} />

          <SubmitButton size="lg" className="mt-2 w-full">
            أرسل الرابط
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-secondary text-text-secondary">
          <Link href="/login" className="text-brand-400 hover:underline">
            رجوع لتسجيل الدخول
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
