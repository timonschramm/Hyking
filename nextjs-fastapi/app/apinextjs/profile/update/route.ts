import { NextRequest, NextResponse } from 'next/server';
import { prisma} from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { Artist, UserArtist } from '@prisma/client';
import { Prisma } from '@prisma/client';
export const maxDuration = 25;

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

    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const jsonData = formData.get('data') as string;
    const data = JSON.parse(jsonData);
    const { interests = [], artists = [], skills = [] } = data;

    // Handle image upload if present
    let imageUrl;
    if (imageFile) {
      // Delete old image if exists
      const currentProfile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { imageUrl: true }
      });

      if (currentProfile?.imageUrl) {
        const oldImagePath = currentProfile.imageUrl.split('/').pop();
        if (oldImagePath) {
          await (await supabase).storage
            .from('images')
            .remove([`profiles/${oldImagePath}`]);
        }
      }

      // Upload new image
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await (await supabase).storage
        .from('images')
        .upload(filePath, imageFile, {
          contentType: imageFile.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = (await supabase).storage
        .from('images')
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

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
      displayName: data.displayName || undefined,
      email: user.email,
      age: data.age ? parseInt(data.age) : undefined,
      gender: data.gender || undefined,
      location: data.location || undefined,
      dogFriendly: data.dogFriendly,
      spotifyConnected: data.spotifyConnected || false,
      onboardingCompleted: data.onboardingCompleted || false,
    };

    const interestsUpdate = interests.length > 0 ? {
      deleteMany: {},
      create: interests.map((interestId: string) => ({
        id: crypto.randomUUID(),
        interest: {
          connect: { id: interestId }
        }
      }))
    } : undefined;

    const skillsUpdate = skills.length > 0 ? {
      deleteMany: {},
      create: skills.map((skill: { skillId: string, skillLevelId: string }) => ({
        id: crypto.randomUUID(),
        skill: {
          connect: { id: skill.skillId }
        },
        skillLevel: {
          connect: { id: skill.skillLevelId }
        }
      }))
    } : undefined;

    const updatedProfile = await prisma.profile.update({
      where: { id: user.id },
      data: {
        ...profileData,
        interests: interestsUpdate,
        skills: skillsUpdate,
        imageUrl: imageUrl || undefined,
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
        },
        skills: {
          include: {
            skill: true,
            skillLevel: true
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