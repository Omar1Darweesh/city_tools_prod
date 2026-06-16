export interface MockProduct {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  priceRetail: number;
  priceWholesale: number;
  discountPrice: number | null;
  categoryId: number;
  subcategoryId?: number;
  itemTypeId?: number;
  brand: string;
  description: string;
  images: string[];
  rating: number;
  inStock: boolean;
  stock?: number;
  badge: "SALE" | "NEW" | null;
  isPopular: boolean;
  isBestSale: boolean;
  createdAt: string;
  unit: string;
  minQty: number;
}

export interface MockCategory {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  color: string;
  icon: string;
  productCount: number;
}

export interface MockSubcategory {
  id: number;
  name: string;
  nameAr: string;
  categoryId: number;
  productCount: number;
}

export interface MockItemType {
  id: number;
  name: string;
  nameAr: string;
  subcategoryId: number;
  productCount: number;
}

export interface MockBrand {
  id: string | number;
  name: string;
  nameAr: string;
  productCount: number;
  logo?: string | null;
  isTrusted?: boolean;
  sortOrder?: number;
}

export interface MockStatistic {
  id: number;
  value: string;
  labelEn: string;
  labelAr: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MockDiscountCard {
  id: number;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  linkUrl: string;
  linkLabelEn: string;
  linkLabelAr: string;
  bgColor: string;
  bgImage?: string;
  isActive: boolean;
}

export const categories: MockCategory[] = [
  { id: 1, name: "Power Tools", nameAr: "أدوات كهربائية", slug: "power-tools", color: "#f97316", icon: "zap", productCount: 12 },
  { id: 2, name: "Hand Tools", nameAr: "عدد يدوية", slug: "hand-tools", color: "#22c55e", icon: "wrench", productCount: 10 },
  { id: 3, name: "Electrical", nameAr: "كهربائيات", slug: "electrical", color: "#eab308", icon: "bolt", productCount: 8 },
  { id: 4, name: "Plumbing", nameAr: "سباكة", slug: "plumbing", color: "#06b6d4", icon: "droplets", productCount: 6 },
  { id: 5, name: "Safety", nameAr: "السلامة", slug: "safety", color: "#ef4444", icon: "shield", productCount: 6 },
  { id: 6, name: "Industrial", nameAr: "صناعية", slug: "industrial", color: "#8b5cf6", icon: "factory", productCount: 5 },
];

const productsData: Omit<MockProduct, "id">[] = [
  // === Power Tools (Category 1) ===
  { code: "PT-001", nameEn: "Professional Cordless Drill Kit 20V", nameAr: "طقم دريل لاسلكي احترافي 20 فولت", priceRetail: 450, priceWholesale: 380, discountPrice: 349, categoryId: 1, brand: "Bosch", description: "مثقاب لاسلكي عالي الأداء بمحرك بدون فرش، بطاريتان 20 فولت، شاحن سريع وحقيبة حمل. مثالي للمحترفين وعشاق الأعمال اليدوية.", images: [], rating: 4.5, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-01-15", unit: "PCS", minQty: 1 },
  { code: "PT-002", nameEn: "Angle Grinder 7\" 2000W", nameAr: "جلاخة زاوية 7 بوصة 2000 واط", priceRetail: 320, priceWholesale: 270, discountPrice: null, categoryId: 1, brand: "Makita", description: "جلاخة زاوية قوية 2000 واط مناسبة لقطع وتجليخ المعادن والحجر. نظام حماية من الغبار.", images: [], rating: 4.3, inStock: true, badge: null, isPopular: true, isBestSale: false, createdAt: "2026-02-01", unit: "PCS", minQty: 1 },
  { code: "PT-003", nameEn: "Jig Saw 650W Variable Speed", nameAr: "منشار أركت 650 واط متغير السرعة", priceRetail: 280, priceWholesale: 235, discountPrice: 229, categoryId: 1, brand: "Bosch", description: "منشار أركت احترافي 650 واط مع سرعة متغيرة ونظام تغيير الشفرة السريع.للقطع الدقيق في الخشب والمعدن.", images: [], rating: 4.2, inStock: true, badge: "SALE", isPopular: false, isBestSale: true, createdAt: "2026-03-10", unit: "PCS", minQty: 1 },
  { code: "PT-004", nameEn: "Impact Drill 1200W", nameAr: "مثقاب تصادمي 1200 واط", priceRetail: 380, priceWholesale: 320, discountPrice: null, categoryId: 1, brand: "DeWalt", description: "مثقاب تصادمي قوي 1200 واط للخرسانة والطوب والحجر.مزود بقبضة إضافية للتحكم.", images: [], rating: 4.6, inStock: true, badge: null, isPopular: true, isBestSale: false, createdAt: "2026-01-20", unit: "PCS", minQty: 1 },
  { code: "PT-005", nameEn: "Circular Saw 1800W 7-1/4\"", nameAr: "منشار دائري 1800 واط 7.25 بوصة", priceRetail: 520, priceWholesale: 440, discountPrice: 459, categoryId: 1, brand: "Makita", description: "منشار دائري احترافي 1800 واط مع نظام توجيه ليزر للقطع المستقيم.عمق قطع يصل إلى 65 مم.", images: [], rating: 4.4, inStock: true, badge: "SALE", isPopular: false, isBestSale: true, createdAt: "2026-04-05", unit: "PCS", minQty: 1 },
  { code: "PT-006", nameEn: "Heat Gun 2000W Adjustable", nameAr: "مسدس حراري 2000 واط قابل للتعديل", priceRetail: 190, priceWholesale: 160, discountPrice: null, categoryId: 1, brand: "Bosch", description: "مسدس حراري 2000 واط مع درجات حرارة قابلة للتعديل.مناسب لإزالة الدهان واللحام الحراري.", images: [], rating: 4.1, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-02-15", unit: "PCS", minQty: 1 },
  { code: "PT-007", nameEn: "Electric Planer 850W", nameAr: "رابطة كهربائية 850 واط", priceRetail: 340, priceWholesale: 290, discountPrice: null, categoryId: 1, brand: "DeWalt", description: "رابطة كهربائية 850 واط بعرض تسوية 82 مم.مزودة بنظام شفط الغبار.", images: [], rating: 4.0, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-03-20", unit: "PCS", minQty: 1 },
  { code: "PT-008", nameEn: "Oscillating Multi-Tool 350W", nameAr: "أداة متعددة الاستخدامات 350 واط", priceRetail: 260, priceWholesale: 220, discountPrice: 199, categoryId: 1, brand: "Makita", description: "أداة متعددة الاستخدامات 350 واط مع 12 قطعة ملحقة.للقطع والصنفرة والكشط في الأماكن الضيقة.", images: [], rating: 4.3, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-05-01", unit: "PCS", minQty: 1 },

  // === Hand Tools (Category 2) ===
  { code: "HT-001", nameEn: "Heavy Duty Wrench Set 12pc", nameAr: "طقم مفاتيح ربط ثقيلة 12 قطعة", priceRetail: 280, priceWholesale: 235, discountPrice: null, categoryId: 2, brand: "Stanley", description: "طقم مفاتيح ربط كروم فاناديوم 12 قطعة من 8 إلى 24 مم.مع علبة تخزين.", images: [], rating: 4.6, inStock: true, badge: null, isPopular: true, isBestSale: false, createdAt: "2026-01-10", unit: "SET", minQty: 1 },
  { code: "HT-002", nameEn: "Screwdriver Set 20pc Magnetic", nameAr: "طقم مفكات 20 قطعة مغناطيسي", priceRetail: 120, priceWholesale: 95, discountPrice: 89, categoryId: 2, brand: "Stanley", description: "طقم مفكات براغي 20 قطعة مع رؤوس مغناطيسية.يشمل فيليبس ومسطرة ومربع.", images: [], rating: 4.4, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-02-20", unit: "SET", minQty: 1 },
  { code: "HT-003", nameEn: "Claw Hammer 16oz Professional", nameAr: "مطرقة مخلب 16 أونصة احترافية", priceRetail: 85, priceWholesale: 70, discountPrice: null, categoryId: 2, brand: "Stanley", description: "مطرقة احترافية 16 أونصة مع مقبض مطاطي مريح ورأس فولاذي مصقول.", images: [], rating: 4.5, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-03-05", unit: "PCS", minQty: 1 },
  { code: "HT-004", nameEn: "Pliers Set 5pc Insulated", nameAr: "طقم زرادية 5 قطع معزولة", priceRetail: 190, priceWholesale: 160, discountPrice: null, categoryId: 2, brand: "Knipex", description: "طقم زرادية معزولة 5 قطع.للاستخدام الآمن مع الأعمال الكهربائية حتى 1000 فولت.", images: [], rating: 4.7, inStock: true, badge: null, isPopular: true, isBestSale: false, createdAt: "2026-01-25", unit: "SET", minQty: 1 },
  { code: "HT-005", nameEn: "Measuring Tape 25ft Magnetic Tip", nameAr: "شريط قياس 7.5 متر طرف مغناطيسي", priceRetail: 65, priceWholesale: 52, discountPrice: 49, categoryId: 2, brand: "Stanley", description: "شريط قياس احترافي 7.5 متر مع طرف مغناطيسي وطلاء مقاوم للصدمات.", images: [], rating: 4.3, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-04-15", unit: "PCS", minQty: 1 },
  { code: "HT-006", nameEn: "Tool Kit 100pc Home Maintenance", nameAr: "طقم أدوات صيانة منزلية 100 قطعة", priceRetail: 450, priceWholesale: 380, discountPrice: 379, categoryId: 2, brand: "Bosch", description: "طقم أدوات شامل 100 قطعة للصيانة المنزلية.يشمل مفكات، زرادية، مفاتيح ربط، شريط قياس وغيرها.", images: [], rating: 4.5, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-05-10", unit: "SET", minQty: 1 },
  { code: "HT-007", nameEn: "C-Clamp Set 4pc", nameAr: "طقم مشابك C 4 قطع", priceRetail: 110, priceWholesale: 92, discountPrice: null, categoryId: 2, brand: "IRWIN", description: "طقم مشابك C من الحديد الزهر 4 قطع بمقاسات مختلفة.للنقر والتثبيت الآمن.", images: [], rating: 4.2, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-02-10", unit: "SET", minQty: 1 },
  { code: "HT-008", nameEn: "Hacksaw 12\" Adjustable Frame", nameAr: "منشار معدن 12 بوصة قابل للتعديل", priceRetail: 75, priceWholesale: 60, discountPrice: null, categoryId: 2, brand: "Stanley", description: "منشار معدن احترافي 12 بوصة مع إطار قابل للتعديل وقبضة مريحة.", images: [], rating: 4.0, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-03-15", unit: "PCS", minQty: 1 },
  { code: "HT-009", nameEn: "Spirit Level 24\" Aluminum", nameAr: "ميزان مياه 60 سم ألومنيوم", priceRetail: 95, priceWholesale: 80, discountPrice: null, categoryId: 2, brand: "Stanley", description: "ميزان مياه احترافي 60 سم من الألومنيوم مع 3 فقاعات للقراءة الأفقية والرأسية.", images: [], rating: 4.3, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-04-01", unit: "PCS", minQty: 1 },
  { code: "HT-010", nameEn: "Pipe Wrench 14\" Heavy Duty", nameAr: "مفتاح أنابيب 14 بوصة استثنائي", priceRetail: 160, priceWholesale: 135, discountPrice: null, categoryId: 2, brand: "IRWIN", description: "مفتاح أنابيب احترافي 14 بوصة من الفولاذ المطروق.مقبض مريح مع فك قابل للتعديل.", images: [], rating: 4.4, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-04-20", unit: "PCS", minQty: 1 },

  // === Electrical (Category 3) ===
  { code: "EL-001", nameEn: "Digital Multimeter Pro CAT III", nameAr: "ملتيميتر رقمي احترافي CAT III", priceRetail: 180, priceWholesale: 150, discountPrice: 149, categoryId: 3, brand: "Fluke", description: "ملتيميتر رقمي احترافي لقياس الجهد والتيار والمقاومة.معتمد CAT III للاستخدام الآمن.", images: [], rating: 4.7, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-01-05", unit: "PCS", minQty: 1 },
  { code: "EL-002", nameEn: "Wire Stripper & Cutter 8\"", nameAr: "مقص تجريد وتعقيم أسلاك 8 بوصة", priceRetail: 75, priceWholesale: 60, discountPrice: null, categoryId: 3, brand: "Knipex", description: "أداة تجريد وتعقيم الأسلاك 8 بوصة.لأسلاك 10-20 AWG مع مقبض مريح.", images: [], rating: 4.4, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-02-05", unit: "PCS", minQty: 1 },
  { code: "EL-003", nameEn: "Cable Ties Assorted 500pc", nameAr: "رباطات كابلات مشكلة 500 قطعة", priceRetail: 45, priceWholesale: 35, discountPrice: null, categoryId: 3, brand: "CityTools", description: "رباطات كابلات نايلون متنوعة المقاسات 500 قطعة.مقاومة للأشعة فوق البنفسجية.", images: [], rating: 4.2, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-03-01", unit: "BOX", minQty: 1 },
  { code: "EL-004", nameEn: "Extension Cord 25m Heavy Duty", nameAr: "سلك تمديد 25 متر استثنائي", priceRetail: 220, priceWholesale: 185, discountPrice: 189, categoryId: 3, brand: "CityTools", description: "سلك تمديد كهربائي 25 متر 3×2.5 مم مع حماية من الماء والغبار.مناسب للمواقع.", images: [], rating: 4.3, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-04-10", unit: "PCS", minQty: 1 },
  { code: "EL-005", nameEn: "Non-Contact Voltage Tester", nameAr: "جهاز فحص الجهد بدون تلامس", priceRetail: 65, priceWholesale: 52, discountPrice: null, categoryId: 3, brand: "Fluke", description: "جهاز كشف الجهد بدون تلامس مع إنذار صوتي وضوئي.مدى 12-1000 فولت تيار متردد.", images: [], rating: 4.5, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-02-25", unit: "PCS", minQty: 1 },
  { code: "EL-006", nameEn: "Electrical Tape 10m 5-Pack", nameAr: "شريط كهربائي 10 متر 5 حبات", priceRetail: 35, priceWholesale: 28, discountPrice: null, categoryId: 3, brand: "3M", description: "شريط عزل كهربائي عالي الجودة 5 ألوان.مقاوم للحرارة والعزل حتى 600 فولت.", images: [], rating: 4.1, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-05-05", unit: "PACK", minQty: 1 },
  { code: "EL-007", nameEn: "Heat Shrink Tube Kit 120pc", nameAr: "طقم أنابيب انكماش حراري 120 قطعة", priceRetail: 55, priceWholesale: 45, discountPrice: null, categoryId: 3, brand: "3M", description: "طقم أنابيب انكماش حراري متنوعة المقاسات والألوان 120 قطعة.نسبة انكماش 2:1.", images: [], rating: 4.0, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-03-25", unit: "SET", minQty: 1 },
  { code: "EL-008", nameEn: "Circuit Breaker Finder", nameAr: "جهاز تحديد القواطع الكهربائية", priceRetail: 240, priceWholesale: 200, discountPrice: null, categoryId: 3, brand: "Fluke", description: "جهاز تحديد القواطع الكهربائية بدقة.يحدد القاطع المناسب دون الحاجة لفصل التيار.", images: [], rating: 4.6, inStock: true, badge: null, isPopular: true, isBestSale: false, createdAt: "2026-01-30", unit: "PCS", minQty: 1 },

  // === Plumbing (Category 4) ===
  { code: "PL-001", nameEn: "PVC Pipe Cutter 1-1/4\"", nameAr: "قاطع مواسير PVC 32 مم", priceRetail: 95, priceWholesale: 80, discountPrice: null, categoryId: 4, brand: "IRWIN", description: "قاطع مواسير PVC احترافي حتى 32 مم.شفرة فولاذية مع آلية راتشيت للقطع السهل.", images: [], rating: 4.4, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-02-15", unit: "PCS", minQty: 1 },
  { code: "PL-002", nameEn: "Plunger Heavy Duty 6\"", nameAr: "سفون ثقيل 6 بوصة", priceRetail: 45, priceWholesale: 35, discountPrice: null, categoryId: 4, brand: "CityTools", description: "سفون احترافي ثقيل 6 بوصة مع كأس مطاطي مقوى.لفتح المجاري والبالوعات.", images: [], rating: 4.0, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-03-10", unit: "PCS", minQty: 1 },
  { code: "PL-003", nameEn: "Pipe Threading Kit 1/2\"-1\"", nameAr: "طقم حلزنة مواسير 1/2-1 بوصة", priceRetail: 380, priceWholesale: 320, discountPrice: 299, categoryId: 4, brand: "Ridgid", description: "طقم حلزنة مواسير كامل من 1/2 إلى 1 بوصة.يشمل قالبين ومقبض وأداة شطف.", images: [], rating: 4.5, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-04-20", unit: "SET", minQty: 1 },
  { code: "PL-004", nameEn: "Faucet Wrench Set 2pc", nameAr: "طقم مفاتيح حنفية 2 قطعة", priceRetail: 85, priceWholesale: 70, discountPrice: null, categoryId: 4, brand: "IRWIN", description: "طقم مفاتيح حنفية 2 قطعة للوصول إلى الأماكن الضيقة تحت الأحواض.", images: [], rating: 4.2, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-05-15", unit: "SET", minQty: 1 },
  { code: "PL-005", nameEn: "Drain Snake 25ft", nameAr: "ثعبان المجاري 7.5 متر", priceRetail: 160, priceWholesale: 135, discountPrice: null, categoryId: 4, brand: "Ridgid", description: "أداة تنظيف المجاري بطول 7.5 متر مع مقبض دوار.لإزالة انسدادات المجاري والبالوعات.", images: [], rating: 4.3, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-01-20", unit: "PCS", minQty: 1 },
  { code: "PL-006", nameEn: "Teflon Tape 1/2\"x10m 10-Pack", nameAr: "شريط تفلون 1/2 بوصة × 10 متر 10 حبات", priceRetail: 40, priceWholesale: 32, discountPrice: null, categoryId: 4, brand: "CityTools", description: "شريك تفلون عالي الكثافة لعزل وصلات المواسير.10 لفات في العبوة.", images: [], rating: 4.1, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-02-28", unit: "PACK", minQty: 1 },

  // === Safety (Category 5) ===
  { code: "SF-001", nameEn: "Safety Helmet Pro ABS", nameAr: "خوذة سلامة احترافية ABS", priceRetail: 95, priceWholesale: 80, discountPrice: null, categoryId: 5, brand: "3M", description: "خوذة سلامة من ABS متوافقة مع ANSI/OSHA.مقاومة للصدمات مع نظام تعديل المقاس.", images: [], rating: 4.6, inStock: true, badge: null, isPopular: true, isBestSale: false, createdAt: "2026-01-08", unit: "PCS", minQty: 1 },
  { code: "SF-002", nameEn: "Safety Vest Hi-Vis Yellow", nameAr: "سترة أمان عالية الظهور أصفر", priceRetail: 45, priceWholesale: 35, discountPrice: 35, categoryId: 5, brand: "3M", description: "سترة أمان عالية الظهور باللون الأصفر مع أشرطة عاكسة.مطابقة لمعايير ANSI Class 2.", images: [], rating: 4.3, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-03-18", unit: "PCS", minQty: 1 },
  { code: "SF-003", nameEn: "Safety Gloves Cut-Resistant Level 5", nameAr: "قفازات أمان مقاومة للقطع مستوى 5", priceRetail: 55, priceWholesale: 45, discountPrice: null, categoryId: 5, brand: "3M", description: "قفازات أمان مقاومة للقطع بمستوى ANSI A5.مبطنة بالنايلون عالي الكثافة مع طلاء نيتريل.", images: [], rating: 4.4, inStock: true, badge: null, isPopular: true, isBestSale: false, createdAt: "2026-02-12", unit: "PAIR", minQty: 1 },
  { code: "SF-004", nameEn: "Safety Goggles Anti-Fog", nameAr: "نظارات أمان مقاومة للضباب", priceRetail: 35, priceWholesale: 28, discountPrice: null, categoryId: 5, brand: "3M", description: "نظارات أمان مقاومة للضباب والخدش.حماية من الجسيمات المتطايرة والمواد الكيميائية.", images: [], rating: 4.2, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-04-25", unit: "PCS", minQty: 1 },
  { code: "SF-005", nameEn: "Ear Protection Muffs 23dB", nameAr: "سدادات أذن عازلة للصوت 23 ديسيبل", priceRetail: 65, priceWholesale: 52, discountPrice: null, categoryId: 5, brand: "3M", description: "سدادات أذن عازلة للضوضاء بمعدل خفض 23 ديسيبل.مريحة للارتداء الطويل.", images: [], rating: 4.0, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-05-20", unit: "PCS", minQty: 1 },
  { code: "SF-006", nameEn: "Dust Mask N95 50-Pack", nameAr: "قناع غبار N95 50 حبة", priceRetail: 120, priceWholesale: 100, discountPrice: 99, categoryId: 5, brand: "3M", description: "قناع تنفس N95 معتمد من NIOSH.حماية من الغبار والجسيمات بنسبة 95%.50 حبة.", images: [], rating: 4.5, inStock: true, badge: "SALE", isPopular: true, isBestSale: true, createdAt: "2026-06-01", unit: "BOX", minQty: 1 },

  // === Industrial (Category 6) ===
  { code: "IN-001", nameEn: "WD-40 Multi-Use 400ml 6-Pack", nameAr: "WD-40 متعدد الاستخدامات 400 مل 6 حبات", priceRetail: 85, priceWholesale: 70, discountPrice: null, categoryId: 6, brand: "WD-40", description: "WD-40 متعدد الاستخدامات لتزييت وإزالة الصدأ والحماية من الرطوبة.6 عبوات.", images: [], rating: 4.7, inStock: true, badge: null, isPopular: true, isBestSale: false, createdAt: "2026-01-12", unit: "PACK", minQty: 1 },
  { code: "IN-002", nameEn: "Duct Tape Heavy Duty 50m Silver", nameAr: "شريط لاصق فضي ثقيل 50 متر", priceRetail: 35, priceWholesale: 28, discountPrice: null, categoryId: 6, brand: "3M", description: "شريط لاصق فضي عالي المقاومة 50 متر × 48 مم.مقاوم للماء والحرارة.", images: [], rating: 4.3, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-02-18", unit: "ROLL", minQty: 1 },
  { code: "IN-003", nameEn: "Industrial Super Glue 20g 10-Pack", nameAr: "صمغ فائق الصناعي 20 جرام 10 حبات", priceRetail: 45, priceWholesale: 36, discountPrice: null, categoryId: 6, brand: "3M", description: "صمغ فوري عالي القوة للمواد الصناعية.مقاوم للماء والحرارة.10 أنابيب.", images: [], rating: 4.1, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-03-22", unit: "PACK", minQty: 1 },
  { code: "IN-004", nameEn: "Lubricating Grease 500g", nameAr: "شحم تزييت صناعي 500 جرام", priceRetail: 55, priceWholesale: 45, discountPrice: null, categoryId: 6, brand: "WD-40", description: "شحم تزييت عالي الجودة للاستخدام الصناعي.مقاوم للحرارة العالية والضغط.", images: [], rating: 4.2, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-04-28", unit: "PCS", minQty: 1 },
  { code: "IN-005", nameEn: "Spray Paint Can 400ml Black 12-Pack", nameAr: "طلاء بخاخ أسود 400 مل 12 حبة", priceRetail: 120, priceWholesale: 100, discountPrice: null, categoryId: 6, brand: "CityTools", description: "طلاء بخاخ أسود لامع عالي الجودة.للأسطح المعدنية والخشبية.يجف بسرعة.", images: [], rating: 4.0, inStock: true, badge: null, isPopular: false, isBestSale: false, createdAt: "2026-05-25", unit: "BOX", minQty: 1 },
];

const stockValues = [5, 45, 12, 3, 28, 60, 8, 22, 15, 7, 35, 50, 2, 18, 42, 0, 30, 75, 55, 4, 10, 25, 14, 40, 90, 6, 20, 38, 11, 48, 80, 3, 16, 33, 70, 0, 9, 65, 100, 1, 24, 44];

export const productHierarchy: Record<string, { subcategoryId: number; itemTypeId: number }> = {
  "PT-001": { subcategoryId: 1, itemTypeId: 1 },
  "PT-002": { subcategoryId: 3, itemTypeId: 5 },
  "PT-003": { subcategoryId: 2, itemTypeId: 4 },
  "PT-004": { subcategoryId: 1, itemTypeId: 2 },
  "PT-005": { subcategoryId: 2, itemTypeId: 3 },
  "PT-006": { subcategoryId: 1, itemTypeId: 1 },
  "PT-007": { subcategoryId: 1, itemTypeId: 1 },
  "PT-008": { subcategoryId: 1, itemTypeId: 1 },
  "HT-001": { subcategoryId: 4, itemTypeId: 6 },
  "HT-002": { subcategoryId: 4, itemTypeId: 7 },
  "HT-003": { subcategoryId: 4, itemTypeId: 8 },
  "HT-004": { subcategoryId: 4, itemTypeId: 9 },
  "HT-005": { subcategoryId: 4, itemTypeId: 10 },
  "HT-006": { subcategoryId: 4, itemTypeId: 7 },
  "HT-007": { subcategoryId: 4, itemTypeId: 9 },
  "HT-008": { subcategoryId: 4, itemTypeId: 6 },
  "HT-009": { subcategoryId: 4, itemTypeId: 10 },
  "HT-010": { subcategoryId: 4, itemTypeId: 6 },
  "EL-001": { subcategoryId: 5, itemTypeId: 11 },
  "EL-002": { subcategoryId: 5, itemTypeId: 12 },
  "EL-003": { subcategoryId: 5, itemTypeId: 12 },
  "EL-004": { subcategoryId: 5, itemTypeId: 12 },
  "EL-005": { subcategoryId: 5, itemTypeId: 11 },
  "EL-006": { subcategoryId: 5, itemTypeId: 12 },
  "EL-007": { subcategoryId: 5, itemTypeId: 12 },
  "EL-008": { subcategoryId: 5, itemTypeId: 11 },
  "PL-001": { subcategoryId: 6, itemTypeId: 13 },
  "PL-002": { subcategoryId: 6, itemTypeId: 13 },
  "PL-003": { subcategoryId: 6, itemTypeId: 13 },
  "PL-004": { subcategoryId: 6, itemTypeId: 13 },
  "PL-005": { subcategoryId: 6, itemTypeId: 13 },
  "PL-006": { subcategoryId: 6, itemTypeId: 13 },
  "SF-001": { subcategoryId: 7, itemTypeId: 14 },
  "SF-002": { subcategoryId: 7, itemTypeId: 15 },
  "SF-003": { subcategoryId: 7, itemTypeId: 14 },
  "SF-004": { subcategoryId: 7, itemTypeId: 14 },
  "SF-005": { subcategoryId: 7, itemTypeId: 14 },
  "SF-006": { subcategoryId: 7, itemTypeId: 14 },
  "IN-001": { subcategoryId: 8, itemTypeId: 16 },
  "IN-002": { subcategoryId: 8, itemTypeId: 16 },
  "IN-003": { subcategoryId: 8, itemTypeId: 16 },
  "IN-004": { subcategoryId: 8, itemTypeId: 16 },
  "IN-005": { subcategoryId: 8, itemTypeId: 16 },
};

export const products: MockProduct[] = productsData.map((p, i) => ({
  ...p,
  id: i + 1,
  ...(productHierarchy[p.code] || {}),
  images: p.images.length > 0 ? p.images : [`https://picsum.photos/seed/${p.code}/400/400`],
  stock: stockValues[i] ?? 10,
  inStock: (stockValues[i] ?? 10) > 0,
}));

export const subcategories: MockSubcategory[] = [
  { id: 1, name: "Drills", nameAr: "مثاقب", categoryId: 1, productCount: 4 },
  { id: 2, name: "Saws", nameAr: "مناشير", categoryId: 1, productCount: 2 },
  { id: 3, name: "Grinders", nameAr: "جلاخات", categoryId: 1, productCount: 1 },
  { id: 4, name: "يدوي", nameAr: "يدوي", categoryId: 2, productCount: 10 },
  { id: 5, name: "كهربائيات", nameAr: "كهربائيات", categoryId: 3, productCount: 8 },
  { id: 6, name: "سباكة", nameAr: "سباكة", categoryId: 4, productCount: 6 },
  { id: 7, name: "السلامة", nameAr: "السلامة", categoryId: 5, productCount: 6 },
  { id: 8, name: "صناعية", nameAr: "صناعية", categoryId: 6, productCount: 5 },
];

export const itemTypes: MockItemType[] = [
  { id: 1, name: "Cordless", nameAr: "لاسلكي", subcategoryId: 1, productCount: 4 },
  { id: 2, name: "Impact", nameAr: "تصادمي", subcategoryId: 1, productCount: 1 },
  { id: 3, name: "Circular", nameAr: "دائري", subcategoryId: 2, productCount: 1 },
  { id: 4, name: "Jig", nameAr: "أركت", subcategoryId: 2, productCount: 1 },
  { id: 5, name: "Angle", nameAr: "زاوية", subcategoryId: 3, productCount: 1 },
  { id: 6, name: "Wrenches", nameAr: "مفاتيح", subcategoryId: 4, productCount: 3 },
  { id: 7, name: "Screwdrivers", nameAr: "مفكات", subcategoryId: 4, productCount: 2 },
  { id: 8, name: "Hammers", nameAr: "مطارق", subcategoryId: 4, productCount: 1 },
  { id: 9, name: "Pliers", nameAr: "زرادية", subcategoryId: 4, productCount: 2 },
  { id: 10, name: "Measuring", nameAr: "قياس", subcategoryId: 4, productCount: 2 },
  { id: 11, name: "Testers", nameAr: "قياس كهربائي", subcategoryId: 5, productCount: 3 },
  { id: 12, name: "Electrical Tools", nameAr: "أدوات كهربائية", subcategoryId: 5, productCount: 5 },
  { id: 13, name: "Plumbing Tools", nameAr: "أدوات سباكة", subcategoryId: 6, productCount: 6 },
  { id: 14, name: "Protection", nameAr: "وقاية", subcategoryId: 7, productCount: 5 },
  { id: 15, name: "Visibility", nameAr: "ظهور", subcategoryId: 7, productCount: 1 },
  { id: 16, name: "Industrial Supplies", nameAr: "مستلزمات صناعية", subcategoryId: 8, productCount: 5 },
];

export const brands: MockBrand[] = [
  { id: 1, name: "Bosch", nameAr: "بوش", productCount: 5 },
  { id: 2, name: "Makita", nameAr: "ماكيتا", productCount: 3 },
  { id: 3, name: "DeWalt", nameAr: "ديوالت", productCount: 2 },
  { id: 4, name: "Stanley", nameAr: "ستانلي", productCount: 6 },
  { id: 5, name: "Knipex", nameAr: "كنيبكس", productCount: 2 },
  { id: 6, name: "Fluke", nameAr: "فلوك", productCount: 3 },
  { id: 7, name: "IRWIN", nameAr: "إروين", productCount: 4 },
  { id: 8, name: "3M", nameAr: "3M", productCount: 7 },
  { id: 9, name: "Ridgid", nameAr: "ريدجيد", productCount: 2 },
  { id: 10, name: "WD-40", nameAr: "WD-40", productCount: 2 },
  { id: 11, name: "CityTools", nameAr: "سيتي تولز", productCount: 4 },
];

export const statistics: MockStatistic[] = [
  { id: 1, value: "50+", labelEn: "Products", labelAr: "منتج متاح", sortOrder: 0, isActive: true },
  { id: 2, value: "100+", labelEn: "Happy Clients", labelAr: "عميل سعيد", sortOrder: 1, isActive: true },
  { id: 3, value: "11+", labelEn: "Global Brands", labelAr: "ماركة عالمية", sortOrder: 2, isActive: true },
  { id: 4, value: "10+", labelEn: "Years Exp.", labelAr: "سنوات خبرة", sortOrder: 3, isActive: true },
];

export const discountCards: MockDiscountCard[] = [
  {
    id: 1,
    badgeEn: "Limited Offer",
    badgeAr: "عرض محدود",
    titleEn: "20% Off Electrical Tools",
    titleAr: "خصم 20% على الأدوات الكهربائية",
    descEn: "Exclusive discounts on all electrical tools & equipment. Limited time only.",
    descAr: "تخفيضات حصرية على جميع الأدوات الكهربائية والمعدات. عرض ساري لفترة محدودة فقط.",
    linkUrl: "/products?categoryId=3",
    linkLabelEn: "Shop Now",
    linkLabelAr: "تسوق الآن",
    bgColor: "linear-gradient(135deg, #0f1923 0%, #1a2535 40%, #C0161B 100%)",
    isActive: true,
  },
];

export function getCategoryBySlug(slug: string): MockCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategory(id: number): MockCategory | undefined {
  return categories.find((c) => c.id === id);
}

export function getFeaturedProducts(): MockProduct[] {
  return products.filter((p) => p.isPopular).slice(0, 8);
}

export function getBestSellingProducts(): MockProduct[] {
  return products.filter((p) => p.isBestSale).slice(0, 8);
}

export function getPopularProducts(): MockProduct[] {
  return products.filter((p) => p.isPopular).slice(0, 8);
}

export function getProductsByCategory(categoryId: number): MockProduct[] {
  return products.filter((p) => p.categoryId === categoryId);
}

export function getProductById(id: number): MockProduct | undefined {
  return products.find((p) => p.id === id);
}

export type StockThreshold = "low" | "moderate" | "high";

export function getProducts(params?: {
  page?: number;
  limit?: number;
  categoryId?: number;
  subcategoryId?: number;
  itemTypeId?: number;
  search?: string;
  sort?: string;
  brand?: string;
  minRating?: number;
  inStock?: boolean;
  stockThreshold?: StockThreshold;
}): { data: MockProduct[]; total: number; page: number; limit: number; totalPages: number } {
  let filtered = [...products];

  if (params?.categoryId) {
    filtered = filtered.filter((p) => p.categoryId === params.categoryId);
  }

  if (params?.subcategoryId) {
    filtered = filtered.filter((p) => p.subcategoryId === params.subcategoryId);
  }

  if (params?.itemTypeId) {
    filtered = filtered.filter((p) => p.itemTypeId === params.itemTypeId);
  }

  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }

  if (params?.brand) {
    filtered = filtered.filter((p) => p.brand.toLowerCase() === params.brand!.toLowerCase());
  }

  if (params?.minRating) {
    filtered = filtered.filter((p) => p.rating >= params.minRating!);
  }

  if (params?.inStock) {
    filtered = filtered.filter((p) => p.inStock);
  }

  if (params?.stockThreshold === "low") {
    filtered = filtered.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 10);
  } else if (params?.stockThreshold === "moderate") {
    filtered = filtered.filter((p) => (p.stock ?? 0) > 10 && (p.stock ?? 0) <= 50);
  } else if (params?.stockThreshold === "high") {
    filtered = filtered.filter((p) => (p.stock ?? 0) > 50);
  }

  if (params?.sort === "price_asc") {
    filtered.sort((a, b) => (a.discountPrice ?? a.priceRetail) - (b.discountPrice ?? b.priceRetail));
  } else if (params?.sort === "price_desc") {
    filtered.sort((a, b) => (b.discountPrice ?? b.priceRetail) - (a.discountPrice ?? a.priceRetail));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const limit = params?.limit || 12;
  const page = params?.page || 1;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return { data, total, page, limit, totalPages };
}

export function searchProducts(query: string): MockProduct[] {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.nameEn.toLowerCase().includes(q) ||
      p.nameAr.includes(q) ||
      p.brand.toLowerCase().includes(q)
  );
}

export function getSubcategories(categoryId?: number): MockSubcategory[] {
  if (categoryId) return subcategories.filter((s) => s.categoryId === categoryId);
  return subcategories;
}

export function getItemTypes(subcategoryId?: number): MockItemType[] {
  if (subcategoryId) return itemTypes.filter((t) => t.subcategoryId === subcategoryId);
  return itemTypes;
}
