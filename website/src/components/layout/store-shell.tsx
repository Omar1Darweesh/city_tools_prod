"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide store header/footer on admin routes (any locale)
  const isAdmin = pathname.includes("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
