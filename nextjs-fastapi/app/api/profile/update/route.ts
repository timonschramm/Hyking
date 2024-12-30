import { NextRequest, NextResponse } from 'next/server';
import { prisma} from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { Artist, UserArtist } from '@prisma/client';


type UserArtistWithArtist = UserArtist & {
  artist: Artist;
};

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
    const artistPromises = artists.map(async (artist: any) => {
      return prisma.artist.upsert({
        where: { spotifyId: artist.spotifyId },
        create: {
          id: crypto.randomUUID(),
          spotifyId: artist.spotifyId,
          name: artist.name,
          imageUrl: artist.imageUrl || null
        },
        update: {
          name: artist.name,
          imageUrl: artist.imageUrl || null
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
    
    // Update profile with relations
    const updatedProfile = await prisma.profile.update({
      where: { id: user.id },
      data: {
        ...profileData,
        interests: {
          deleteMany: {},
          create: interests.map((interestId: string) => ({
            id: crypto.randomUUID(),
            interest: {
              connect: { id: interestId }
            }
          }))
        },
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
function convertExperienceLevel(level: string): number | undefined {
  const mapping: { [key: string]: number } = {
    'Beginner (0-1)': 0,
    'Intermediate (1-2)': 1,
    'Advanced (2-3)': 2,
    'Expert (3)': 3
  };
  return mapping[level] ?? undefined;
}

function convertPreferredPace(pace: string): number | undefined {
  const mapping: { [key: string]: number } = {
    'Leisurely': 0,
    'Moderate': 1,
    'Fast': 2,
    'Very Fast': 3
  };
  return mapping[pace] ?? undefined;
}

function convertPreferredDistance(distance: string): number | undefined {
  const mapping: { [key: string]: number } = {
    '1-5 km': 0,
    '5-10 km': 1,
    '10-20 km': 2,
    '20+ km': 3
  };
  return mapping[distance] ?? undefined;
}

function convertTransportation(transport: string): number | undefined {
  const mapping: { [key: string]: number } = {
    'Car': 0,
    'Public Transport': 1,
    'Both': 2
  };
  return mapping[transport] ?? undefined;
} 