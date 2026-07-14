"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { loginAction, type AuthState } from "../actions";
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
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";

const initial: AuthState = {};

function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initial);
  const params = useSearchParams();
  const next = params.get("next") ?? "/app";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h1">تسجيل الدخول</CardTitle>
        <CardDescription>أهلاً برجوعك. أكمل رحلتك من حيث وقفت.</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleButton label="الدخول عبر Google" />
        <OrDivider />
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">كلمة المرور</Label>
              <Link
                href="/forgot-password"
                className="text-secondary text-brand-400 hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              required
            />
          </div>

          <FormMessage error={state.error} message={state.message} />

          <SubmitButton size="lg" className="mt-2 w-full">
            دخول
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-secondary text-text-secondary">
          ما عندك حساب؟{" "}
          <Link href="/signup" className="text-brand-400 hover:underline">
            أنشئ حساباً
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
