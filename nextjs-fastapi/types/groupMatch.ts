import { Prisma } from '@prisma/client'
import { 
  profileBasicFields, 
  profileListView, 
  profileWithAllData,
  profileArtistFields,
  profileInterestFields,
  profileSkillFields
} from '@/types/profiles'

// Basic group match fields for list views
export const groupMatchBasicFields = {
  id: true,
  createdAt: true,
  status: true,
} as const;

// Group match with basic profile information
export const groupMatchListView = {
  id: true,
  createdAt: true,
  description: true,
  profiles: {
    select: {
      profileId: true,
      hasAccepted: true,
      profile: {
        select: {
          id: true,
          imageUrl: true,
          displayName: true
        }
      }
    }
  },
  hikeSuggestions: {
    take: 1,
    select: {
      id: true,
      title: true,
      teaserText: true,
      descriptionShort: true,
      descriptionLong: true,
      primaryImageId: true,
      difficulty: true,
      length: true,
      durationMin: true,
      primaryRegion: true,
      pointLat: true,
      pointLon: true,
      ascent: true,
      descent: true,
      minAltitude: true,
      maxAltitude: true,
      isWinter: true,
      isClosed: true,
      publicTransportFriendly: true,
      landscapeRating: true,
      experienceRating: true,
      staminaRating: true,
      category: {
        select: {
          name: true
        }
      }
    }
  },
  chatRoom: {
    select: {
      id: true,
      lastMessage: true
    }
  }
} as const;

export type GroupMatchListView = Prisma.GroupMatchGetPayload<{
  select: typeof groupMatchListView
}>;

// Group match with hike suggestions
export const groupMatchWithHikes = {
  ...groupMatchBasicFields,
  hikeSuggestions: {
    select: {
      id: true,
      title: true,
      teaserText: true,
      primaryImageId: true,
      difficulty: true,
      length: true,
      category: {
        select: {
          name: true
        }
      }
    }
  }
} as const;

// Full group match data - use sparingly
export const groupMatchWithAllData = {
  ...groupMatchBasicFields,
  profiles: {
    select: {
      profileId: true,
      hasAccepted: true,
      profile: {
        select: {
          ...profileBasicFields,
          ...profileArtistFields,
          ...profileInterestFields,
          ...profileSkillFields
        }
      }
    }
  },
  hikeSuggestions: true,
  chatRoom: {
    select: {
      id: true,
      lastMessage: true
    }
  }
} as const;

export type GroupMatchWithAllData = Prisma.GroupMatchGetPayload<{
  select: typeof groupMatchWithAllData
}>;

// Type alias for the group match data used in the dashboard
export type GroupMatchWithIncludes = GroupMatchListView & {
  currentUserId: string | null;
};

// Props type for the GroupMatchCard component
export interface GroupMatchCardProps {
  groupMatch: GroupMatchWithIncludes
  onAccept: (groupMatchId: string) => void
  onViewChat?: (chatRoomId: string) => void
  onViewDetails?: () => void
}

// Helper type for profile with group suggestion - used when expanding details
export type ProfileWithGroupSuggestion = Prisma.ProfileOnGroupSuggestionGetPayload<{
  select: {
    profileId: true,
    hasAccepted: true,
    profile: {
      select: typeof profileWithAllData.select
    }
  }
}> 