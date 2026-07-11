import { AlertCircle, CheckCircle2 } from "lucide-react";

/** رسالة خطأ (حمراء-برتقالية من العلامة) أو نجاح (خضراء). */
export function FormMessage({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;

  if (error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-input border border-strong bg-bg-surface px-4 py-3 text-secondary text-brand-400"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{error}</span>
      </p>
    );
  }

  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-input border border-strong bg-bg-surface px-4 py-3 text-secondary text-status-done"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
