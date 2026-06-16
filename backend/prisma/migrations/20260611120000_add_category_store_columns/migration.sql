-- AlterTable
ALTER TABLE "categories" ADD COLUMN "slug" VARCHAR(255),
ADD COLUMN "color" VARCHAR(20) DEFAULT '#2563eb',
ADD COLUMN "icon" VARCHAR(50) DEFAULT 'Wrench';

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
