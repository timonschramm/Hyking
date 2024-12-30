/*
  Warnings:

  - You are about to drop the column `hobbies` on the `Profile` table. All the data in the column will be lost.
  - The primary key for the `UserInterest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `art` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `badminton` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `baking` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `bars` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `basketball` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `boardgames` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `chess` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `coldPlunging` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `concerts` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `cycling` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `dancing` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `deepChats` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `festivals` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `karaoke` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `mindfulness` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `movies` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `nutrition` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `reading` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `running` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `swimming` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `tv` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `videoGames` on the `UserInterest` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profileId,interestId]` on the table `UserInterest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `interestId` to the `UserInterest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `UserInterest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserInterest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterestCategory" AS ENUM ('SELF_CARE', 'SPORTS', 'CREATIVITY', 'GOING_OUT', 'STAYING_IN');

-- DropForeignKey
ALTER TABLE "UserInterest" DROP CONSTRAINT "UserInterest_userID_fkey";

-- DropIndex
DROP INDEX "UserInterest_id_key";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "hobbies";

-- AlterTable
ALTER TABLE "UserInterest" DROP CONSTRAINT "UserInterest_pkey",
DROP COLUMN "art",
DROP COLUMN "badminton",
DROP COLUMN "baking",
DROP COLUMN "bars",
DROP COLUMN "basketball",
DROP COLUMN "boardgames",
DROP COLUMN "chess",
DROP COLUMN "coldPlunging",
DROP COLUMN "concerts",
DROP COLUMN "cycling",
DROP COLUMN "dancing",
DROP COLUMN "deepChats",
DROP COLUMN "festivals",
DROP COLUMN "karaoke",
DROP COLUMN "mindfulness",
DROP COLUMN "movies",
DROP COLUMN "nutrition",
DROP COLUMN "reading",
DROP COLUMN "running",
DROP COLUMN "swimming",
DROP COLUMN "tv",
DROP COLUMN "userID",
DROP COLUMN "videoGames",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "interestId" TEXT NOT NULL,
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InterestCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterest_profileId_interestId_key" ON "UserInterest"("profileId", "interestId");

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
