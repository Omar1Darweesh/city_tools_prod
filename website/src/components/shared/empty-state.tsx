"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-muted-foreground/30">{icon}</div>}
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {actionLabel && actionHref && (
        <Button className="mt-6 rounded-full" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button className="mt-6 rounded-full" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
