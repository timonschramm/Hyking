/*
  Warnings:

  - You are about to drop the column `matchingGroupSuggestionId` on the `ChatRoom` table. All the data in the column will be lost.
  - The primary key for the `ProfileOnGroupSuggestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `matchingGroupSuggestionId` on the `ProfileOnGroupSuggestion` table. All the data in the column will be lost.
  - You are about to drop the `MatchingGroupSuggestion` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[groupMatchId]` on the table `ChatRoom` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `groupMatchId` to the `ProfileOnGroupSuggestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_matchingGroupSuggestionId_fkey";

-- DropForeignKey
ALTER TABLE "ProfileOnGroupSuggestion" DROP CONSTRAINT "ProfileOnGroupSuggestion_matchingGroupSuggestionId_fkey";

-- DropForeignKey
ALTER TABLE "_ActivitySuggestions" DROP CONSTRAINT "_ActivitySuggestions_B_fkey";

-- DropIndex
DROP INDEX "ChatRoom_matchingGroupSuggestionId_key";

-- AlterTable
ALTER TABLE "ChatRoom" DROP COLUMN "matchingGroupSuggestionId",
ADD COLUMN     "groupMatchId" TEXT;

-- AlterTable
ALTER TABLE "ProfileOnGroupSuggestion" DROP CONSTRAINT "ProfileOnGroupSuggestion_pkey",
DROP COLUMN "matchingGroupSuggestionId",
ADD COLUMN     "groupMatchId" TEXT NOT NULL,
ADD CONSTRAINT "ProfileOnGroupSuggestion_pkey" PRIMARY KEY ("profileId", "groupMatchId");

-- DropTable
DROP TABLE "MatchingGroupSuggestion";

-- CreateTable
CREATE TABLE "GroupMatch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chatRoomId" TEXT,
    "description" TEXT NOT NULL,

    CONSTRAINT "GroupMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupMatch_chatRoomId_key" ON "GroupMatch"("chatRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_groupMatchId_key" ON "ChatRoom"("groupMatchId");

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_groupMatchId_fkey" FOREIGN KEY ("groupMatchId") REFERENCES "GroupMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileOnGroupSuggestion" ADD CONSTRAINT "ProfileOnGroupSuggestion_groupMatchId_fkey" FOREIGN KEY ("groupMatchId") REFERENCES "GroupMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivitySuggestions" ADD CONSTRAINT "_ActivitySuggestions_B_fkey" FOREIGN KEY ("B") REFERENCES "GroupMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
