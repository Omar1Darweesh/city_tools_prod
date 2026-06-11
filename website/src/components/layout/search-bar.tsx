"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export function SearchBar() {
  const t = useTranslations("Navbar");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="h-10 w-full rounded-full border-border bg-muted/50 pe-10 ps-10 text-sm focus-visible:bg-background"
          onFocus={(e) => e.currentTarget.focus()}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </form>
  );
}
