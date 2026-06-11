"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SortSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  locale?: string;
}

export function SortSelect({ value, onValueChange, locale }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px] rounded-full">
        <SelectValue placeholder={locale === "ar" ? "ترتيب حسب" : "Sort By"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">{locale === "ar" ? "الأحدث" : "Newest"}</SelectItem>
        <SelectItem value="price_asc">{locale === "ar" ? "السعر: من الأقل" : "Price: Low to High"}</SelectItem>
        <SelectItem value="price_desc">{locale === "ar" ? "السعر: من الأعلى" : "Price: High to Low"}</SelectItem>
      </SelectContent>
    </Select>
  );
}
