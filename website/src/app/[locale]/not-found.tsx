import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Package, Home, Grid3X3 } from "lucide-react";

export const metadata = {
  title: "Page Not Found | City Tools",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <Package className="mb-6 size-20 text-muted-foreground/25" />
      <h1 className="text-3xl font-bold tracking-tight">
        {isAr ? "الصفحة غير موجودة" : "Page Not Found"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {isAr
          ? "الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
          : "The page you're looking for doesn't exist or has been moved."}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button className="rounded-full" asChild>
          <Link href="/">
            <Home className="size-4" />
            {isAr ? "الرئيسية" : "Home"}
          </Link>
        </Button>
        <Button variant="outline" className="rounded-full" asChild>
          <Link href="/products">
            <Package className="size-4" />
            {isAr ? "المنتجات" : "Products"}
          </Link>
        </Button>
        <Button variant="outline" className="rounded-full" asChild>
          <Link href="/categories">
            <Grid3X3 className="size-4" />
            {isAr ? "الأقسام" : "Categories"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
