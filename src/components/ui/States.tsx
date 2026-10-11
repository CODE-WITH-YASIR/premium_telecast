import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string } | { label: string; onClick: () => void };
  className?: string;
}

function ActionButton({ action }: { action: NonNullable<StateProps["action"]> }) {
  const cls =
    "mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 active:scale-95 shadow-lg shadow-[var(--primary-glow)]";
  if ("href" in action) {
    return <Link href={action.href} className={cls}>{action.label}</Link>;
  }
  return (
    <button type="button" onClick={action.onClick} className={cls}>
      <RefreshCw className="h-4 w-4" />
      {action.label}
    </button>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: StateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-base)] px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] border border-[var(--border-default)]">
        <Icon className="h-7 w-7 text-[var(--text-tertiary)]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-tertiary)]">
          {description}
        </p>
      )}
      {action && <ActionButton action={action} />}
    </div>
  );
}

export function ErrorState({ title, description, action, className }: StateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-900/40 bg-red-950/10 px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-950/40 border border-red-800/30">
        <AlertTriangle className="h-7 w-7 text-red-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-red-300/70">{description}</p>
      )}
      {action && <ActionButton action={action} />}
    </div>
  );
}
