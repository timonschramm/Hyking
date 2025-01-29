-- CreateIndex
CREATE INDEX "Participant_profileId_idx" ON "Participant"("profileId");

-- CreateIndex
CREATE INDEX "UserArtist_profileId_hidden_idx" ON "UserArtist"("profileId", "hidden");

-- CreateIndex
CREATE INDEX "UserSkill_profileId_idx" ON "UserSkill"("profileId");

-- CreateIndex
CREATE INDEX "UserSwipe_receiverId_action_timestamp_idx" ON "UserSwipe"("receiverId", "action", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "UserSwipe_senderId_action_idx" ON "UserSwipe"("senderId", "action");
