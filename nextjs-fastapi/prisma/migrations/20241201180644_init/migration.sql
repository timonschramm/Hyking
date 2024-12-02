/*
  Warnings:

  - You are about to drop the `HikingTrail` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Month" AS ENUM ('jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "imageUrl" TEXT;

-- DropTable
DROP TABLE "HikingTrail";

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "teaserText" TEXT NOT NULL,
    "descriptionShort" TEXT NOT NULL,
    "descriptionLong" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "landscapeRating" INTEGER NOT NULL,
    "experienceRating" INTEGER NOT NULL,
    "staminaRating" INTEGER NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "ascent" DOUBLE PRECISION NOT NULL,
    "descent" DOUBLE PRECISION NOT NULL,
    "durationMin" DOUBLE PRECISION NOT NULL,
    "minAltitude" DOUBLE PRECISION NOT NULL,
    "maxAltitude" DOUBLE PRECISION NOT NULL,
    "pointLat" DOUBLE PRECISION NOT NULL,
    "pointLon" DOUBLE PRECISION NOT NULL,
    "isWinter" BOOLEAN NOT NULL,
    "isClosed" BOOLEAN NOT NULL,
    "primaryRegion" TEXT NOT NULL,
    "primaryImageId" TEXT NOT NULL,
    "publicTransportFriendly" BOOLEAN NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "imageId" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
