/*
  Warnings:

  - You are about to drop the column `experienceLevel` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `preferredDistance` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `preferredPace` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `transportation` on the `Profile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matchingGroupSuggestionId]` on the table `ChatRoom` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "matchingGroupSuggestionId" TEXT;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "experienceLevel",
DROP COLUMN "preferredDistance",
DROP COLUMN "preferredPace",
DROP COLUMN "transportation";

-- DropEnum
DROP TYPE "ExperienceLevel";

-- DropEnum
DROP TYPE "PreferredDistance";

-- DropEnum
DROP TYPE "PreferredPace";

-- DropEnum
DROP TYPE "Transportation";

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillLevel" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "numericValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SkillLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkill" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillLevelId" TEXT NOT NULL,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingGroupSuggestion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chatRoomId" TEXT,

    CONSTRAINT "MatchingGroupSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileOnGroupSuggestion" (
    "profileId" TEXT NOT NULL,
    "matchingGroupSuggestionId" TEXT NOT NULL,
    "hasAccepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProfileOnGroupSuggestion_pkey" PRIMARY KEY ("profileId","matchingGroupSuggestionId")
);

-- CreateTable
CREATE TABLE "_ActivitySuggestions" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ActivitySuggestions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillLevel_skillId_name_key" ON "SkillLevel"("skillId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkill_profileId_skillId_key" ON "UserSkill"("profileId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchingGroupSuggestion_chatRoomId_key" ON "MatchingGroupSuggestion"("chatRoomId");

-- CreateIndex
CREATE INDEX "_ActivitySuggestions_B_index" ON "_ActivitySuggestions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_matchingGroupSuggestionId_key" ON "ChatRoom"("matchingGroupSuggestionId");

-- AddForeignKey
ALTER TABLE "SkillLevel" ADD CONSTRAINT "SkillLevel_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_skillLevelId_fkey" FOREIGN KEY ("skillLevelId") REFERENCES "SkillLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_matchingGroupSuggestionId_fkey" FOREIGN KEY ("matchingGroupSuggestionId") REFERENCES "MatchingGroupSuggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileOnGroupSuggestion" ADD CONSTRAINT "ProfileOnGroupSuggestion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileOnGroupSuggestion" ADD CONSTRAINT "ProfileOnGroupSuggestion_matchingGroupSuggestionId_fkey" FOREIGN KEY ("matchingGroupSuggestionId") REFERENCES "MatchingGroupSuggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivitySuggestions" ADD CONSTRAINT "_ActivitySuggestions_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivitySuggestions" ADD CONSTRAINT "_ActivitySuggestions_B_fkey" FOREIGN KEY ("B") REFERENCES "MatchingGroupSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
