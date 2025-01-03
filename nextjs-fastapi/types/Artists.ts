import { Prisma } from '@prisma/client';

export type UserArtistWithArtist = Prisma.UserArtistGetPayload<{
  include: {
    artist: true;
  };
}>;
