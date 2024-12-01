-- CreateTable
CREATE TABLE "HikingTrail" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "teaser_text" TEXT NOT NULL,
    "description_short" TEXT NOT NULL,
    "description_long" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "landscape_rating" INTEGER NOT NULL,
    "experience_rating" INTEGER NOT NULL,
    "length" INTEGER NOT NULL,
    "ascent" INTEGER NOT NULL,
    "descent" INTEGER NOT NULL,
    "duration_min" DOUBLE PRECISION NOT NULL,
    "min_altitude" INTEGER NOT NULL,
    "max_altitude" INTEGER NOT NULL,
    "point_lat" DOUBLE PRECISION NOT NULL,
    "point_lon" DOUBLE PRECISION NOT NULL,
    "is_winter" BOOLEAN NOT NULL,
    "is_closed" BOOLEAN NOT NULL,
    "primary_region" TEXT NOT NULL,
    "primary_image_id" TEXT,
    "image_ids" TEXT NOT NULL,

    CONSTRAINT "HikingTrail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT,
    "location" TEXT,
    "experienceLevel" INTEGER NOT NULL,
    "preferredPace" TEXT,
    "dogFriendly" BOOLEAN,
    "transportation" TEXT,
    "spotifyConnected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
