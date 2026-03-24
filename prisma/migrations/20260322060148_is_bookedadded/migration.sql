-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "bookedBy" BIGINT,
ADD COLUMN     "isBooked" BOOLEAN NOT NULL DEFAULT false;
