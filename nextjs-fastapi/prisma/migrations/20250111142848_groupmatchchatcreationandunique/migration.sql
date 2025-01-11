/*
  Warnings:

  - You are about to drop the column `chatRoomId` on the `GroupMatch` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "GroupMatch_chatRoomId_key";

-- AlterTable
ALTER TABLE "ChatRoom" ALTER COLUMN "matchId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "GroupMatch" DROP COLUMN "chatRoomId";
