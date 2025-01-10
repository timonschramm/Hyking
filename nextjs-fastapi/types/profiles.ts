import { Artist, Prisma, UserArtist } from '@prisma/client';

export type UserArtistWithArtist = Prisma.UserArtistGetPayload<{
  include: {
    artist: true
  }
}>;

export type ProfileWithArtistsAndInterestsAndSkills = Prisma.ProfileGetPayload<{
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
    skills: {
      include: {
        skill: true
        skillLevel: true
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