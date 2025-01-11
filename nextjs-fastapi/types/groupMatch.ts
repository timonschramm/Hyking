import { Prisma } from '@prisma/client'

// Define the include type for group matches
export const groupMatchInclude = {
  profiles: {
    include: {
      profile: {
        include: {
          skills: {
            include: {
              skill: true,
              skillLevel: true,
            },
          },
          interests: {
            include: {
              interest: true,
            },
          },
          artists: {
            include: {
              artist: {
                include: {
                  genres: true,
                },
              },
            },
          },
        },
      },
    },
  },
  hikeSuggestions: true,
  chatRoom: true,
} as const

// Get the type from Prisma using the include
export type GroupMatchWithIncludes = Prisma.GroupMatchGetPayload<{
  include: typeof groupMatchInclude
}>

// Props type for the GroupMatchCard component
export interface GroupMatchCardProps {
  groupMatch: GroupMatchWithIncludes & {
    currentUserId: string | null
  }
  onAccept: (groupMatchId: string) => void
  onViewChat?: (chatRoomId: string) => void
}

// Helper type for profile with group suggestion
export type ProfileWithGroupSuggestion = Prisma.ProfileOnGroupSuggestionGetPayload<{
  include: {
    profile: {
      include: {
        skills: {
          include: {
            skill: true
            skillLevel: true
          }
        }
        interests: {
          include: {
            interest: true
          }
        }
        artists: {
          include: {
            artist: {
              include: {
                genres: true
              }
            }
          }
        }
      }
    }
  }
}> 