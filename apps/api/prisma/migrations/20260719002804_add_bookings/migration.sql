-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('confirmed', 'cancelled', 'completed');

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "patient_phone" TEXT NOT NULL,
    "patient_name" TEXT,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "status" "BookingStatus" NOT NULL DEFAULT 'confirmed',
    "source" TEXT NOT NULL DEFAULT 'whatsapp',
    "notes" TEXT,
    "google_calendar_event_id" TEXT,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_scheduled_for_idx" ON "bookings"("scheduled_for");
