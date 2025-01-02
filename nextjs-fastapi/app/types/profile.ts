import { Artist, Prisma, UserArtist } from '@prisma/client';

export type UserArtistWithArtist = Prisma.UserArtistGetPayload<{
  include: {
    artist: true
  }
}>;

export type ProfileWithArtistsAndInterests = Prisma.ProfileGetPayload<{
  include: {
    artists: {
      include: {
        artist: {
          include: {
            genres: true
          }
        }
      }
    }
    interests: {
      include: {
        interest: true
      }
    }
  }
}>; 

export type ProfileWithInterests = Prisma.ProfileGetPayload<{
  include: {
    interests: {
      include: {
        interest: true
      }
    }
  }
}>; 