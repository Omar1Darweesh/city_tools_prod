"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { store } from "@/data";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { productDetailPath } from "@/lib/product-url";
import ProductImage from "@/components/products/product-image";
import Image from "next/image";
import { ShoppingCart, Star, Check, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Zap, Wrench, Shield, Truck, BadgePercent, HeadphonesIcon, Package, Bolt, Droplets, Factory, Settings, Toolbox, DollarSign } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { buildLogoByName, getCategoryLogo } from "@/lib/brand-logo";
import { formatPrice, normalizeRating } from "@/lib/format-price";
import { groupSubcategoriesByName, subcategoryGroupProductsHref } from "@/lib/subcategory-groups";
import type { MockProduct, MockCategory, MockSubcategory, MockBrand, MockStatistic, MockDiscountCard } from "@/data";

/* ─── helpers ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(36px)", transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── default hero slides (fallback) ─── */
const defaultHeroSlides = [
  { bg: "from-[#0f1923] via-[#1a2535] to-[#0f1923]", titleAr: "أدوات المحترفين", titleEn: "Professional Tools", subAr: "جودة لا تُضاهى · أسعار تنافسية · توصيل سريع", subEn: "Unmatched quality · Competitive prices · Fast delivery", accent: "#C0161B", tag: "500+ منتج", tagEn: "500+ Products", bgImg: "/assets/1.jpg" },
  { bg: "from-[#1a0808] via-[#2a1010] to-[#1a0808]", titleAr: "خصومات حصرية", titleEn: "Exclusive Deals", subAr: "تخفيضات تصل إلى 30% على أفضل الماركات العالمية", subEn: "Up to 30% off on top global brands", accent: "#C0161B", tag: "عروض محدودة", tagEn: "Limited Offers", bgImg: "/assets/2.jpg" },
  { bg: "from-[#0a1020] via-[#0f1830] to-[#0a1020]", titleAr: "ماركات عالمية", titleEn: "Global Brands", subAr: "بوش · ماكيتا · ديوالت · ستانلي وأكثر", subEn: "Bosch · Makita · DeWalt · Stanley & more", accent: "#C0161B", tag: "11+ ماركة", tagEn: "11+ Brands", bgImg: "/assets/3.jpg" },
];

const HERO_HEIGHT_CLASS = "h-[440px] sm:h-[500px] lg:h-[540px]";

function mapHeroSlide(s: Record<string, unknown>) {
  return {
    ...s,
    tag: (s.tagAr as string) || (s.tag as string) || (s.tagEn as string) || "",
    tagEn: (s.tagEn as string) || (s.tag as string) || "",
    bg: (s.bgGradient as string) || (s.bg as string) || "from-[#0f1923] via-[#1a2535] to-[#0f1923]",
    bgImg: (s.bgImg as string) || "/assets/1.jpg",
    accent: (s.accent as string) || "#C0161B",
  };
}

/* ─── icon map ─── */
const ICON_COMPONENT: Record<string, React.ReactNode> = {
  Zap: <Zap className="size-7 text-white" />,
  Wrench: <Wrench className="size-7 text-white" />,
  Bolt: <Bolt className="size-7 text-white" />,
  Droplets: <Droplets className="size-7 text-white" />,
  Shield: <Shield className="size-7 text-white" />,
  Factory: <Factory className="size-7 text-white" />,
  Package: <Package className="size-7 text-white" />,
  Settings: <Settings className="size-7 text-white" />,
  Toolbox: <Toolbox className="size-7 text-white" />,
  Star: <Star className="size-7 text-white" />,
};

function getCatIcon(cat: MockCategory): React.ReactNode {
  const key = cat.icon ? cat.icon.charAt(0).toUpperCase() + cat.icon.slice(1) : "";
  return ICON_COMPONENT[key] || <Package className="size-7 text-white" />;
}

const SUBCAT_ICON_KEYS = ["Wrench", "Zap", "Bolt", "Droplets", "Shield", "Factory", "Package", "Settings", "Toolbox"];
const SUBCAT_COLORS = ["#f97316", "#22c55e", "#eab308", "#06b6d4", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"];

function getSubcatIcon(index: number): React.ReactNode {
  const key = SUBCAT_ICON_KEYS[index % SUBCAT_ICON_KEYS.length];
  return ICON_COMPONENT[key] || <Package className="size-7 text-white" />;
}

function CircleScroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-scroll-x -mx-4 px-4 sm:mx-0 sm:px-0 pb-3">
      <div className="flex gap-4 sm:gap-6 w-max min-w-full snap-x snap-mandatory">
        {children}
      </div>
    </div>
  );
}

