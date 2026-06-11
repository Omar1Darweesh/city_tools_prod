"use client";

import type { MockCategory } from "@/data";
import { Link } from "@/i18n/routing";
import { Zap, Wrench, Bolt, Droplets, Shield, Factory, Package, Settings, Toolbox, Star } from "lucide-react";

const ICON_COMPONENT: Record<string, React.ReactNode> = {
  Zap: <Zap className="size-5 text-white" />,
  Wrench: <Wrench className="size-5 text-white" />,
  Bolt: <Bolt className="size-5 text-white" />,
  Droplets: <Droplets className="size-5 text-white" />,
  Shield: <Shield className="size-5 text-white" />,
  Factory: <Factory className="size-5 text-white" />,
  Package: <Package className="size-5 text-white" />,
  Settings: <Settings className="size-5 text-white" />,
  Tool: <Toolbox className="size-5 text-white" />,
  Star: <Star className="size-5 text-white" />,
};

function getCatIcon(icon: string): React.ReactNode {
  const key = icon ? icon.charAt(0).toUpperCase() + icon.slice(1) : "";
  return ICON_COMPONENT[key] || <Package className="size-5 text-white" />;
}

export function CategoryCard({ category, locale }: { category: MockCategory; locale: string }) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <div className="group cursor-pointer rounded-2xl border-2 border-transparent bg-card p-6 text-center transition-all duration-300 hover:border-primary hover:shadow-md hover:-translate-y-1">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl shadow-sm" style={{ background: `linear-gradient(135deg, ${category.color || "#6b7280"}, ${category.color ? category.color + "99" : "#9ca3af"})` }}>
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
            {getCatIcon(category.icon)}
          </div>
        </div>
        <h3 className="mt-4 text-sm font-semibold group-hover:text-primary transition-colors">{locale === "ar" ? category.nameAr : category.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          {category.productCount} {locale === "ar" ? "منتج" : "products"}
        </p>
      </div>
    </Link>
  );
}
