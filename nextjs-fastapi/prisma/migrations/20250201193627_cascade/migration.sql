-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_groupMatchId_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ProfileOnGroupSuggestion" DROP CONSTRAINT "ProfileOnGroupSuggestion_groupMatchId_fkey";

-- DropForeignKey
ALTER TABLE "ProfileOnGroupSuggestion" DROP CONSTRAINT "ProfileOnGroupSuggestion_profileId_fkey";

-- DropForeignKey
ALTER TABLE "Season" DROP CONSTRAINT "Season_activityId_fkey";

-- DropForeignKey
ALTER TABLE "UsersOnMatch" DROP CONSTRAINT "UsersOnMatch_matchId_fkey";

-- DropForeignKey
ALTER TABLE "UsersOnMatch" DROP CONSTRAINT "UsersOnMatch_userId_fkey";

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnMatch" ADD CONSTRAINT "UsersOnMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnMatch" ADD CONSTRAINT "UsersOnMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_groupMatchId_fkey" FOREIGN KEY ("groupMatchId") REFERENCES "GroupMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileOnGroupSuggestion" ADD CONSTRAINT "ProfileOnGroupSuggestion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileOnGroupSuggestion" ADD CONSTRAINT "ProfileOnGroupSuggestion_groupMatchId_fkey" FOREIGN KEY ("groupMatchId") REFERENCES "GroupMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