/* ─── product card ─── */
function ProductCard({ product, locale }: { product: MockProduct; locale: string }) {
  const isRtl = locale === "ar";
  const price = product.discountPrice ?? product.priceRetail;
  const rating = normalizeRating(product.rating);
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const gradient = "from-gray-500 to-gray-600";
  const pct = product.discountPrice ? Math.round((1 - product.discountPrice / product.priceRetail) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id: product.id, nameEn: product.nameEn, nameAr: product.nameAr, price, categoryId: product.categoryId, image: product.images?.[0] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card flex w-52 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-56">
      <Link href={productDetailPath(product)} className="relative block shrink-0">
        <div className="relative h-44 overflow-hidden">
          {product.images?.[0] ? (
            <ProductImage src={product.images[0]} alt="" fill className="object-cover" sizes="224px" />
          ) : null}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${product.images?.[0] ? "opacity-60" : ""}`} />
          {!product.images?.[0] && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="size-10">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            </div>
          )}
          {pct > 0 && <span className="discount-badge">-{pct}%</span>}
          {product.badge === "NEW" && !product.discountPrice && <span className="new-badge">{locale === "ar" ? "جديد" : "NEW"}</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex flex-1 flex-col">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{product.brand || "\u00A0"}</p>
          <Link href={productDetailPath(product)}>
            <h3 className="mt-0.5 min-h-[2.75rem] line-clamp-2 text-sm font-semibold leading-snug transition-colors hover:text-primary">
              {locale === "ar" ? product.nameAr : product.nameEn}
            </h3>
          </Link>
          <div className="mt-1.5 flex h-4 items-center gap-0.5">
            {rating > 0 ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`size-3 ${i < Math.floor(rating) ? "star-filled" : "star-empty"}`} />
                ))}
                <span className="ms-1 text-[10px] text-muted-foreground">({rating.toFixed(1)})</span>
              </>
            ) : null}
          </div>
          <div className="mt-2 min-h-[2.5rem]">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-base font-bold text-primary">{formatPrice(price, locale)}</span>
              {product.discountPrice && (
                <span className="text-xs text-muted-foreground line-through">{formatPrice(product.priceRetail, locale)}</span>
              )}
            </div>
            <p className={`mt-0.5 text-[10px] ${product.inStock ? "text-emerald-600" : "text-destructive"}`}>
              {product.inStock ? (isRtl ? "متوفر" : "In stock") : (isRtl ? "غير متوفر" : "Out of stock")}
            </p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={!product.inStock}
          className={`add-btn mt-2 flex h-8 w-full shrink-0 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${added ? "bg-emerald-500 text-white" : "bg-primary text-white hover:bg-red-700"}`}
        >
          {added ? <><Check className="size-3.5" />{locale === "ar" ? "تمت الإضافة" : "Added"}</> : <><ShoppingCart className="size-3.5" />{locale === "ar" ? "أضف للسلة" : "Add to Cart"}</>}
        </button>
      </div>
    </div>
  );
}

/* ─── section header ─── */
function SectionTitle({ ar, en, link, locale }: { ar: string; en: string; link?: string; locale: string }) {
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold gold-underline">{locale === "ar" ? ar : en}</h2>
      </div>
      {link && (
        <Link href={link} className="view-all-link">
          {locale === "ar" ? "عرض الكل" : "View All"} <ArrowIcon className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

/* ─── horizontal scroller ─── */
function HScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 250, behavior: "smooth" });
  return (
    <div className="relative group/scroll">
      <button onClick={() => scroll(-1)} className="absolute start-0 top-1/2 -translate-y-1/2 z-10 hidden group-hover/scroll:flex items-center justify-center size-9 rounded-full bg-white border border-border shadow-md hover:bg-primary hover:text-white hover:border-primary transition-all -translate-x-3">
        <ChevronLeft className="size-4" />
      </button>
      <div ref={ref} className="scroll-row">{children}</div>
      <button onClick={() => scroll(1)} className="absolute end-0 top-1/2 -translate-y-1/2 z-10 hidden group-hover/scroll:flex items-center justify-center size-9 rounded-full bg-white border border-border shadow-md hover:bg-primary hover:text-white hover:border-primary transition-all translate-x-3">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/* ─── hero slider ─── */
function HeroSlider({ slides, locale }: { slides: any[]; locale: string }) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const total = slides.length;
  const ArrowPrev = locale === "ar" ? ChevronRight : ChevronLeft;
  const ArrowNext = locale === "ar" ? ChevronLeft : ChevronRight;

  const go = useCallback((idx: number) => {
    if (animating || total === 0) return;
    setAnimating(true);
    setTimeout(() => { setActive((idx + total) % total); setAnimating(false); }, 400);
  }, [animating, total]);

  useEffect(() => {
    if (total === 0) return;
    const t = setInterval(() => go(active + 1), 5000);
    return () => clearInterval(t);
  }, [active, go, total]);

  useEffect(() => {
    slides.forEach((s) => {
      const src = s.bgImg as string | undefined;
      if (src) {
        const img = new window.Image();
        img.src = src;
      }
    });
  }, [slides]);

  if (total === 0) {
    return <section className={`relative w-full overflow-hidden bg-muted animate-pulse ${HERO_HEIGHT_CLASS}`} aria-hidden />;
  }

  const slide = slides[active];
  const bgUnoptimized = typeof slide.bgImg === "string" && slide.bgImg.startsWith("/uploads/");

  return (
    <section className={`relative w-full overflow-hidden ${HERO_HEIGHT_CLASS}`} aria-label="Hero">
      {/* Background — fixed to hero bounds so slide changes never resize the section */}
      <div className="absolute inset-0">
        <Image
          src={slide.bgImg}
          alt=""
          fill
          unoptimized={bgUnoptimized}
          className="object-cover object-center"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "scale(1.03)" : "scale(1)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
          priority
          sizes="100vw"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`}
          style={{
            opacity: animating ? 0 : 0.75,
            transform: animating ? "scale(1.03)" : "scale(1)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        />
        <div className="absolute top-10 end-10 size-64 rounded-full opacity-10 animate-float pointer-events-none" style={{ background: `radial-gradient(circle, ${slide.accent}, transparent)` }} />
        <div className="absolute bottom-0 start-20 size-40 rounded-full opacity-10 animate-float-delayed pointer-events-none" style={{ background: `radial-gradient(circle, ${slide.accent}, transparent)` }} />
        <div className="absolute top-1/2 start-1/2 size-24 border border-white/10 rounded-2xl rotate-45 animate-pulse-slow pointer-events-none" />
      </div>

      {/* Content — fixed vertical space so text length does not change hero height */}
      <div className="relative z-10 h-full mx-auto max-w-7xl px-4 sm:px-10 lg:px-16 flex items-center">
        <div
          className="max-w-xl w-full min-h-[200px] sm:min-h-[260px] flex flex-col justify-center"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateX(40px)" : "translateX(0)",
            transition: "opacity 0.45s ease, transform 0.45s ease",
          }}
        >
          <span className="inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold mb-3 sm:mb-5 animate-badge-pop w-fit" style={{ background: slide.accent + "25", color: slide.accent, border: `1px solid ${slide.accent}40` }}>
            ✦ {locale === "ar" ? slide.tag : slide.tagEn}
          </span>
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-3 sm:mb-4 line-clamp-3">
            {locale === "ar" ? slide.titleAr : slide.titleEn}
          </h1>
          <p className="text-white/70 text-sm sm:text-lg leading-relaxed mb-5 sm:mb-8 line-clamp-2">
            {locale === "ar" ? slide.subAr : slide.subEn}
          </p>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <Link href="/products" className="inline-flex items-center gap-2 rounded-full px-5 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-lg transition-all hover:scale-105 animate-glow-pulse" style={{ background: slide.accent, color: "#fff" }}>
              {locale === "ar" ? "تسوق الآن" : "Shop Now"}
            </Link>
            <Link href="/categories" className="inline-flex items-center gap-2 rounded-full px-5 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border border-white/20 text-white hover:bg-white/10 transition-all">
              {locale === "ar" ? "تصفح الأقسام" : "Browse Categories"}
            </Link>
          </div>
        </div>
      </div>

      {total > 1 && (
        <>
          <button type="button" onClick={() => go(active - 1)} className="absolute z-20 start-2 sm:start-4 top-1/2 -translate-y-1/2 flex size-9 sm:size-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/25 transition-all backdrop-blur-sm" aria-label="Previous slide">
            <ArrowPrev className="size-4" />
          </button>
          <button type="button" onClick={() => go(active + 1)} className="absolute z-20 end-2 sm:end-4 top-1/2 -translate-y-1/2 flex size-9 sm:size-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/25 transition-all backdrop-blur-sm" aria-label="Next slide">
            <ArrowNext className="size-4" />
          </button>
          <div className="absolute z-20 bottom-4 sm:bottom-5 inset-x-0 flex justify-center px-4">
            <div className="mobile-scroll-x max-w-full">
              <div className="flex w-max gap-2 px-1">
                {slides.map((_, i) => (
                  <button key={i} type="button" onClick={() => go(i)} aria-label={`Slide ${i + 1}`} className="shrink-0 rounded-full transition-all" style={{ width: i === active ? 24 : 8, height: 8, background: i === active ? slide.accent : "rgba(255,255,255,0.35)" }} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/* ─── trust bar ─── */
const TRUST_ICONS: Record<string, React.ComponentType<any>> = {
  Truck, Shield, BadgePercent, HeadphonesIcon,
  Zap, Wrench, Package, Bolt, Droplets, Factory, Settings, Toolbox, Star,
  ShoppingCart, Check, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, DollarSign,
};

/* ─── main page ─── */
export default function HomePage() {
  const locale = useLocale();
  const [cats, setCats] = useState<MockCategory[]>([]);
  const [subcats, setSubcats] = useState<MockSubcategory[]>([]);
  const [brandLogos, setBrandLogos] = useState<MockBrand[]>([]);
  const [statistics, setStatistics] = useState<MockStatistic[]>([]);
  const [discountCards, setDiscountCards] = useState<MockDiscountCard[]>([]);
  const [bestSellers, setBestSellers] = useState<MockProduct[]>([]);
  const [popular, setPopular] = useState<MockProduct[]>([]);
  const [trustFeatures, setTrustFeatures] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>(() => defaultHeroSlides.map(mapHeroSlide));
  const [slideIndex, setSlideIndex] = useState(0);
  const isRtl = locale === "ar";

  useEffect(() => {
    Promise.all([
      store.getCategories(),
      store.getSubcategories(),
      store.getTrustedBrands(),
      store.getTrustFeatures(),
      store.getActiveHeroSlides(),
    ]).then(([catsData, subcatsData, logos, trust, slides]) => {
      setCats(catsData);
      setSubcats(subcatsData);
      setBrandLogos(logos);
      setTrustFeatures(trust);
      if (slides.length > 0) setHeroSlides(slides.map(mapHeroSlide));
    });

    const deferred = window.setTimeout(() => {
      store.getActiveStatistics().then(setStatistics);
      store.getActiveDiscountCards().then(setDiscountCards);
      store.getBestSellingProducts().then(setBestSellers);
      store.getPopularProducts().then(setPopular);
    }, 150);
    return () => window.clearTimeout(deferred);
  }, []);

  const activeDiscountCards = discountCards.filter(c => c.isActive !== false);
  useEffect(() => {
    if (activeDiscountCards.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % activeDiscountCards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeDiscountCards.length]);

  const logoByName = buildLogoByName(brandLogos);

  const groupedSubcats = useMemo(
    () => groupSubcategoriesByName(subcats, locale),
    [subcats, locale],
  );

  const marqueeBrands = brandLogos.length > 0 ? brandLogos : cats.map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    productCount: c.productCount,
  }));

  return (
    <div className="flex flex-col min-h-screen" dir={isRtl ? "rtl" : "ltr"}>

      {/* HERO */}
      <HeroSlider slides={heroSlides} locale={locale} />

      {/* TRUST BAR */}
      <section className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustFeatures.length === 0 ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="size-11 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-24 rounded bg-muted" />
                      <div className="h-3 w-32 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </>
            ) : trustFeatures.map((item, i) => {
              const Icon = TRUST_ICONS[item.icon] || Shield;
              return (
                <Reveal key={item.id} delay={i * 80} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex size-11 items-center justify-center rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ background: "rgba(192,22,27,0.10)" }}>
                    <Icon className="size-5 group-hover:scale-110 transition-transform duration-300" style={{ color: "#C0161B" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{isRtl ? item.titleAr : item.titleEn}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? item.subtitleAr : item.subtitleEn}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ماركات — level 1 (categories: APT, TOTAL, …) */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionTitle ar="تسوق من أهم الماركات" en="Shop by Brand" link="/categories" locale={locale} />
          </Reveal>
          <Reveal delay={100}>
            <CircleScroller>
              {cats.length === 0 ? (
                <div className="flex gap-4 text-sm text-muted-foreground py-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                      <div className="size-20 sm:size-24 rounded-full bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : cats.map((cat, i) => {
                const logoSrc = getCategoryLogo(cat, logoByName);
                const label = isRtl ? cat.nameAr || cat.name : cat.name;
                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="category-circle snap-start flex-shrink-0 flex flex-col items-center gap-2 group"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="circle-ring size-20 sm:size-24 rounded-full border-2 border-transparent p-1 transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20">
                      <div className="size-full rounded-full flex items-center justify-center shadow-md bg-white border border-border overflow-hidden p-3">
                        {logoSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoSrc} alt={label} className="size-full object-contain" />
                        ) : (
                          <span className="text-sm font-black uppercase text-muted-foreground tracking-tight">
                            {cat.name.slice(0, 3)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-center text-foreground group-hover:text-primary transition-colors">
                      {label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{cat.productCount} {isRtl ? "منتج" : "items"}</span>
                  </Link>
                );
              })}
            </CircleScroller>
          </Reveal>
        </div>
      </section>

      {/* فئات — level 2 (subcategories: يدوي, كهربائي, …) */}
      <section className="bg-muted/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionTitle ar="تسوق من أهم الفئات" en="Shop by Type" link="/types" locale={locale} />
          </Reveal>
          <Reveal delay={100}>
            <CircleScroller>
              {groupedSubcats.length === 0 ? (
                <div className="flex gap-4 text-sm text-muted-foreground py-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                      <div className="size-20 sm:size-24 rounded-full bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : groupedSubcats.map((group, i) => {
                const color = SUBCAT_COLORS[i % SUBCAT_COLORS.length];
                const label = isRtl ? group.nameAr || group.name : group.name;
                return (
                  <Link
                    key={group.key}
                    href={subcategoryGroupProductsHref(group)}
                    className="category-circle snap-start flex-shrink-0 flex flex-col items-center gap-2 group"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="circle-ring size-20 sm:size-24 rounded-full border-2 border-transparent p-1 transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20">
                      <div
                        className="size-full rounded-full flex items-center justify-center shadow-md"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
                      >
                        {getSubcatIcon(i)}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-center text-foreground group-hover:text-primary transition-colors">
                      {label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{group.productCount} {isRtl ? "منتج" : "items"}</span>
                  </Link>
                );
              })}
            </CircleScroller>
          </Reveal>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="bg-muted/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionTitle ar="الأكثر مبيعاً" en="Best Sellers" link="/products?sort=price_asc" locale={locale} />
          </Reveal>
          <Reveal delay={100}>
            <HScroll>
              {bestSellers.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}
            </HScroll>
          </Reveal>
        </div>
      </section>

      {/* PROMO BANNER / SLIDER */}
      {activeDiscountCards.length > 0 && (() => {
        const card = activeDiscountCards[slideIndex % activeDiscountCards.length];
        if (!card) return null;

        const goTo = (i: number) => setSlideIndex(i);
        const prev = () => setSlideIndex(c => (c - 1 + activeDiscountCards.length) % activeDiscountCards.length);
        const next = () => setSlideIndex(c => (c + 1) % activeDiscountCards.length);

        return (
          <section className="py-10 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Reveal>
                <div className="relative overflow-hidden rounded-3xl animate-gradient-shift" style={{ backgroundColor: card.bgColor, backgroundSize: "200% 200%" }}>
                  <Image src={card.bgImage || "/assets/discountCards/11.jpg"} alt="" fill className="object-cover opacity-40" sizes="1200px" priority />
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 end-4 size-48 rounded-full" style={{ background: "radial-gradient(circle, #C0161B, transparent)" }} />
                    <div className="absolute bottom-0 start-0 size-32 rounded-full" style={{ background: "radial-gradient(circle, #fff, transparent)" }} />
                  </div>
                  <div className="relative px-8 py-12 sm:px-14 sm:py-14 flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-4" style={{ background: "rgba(192,22,27,0.2)", color: "#e83030", border: "1px solid rgba(192,22,27,0.3)" }}>
                        ✦ {isRtl ? card.badgeAr : card.badgeEn}
                      </span>
                      <h3 className="text-3xl sm:text-4xl font-black text-white mb-3">
                        {isRtl ? card.titleAr : card.titleEn}
                      </h3>
                      <p className="text-white/65 text-sm max-w-md">
                        {isRtl ? card.descAr : card.descEn}
                      </p>
                    </div>
                    <Link href={card.linkUrl} className="shrink-0 inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-sm shadow-2xl hover:scale-105 transition-all" style={{ background: "#C0161B", color: "#fff" }}>
                      {isRtl ? `${card.linkLabelAr} ←` : `→ ${card.linkLabelEn}`}
                    </Link>
                  </div>
                  {/* Navigation arrows */}
                  {activeDiscountCards.length > 1 && (
                    <>
                      <button onClick={prev} className="absolute start-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                        <ChevronLeft className="size-5" />
                      </button>
                      <button onClick={next} className="absolute end-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                        <ChevronRight className="size-5" />
                      </button>
                    </>
                  )}
                  {/* Dots */}
                  {activeDiscountCards.length > 1 && (
                    <div className="absolute bottom-4 start-1/2 -translate-x-1/2 flex gap-2">
                      {activeDiscountCards.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goTo(i)}
                          className={`size-2 rounded-full transition-all ${i === slideIndex ? "w-6 bg-white" : "bg-white/40 hover:bg-white/60"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          </section>
        );
      })()}

      {/* POPULAR PRODUCTS */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionTitle ar="الأكثر شهرة" en="Popular Products" link="/products" locale={locale} />
          </Reveal>
          <Reveal delay={100}>
            <HScroll>
              {popular.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}
            </HScroll>
          </Reveal>
        </div>
      </section>

      {/* BRANDS MARQUEE */}
      <section className="bg-muted/40 border-t border-border py-10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
          <Reveal>
            <SectionTitle ar="الماركات المعتمدة" en="Our Trusted Brands" locale={locale} />
          </Reveal>
        </div>
        {marqueeBrands.length > 0 && (
          <div className="marquee-wrapper relative overflow-hidden">
            <div className={`flex gap-5 ${isRtl ? "animate-marquee-rtl" : "animate-marquee"}`} style={{ width: "fit-content", "--marquee-repeat": Math.max(2, Math.ceil(8 / marqueeBrands.length)) } as React.CSSProperties}>
              {[...Array(Math.max(2, Math.ceil(8 / marqueeBrands.length)))].map((_, copy) => (
                <div key={copy} className="flex gap-5 shrink-0">
                  {marqueeBrands.map((b, i) => (
                    <div key={`${b.id}-${i}-${copy}`} className="flex h-14 min-w-[120px] items-center justify-center rounded-2xl border border-border bg-card px-6 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-default shadow-sm">
                      {b.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* STATS */}
      {statistics.length > 0 && (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {statistics.map((s, i) => (
                <Reveal key={s.id} delay={i * 100}>
                  <div className="p-6 rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all">
                    <p className="text-3xl sm:text-4xl font-black gold-text">{s.value}</p>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">{isRtl ? s.labelAr : s.labelEn}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, #0f1923, #1a2535)" }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              {isRtl ? "هل تبحث عن أداة معينة؟" : "Looking for a Specific Tool?"}
            </h2>
            <p className="text-white/60 mb-8 text-base">
              {isRtl ? "تواصل معنا وسنوفر لك أفضل الحلول والمنتجات بأسعار تنافسية" : "Contact us and we'll find the best solutions at competitive prices"}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold shadow-xl hover:scale-105 transition-all animate-glow-pulse" style={{ background: "#C0161B", color: "#fff" }}>
                {isRtl ? "تصفح المنتجات" : "Browse Products"}
              </Link>
              <Link href="/categories" className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold border border-white/20 text-white hover:bg-white/10 transition-all">
                {isRtl ? "جميع الأقسام" : "All Categories"}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
