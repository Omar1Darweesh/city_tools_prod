"use client";

import { Link } from "@/i18n/routing";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, locale }: { items: BreadcrumbItem[]; locale: string }) {
  const ArrowIcon = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ArrowIcon className="size-3.5" />}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
