/*
  Warnings:

  - Added the required column `description` to the `MatchingGroupSuggestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MatchingGroupSuggestion" ADD COLUMN     "description" TEXT NOT NULL;
