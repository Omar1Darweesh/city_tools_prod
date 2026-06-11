-- AlterTable
ALTER TABLE "products" ADD COLUMN     "badge" VARCHAR(20),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "discount_price" DECIMAL(10,2),
ADD COLUMN     "images" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "is_best_sale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_popular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "store_statistics" (
    "id" SERIAL NOT NULL,
    "value" VARCHAR(50) NOT NULL,
    "label_en" VARCHAR(100) NOT NULL,
    "label_ar" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_discount_cards" (
    "id" SERIAL NOT NULL,
    "badge_en" VARCHAR(100),
    "badge_ar" VARCHAR(100),
    "title_en" VARCHAR(255) NOT NULL,
    "title_ar" VARCHAR(255),
    "desc_en" TEXT,
    "desc_ar" TEXT,
    "link_url" VARCHAR(500),
    "link_label_en" VARCHAR(100),
    "link_label_ar" VARCHAR(100),
    "bg_color" VARCHAR(20),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_discount_cards_pkey" PRIMARY KEY ("id")
);
