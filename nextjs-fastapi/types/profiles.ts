import { Prisma } from '@prisma/client';

export type UserArtistWithArtist = Prisma.UserArtistGetPayload<{
  include: {
    artist: true
  }
}>;

// Basic profile fields that are always needed
export const profileBasicFields = {
  id: true,
  imageUrl: true,
  displayName: true,
  age: true,
  gender: true,
  location: true,
} as const;

export type ProfileBasic = Prisma.ProfileGetPayload<{
  select: typeof profileBasicFields
}>;

// Artist related fields
export const profileArtistFields = {
  artists: {
    include: {
      artist: {
        include: {
          genres: true
        }
      }
    }
  }
} as const;

// Interest related fields
export const profileInterestFields = {
  interests: {
    include: {
      interest: true
    }
  }
} as const;

// Skill related fields
export const profileSkillFields = {
  skills: {
    include: {
      skill: true,
      skillLevel: true
    }
  }
} as const;

// Profile with artists
export type ProfileWithArtists = Prisma.ProfileGetPayload<{
  select: typeof profileBasicFields & typeof profileArtistFields
}>;

// Profile with interests
export type ProfileWithInterests = Prisma.ProfileGetPayload<{
  select: typeof profileBasicFields & typeof profileInterestFields
}>;

// Profile with skills
export type ProfileWithSkills = Prisma.ProfileGetPayload<{
  select: typeof profileBasicFields & typeof profileSkillFields
}>;

// Full profile data - use sparingly
export const profileWithAllData = {
  select: {
    ...profileBasicFields,
    ...profileArtistFields,
    ...profileInterestFields,
    ...profileSkillFields,
  }
} as const;

export type ProfileWithAllData = Prisma.ProfileGetPayload<typeof profileWithAllData>;

// For list views where we need minimal data
export const profileListView = {
  select: {
    ...profileBasicFields,
    interests: {
      take: 3,
      include: {
        interest: true
      }
    }
  }
} as const;

export type ProfileListView = Prisma.ProfileGetPayload<typeof profileListView>; 


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
