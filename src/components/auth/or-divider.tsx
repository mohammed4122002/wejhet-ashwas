/** فاصل "أو" بين نموذج البريد وزر Google. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden>
      <span className="h-px flex-1 bg-[color:var(--border-subtle)]" />
      <span className="text-secondary text-text-muted">أو</span>
      <span className="h-px flex-1 bg-[color:var(--border-subtle)]" />
    </div>
  );
}
