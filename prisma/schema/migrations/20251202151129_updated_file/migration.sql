/*
  Warnings:

  - The values [GROUP,BACKPACK] on the enum `TravelType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TravelType_new" AS ENUM ('SOLO', 'FAMILY', 'FRIENDS');
ALTER TABLE "travel_plans" ALTER COLUMN "travelType" TYPE "TravelType_new" USING ("travelType"::text::"TravelType_new");
ALTER TYPE "TravelType" RENAME TO "TravelType_old";
ALTER TYPE "TravelType_new" RENAME TO "TravelType";
DROP TYPE "public"."TravelType_old";
COMMIT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentFor" TEXT,
ADD COLUMN     "planType" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentLocation" TEXT,
ADD COLUMN     "needPasswordChange" BOOLEAN NOT NULL DEFAULT true;
