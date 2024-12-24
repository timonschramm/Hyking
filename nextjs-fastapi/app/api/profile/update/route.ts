import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // if(user.id != undefined) {
    //     console.log(`User ID is defined ${user.id}`);
    //   return NextResponse.json({ error: `User ID is defined ${user.id}` }, { status: 431 });
    // }

    const userData = await req.json();

    // Convert form data to match your Prisma schema
    const profileData = {
      email: user.email,
      age: userData['Age'] ? parseInt(userData['Age']) : undefined,
      gender: userData['Gender'] || undefined,
      location: userData['Location'] || undefined,
      experienceLevel: userData['Experience Level']?.[0] ? convertExperienceLevel(userData['Experience Level'][0]) : undefined,
      preferredPace: userData['Preferred Pace']?.[0] ? convertPreferredPace(userData['Preferred Pace'][0]) : undefined,
      preferredDistance: userData['Preferred Distance']?.[0] ? convertPreferredDistance(userData['Preferred Distance'][0]) : undefined,
      hobbies: userData['Hobbies'] || [], // Ensure hobbies is always an array
      dogFriendly: userData['Dog Friendly'] || undefined,
      transportation: userData['Transportation'] ? convertTransportation(userData['Transportation']) : undefined,
      spotifyConnected: userData.spotifyConnected || false
    };

    // Remove undefined values for the update operation
    const cleanedProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, value]) => value !== undefined)
    );

    // Upsert the profile
    const updatedProfile = await prisma.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
        ...cleanedProfileData,
      },
      update: cleanedProfileData,
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
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