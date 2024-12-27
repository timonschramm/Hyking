-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "spotifyAccessToken" TEXT,
ADD COLUMN     "spotifyTokenExpiry" TIMESTAMP(3);
