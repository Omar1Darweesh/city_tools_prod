"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useSession } from "@/components/providers/session-provider";
import { Settings } from "lucide-react";

export function AdminLink() {
  const { isLoggedIn } = useSession();
  const locale = useLocale();
  if (!isLoggedIn) return null;
  return (
    <Link href="/admin" className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title={locale === "ar" ? "لوحة التحكم" : "Admin"}>
      <Settings className="size-4" />
    </Link>
  );
}
