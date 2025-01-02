/*
  Warnings:

  - The `experienceLevel` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `preferredPace` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `preferredDistance` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `transportation` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "PreferredPace" AS ENUM ('LEISURELY', 'MODERATE', 'FAST', 'VERY_FAST');

-- CreateEnum
CREATE TYPE "PreferredDistance" AS ENUM ('SHORT', 'MEDIUM', 'LONG', 'VERY_LONG');

-- CreateEnum
CREATE TYPE "Transportation" AS ENUM ('CAR', 'PUBLIC_TRANSPORT', 'BOTH');

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "experienceLevel",
ADD COLUMN     "experienceLevel" "ExperienceLevel",
DROP COLUMN "preferredPace",
ADD COLUMN     "preferredPace" "PreferredPace",
DROP COLUMN "preferredDistance",
ADD COLUMN     "preferredDistance" "PreferredDistance",
DROP COLUMN "transportation",
ADD COLUMN     "transportation" "Transportation";
