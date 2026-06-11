"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  linkHref?: string;
  linkLabel?: string;
  locale?: string;
  children?: ReactNode;
}

export function SectionHeader({ title, linkHref, linkLabel, locale }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-2xl font-bold">{title}</h2>
      {linkHref && linkLabel && (
        <Link
          href={linkHref}
          className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {linkLabel}
          {locale === "ar" ? (
            <ArrowRight className="size-4" />
          ) : (
            <ArrowLeft className="size-4" />
          )}
        </Link>
      )}
    </div>
  );
}
