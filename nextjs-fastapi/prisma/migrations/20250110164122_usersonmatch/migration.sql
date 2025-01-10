/*
  Warnings:

  - You are about to drop the `_UserMatches` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserMatches" DROP CONSTRAINT "_UserMatches_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserMatches" DROP CONSTRAINT "_UserMatches_B_fkey";

-- DropTable
DROP TABLE "_UserMatches";

-- CreateTable
CREATE TABLE "UsersOnMatch" (
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UsersOnMatch_pkey" PRIMARY KEY ("matchId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsersOnMatch_userId_matchId_key" ON "UsersOnMatch"("userId", "matchId");

-- AddForeignKey
ALTER TABLE "UsersOnMatch" ADD CONSTRAINT "UsersOnMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnMatch" ADD CONSTRAINT "UsersOnMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
