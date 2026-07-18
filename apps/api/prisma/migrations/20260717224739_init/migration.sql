-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('doctor_approver', 'agency_admin');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('post', 'carousel', 'reel', 'ad_creative');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'needs_changes', 'scheduled', 'published');

-- CreateEnum
CREATE TYPE "ComplianceSeverity" AS ENUM ('blocker', 'warning');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "topic" TEXT NOT NULL,
    "generated_copy" TEXT,
    "generated_media" JSONB NOT NULL DEFAULT '[]',
    "compliance_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "doctor_comments" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "scheduled_for" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "ig_media_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "severity" "ComplianceSeverity" NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "detail" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_status_log" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "from_status" "ContentStatus",
    "to_status" "ContentStatus" NOT NULL,
    "changed_by" TEXT,
    "actor" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "content_items_status_idx" ON "content_items"("status");

-- CreateIndex
CREATE INDEX "compliance_checks_content_item_id_idx" ON "compliance_checks"("content_item_id");

-- CreateIndex
CREATE INDEX "content_status_log_content_item_id_idx" ON "content_status_log"("content_item_id");

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_status_log" ADD CONSTRAINT "content_status_log_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_status_log" ADD CONSTRAINT "content_status_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
