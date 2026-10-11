import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox } from "lucide-react";
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
  const className =
    "mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-black transition hover:bg-primary-hover active:scale-95";
  if ("href" in action) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: StateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/40 px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-secondary">
        <Icon className="h-6 w-6 text-muted" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
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
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-950/40">
        <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <ActionButton action={action} />}
    </div>
  );
}
