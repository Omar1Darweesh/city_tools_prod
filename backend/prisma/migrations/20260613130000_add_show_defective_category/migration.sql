-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "show_defective_category" BOOLEAN NOT NULL DEFAULT false;
