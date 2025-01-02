import { NextRequest, NextResponse } from 'next/server';
import { prisma} from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { Artist, UserArtist } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ExperienceLevel, PreferredPace, PreferredDistance, Transportation } from '@prisma/client';
type UserArtistWithArtist = Prisma.UserArtistGetPayload<{
  include: {
    artist: true;
  };
}>;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    console.log("dataaa:", data);
    const { interests = [], artists = [], something = [], ...formData  } = data;
    console.log("something:", something);
    console.log("artistss:", artists);

    // First, ensure all artists exist in the database
    const artistPromises = artists.map(async (artist: UserArtistWithArtist) => {
      return prisma.artist.upsert({
        where: { spotifyId: artist.artist.spotifyId },
        create: {
          id: crypto.randomUUID(),
          spotifyId: artist.artist.spotifyId,
          name: artist.artist.name,
          imageUrl: artist.artist.imageUrl || null
        },
        update: {
          name: artist.artist.name,
          imageUrl: artist.artist.imageUrl || null
        }
      });
    });
    const createdArtists = await Promise.all(artistPromises);
    // Convert form data to match Prisma schema
    const profileData = {
      email: user.email,
      age: formData.Age ? parseInt(formData.Age) : undefined,
      gender: formData.Gender || undefined,
      location: formData.Location || undefined,
      experienceLevel: formData['Experience Level']?.[0] ? convertExperienceLevel(formData['Experience Level'][0]) : undefined,
      preferredPace: formData['Preferred Pace']?.[0] ? convertPreferredPace(formData['Preferred Pace'][0]) : undefined,
      preferredDistance: formData['Preferred Distance']?.[0] ? convertPreferredDistance(formData['Preferred Distance'][0]) : undefined,
      dogFriendly: formData['Dog Friendly'] || undefined,
      transportation: formData.Transportation ? convertTransportation(formData.Transportation) : undefined,
      spotifyConnected: formData.spotifyConnected || false,
      onboardingCompleted: formData.onboardingCompleted || false,
    };

    console.log("interestsss:", interests);
    const interestsUpdate = interests.length > 0 ? {
      deleteMany: {},
      create: interests.map((interestId: string) => ({
        id: crypto.randomUUID(),
        interest: {
          connect: { id: interestId }
        }
      }))
    } : undefined;

    const updatedProfile = await prisma.profile.update({
      where: { id: user.id },
      data: {
        ...profileData,
        interests: interestsUpdate,
        artists: {
          deleteMany: {},
          create: createdArtists.map((artist) => ({
            id: crypto.randomUUID(),
            artist: {
              connect: { id: artist.id }
            }
          }))
        }
      },
      include: {
        interests: {
          include: {
            interest: true
          }
        },
        artists: {
          include: {
            artist: true
          }
        }
      }
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// Helper functions to convert form values to database values
function convertExperienceLevel(level: string): ExperienceLevel | undefined {
  const mapping: Record<string, ExperienceLevel> = {
    'Beginner (0-1)': 'BEGINNER',
    'Intermediate (1-2)': 'INTERMEDIATE',
    'Advanced (2-3)': 'ADVANCED',
    'Expert (3)': 'EXPERT'
  };
  return mapping[level];
}

function convertPreferredPace(pace: string): PreferredPace | undefined {
  const mapping: Record<string, PreferredPace> = {
    'Leisurely': 'LEISURELY',
    'Moderate': 'MODERATE',
    'Fast': 'FAST',
    'Very Fast': 'VERY_FAST'
  };
  return mapping[pace];
}

function convertPreferredDistance(distance: string): PreferredDistance | undefined {
  const mapping: Record<string, PreferredDistance> = {
    '1-5 km': 'SHORT',
    '5-10 km': 'MEDIUM',
    '10-20 km': 'LONG',
    '20+ km': 'VERY_LONG'
  };
  return mapping[distance];
}

function convertTransportation(transport: string): Transportation | undefined {
  const mapping: Record<string, Transportation> = {
    'Car': 'CAR',
    'Public Transport': 'PUBLIC_TRANSPORT',
    'Both': 'BOTH'
  };
  return mapping[transport];
} 