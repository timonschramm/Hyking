-- CreateTable
CREATE TABLE "UserInterest" (
    "userID" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "nutrition" BOOLEAN NOT NULL DEFAULT false,
    "coldPlunging" BOOLEAN NOT NULL DEFAULT false,
    "deepChats" BOOLEAN NOT NULL DEFAULT false,
    "mindfulness" BOOLEAN NOT NULL DEFAULT false,
    "badminton" BOOLEAN NOT NULL DEFAULT false,
    "basketball" BOOLEAN NOT NULL DEFAULT false,
    "running" BOOLEAN NOT NULL DEFAULT false,
    "cycling" BOOLEAN NOT NULL DEFAULT false,
    "swimming" BOOLEAN NOT NULL DEFAULT false,
    "art" BOOLEAN NOT NULL DEFAULT false,
    "dancing" BOOLEAN NOT NULL DEFAULT false,
    "bars" BOOLEAN NOT NULL DEFAULT false,
    "karaoke" BOOLEAN NOT NULL DEFAULT false,
    "concerts" BOOLEAN NOT NULL DEFAULT false,
    "festivals" BOOLEAN NOT NULL DEFAULT false,
    "baking" BOOLEAN NOT NULL DEFAULT false,
    "chess" BOOLEAN NOT NULL DEFAULT false,
    "boardgames" BOOLEAN NOT NULL DEFAULT false,
    "reading" BOOLEAN NOT NULL DEFAULT false,
    "movies" BOOLEAN NOT NULL DEFAULT false,
    "tv" BOOLEAN NOT NULL DEFAULT false,
    "videoGames" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("userID")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserInterest_id_key" ON "UserInterest"("id");

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userID_fkey" FOREIGN KEY ("userID") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
