"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { signupAction, type AuthState } from "../actions";
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

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h1">أنشئ حسابك</CardTitle>
        <CardDescription>
          خطوة وحدة بس، وبعدها تختار فرعك وتبدأ.
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              minLength={6}
              required
            />
            <p className="text-secondary text-text-muted">
              6 أحرف على الأقل.
            </p>
          </div>

          <FormMessage error={state.error} message={state.message} />

          <SubmitButton size="lg" className="mt-2 w-full">
            إنشاء الحساب
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-secondary text-text-secondary">
          عندك حساب؟{" "}
          <Link href="/login" className="text-brand-400 hover:underline">
            سجّل الدخول
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
