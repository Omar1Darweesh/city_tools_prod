import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string, locale: string = "ar") {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(num);
}
