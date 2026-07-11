"use client";

import { useFormState } from "react-dom";
import { updatePasswordAction, type AuthState } from "../actions";
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

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(updatePasswordAction, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h1">كلمة مرور جديدة</CardTitle>
        <CardDescription>اختر كلمة مرور جديدة لحسابك.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              minLength={6}
              required
            />
            <p className="text-secondary text-text-muted">6 أحرف على الأقل.</p>
          </div>

          <FormMessage error={state.error} message={state.message} />

          <SubmitButton size="lg" className="mt-2 w-full">
            حفظ كلمة المرور
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
