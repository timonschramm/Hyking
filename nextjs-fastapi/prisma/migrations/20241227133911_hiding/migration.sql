/*
  Warnings:

  - The primary key for the `Artist` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `hidden` on the `Artist` table. All the data in the column will be lost.
  - The primary key for the `_ArtistGenres` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_ProfileArtists` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ArtistGenres" DROP CONSTRAINT "_ArtistGenres_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProfileArtists" DROP CONSTRAINT "_ProfileArtists_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProfileArtists" DROP CONSTRAINT "_ProfileArtists_B_fkey";

-- AlterTable
ALTER TABLE "Artist" DROP CONSTRAINT "Artist_pkey",
DROP COLUMN "hidden",
ALTER COLUMN "imageUrl" DROP NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Artist_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Artist_id_seq";

-- AlterTable
ALTER TABLE "_ArtistGenres" DROP CONSTRAINT "_ArtistGenres_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ADD CONSTRAINT "_ArtistGenres_AB_pkey" PRIMARY KEY ("A", "B");

-- DropTable
DROP TABLE "_ProfileArtists";

-- CreateTable
CREATE TABLE "UserArtist" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserArtist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserArtist_profileId_artistId_key" ON "UserArtist"("profileId", "artistId");

-- AddForeignKey
ALTER TABLE "UserArtist" ADD CONSTRAINT "UserArtist_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserArtist" ADD CONSTRAINT "UserArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistGenres" ADD CONSTRAINT "_ArtistGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
