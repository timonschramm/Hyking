import { Prisma } from '@prisma/client';

export type UserArtistWithArtist = Prisma.UserArtistGetPayload<{
  include: {
    artist: true;

  };
}>;


export type UserArtistWithArtistandGenres = Prisma.UserArtistGetPayload<{
  include: {
    artist: {
      include: {
        genres: true;
      }
    }
  }
}>;