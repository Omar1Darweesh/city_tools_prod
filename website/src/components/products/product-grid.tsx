"use client";

import type { ReactNode } from "react";

interface ProductGridProps {
  children: ReactNode;
  viewMode?: "grid" | "list";
}

export function ProductGrid({ children, viewMode = "grid" }: ProductGridProps) {
  if (viewMode === "list") {
    return <div className="flex flex-col gap-4">{children}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
