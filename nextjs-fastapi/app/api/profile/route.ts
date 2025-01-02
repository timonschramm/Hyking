import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { UserArtistWithArtist } from '@/app/types/profile';


export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        artists: {
          include: {
            artist: {
              include: {
                genres: true
              }
            }
          }
        },
        interests: {
          include: {
            interest: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Transform the data to match the expected format
    const transformedProfile = {
      ...profile,
      topArtists: profile.artists.map(userArtist => ({
        ...userArtist.artist,
        hidden: userArtist.hidden,
        profiles: [{
          profileId: userId,
          hidden: userArtist.hidden
        }]
      }))
    };

    // console.log('Raw profile data:', profile);
    // console.log('Transformed profile data:', transformedProfile);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const first_profileData = formData.get('profileData') ? JSON.parse(formData.get('profileData') as string) : {};
    const interests = formData.get('interests') ? JSON.parse(formData.get('interests') as string) : [];
    // Extract interests from profileData
    console.log("interests:", interests)
    console.log("profileData:", first_profileData)
    const { artists, topArtists, ...profileData } = first_profileData;
    // Clean the basic profile data
    let cleanedData = Object.fromEntries(
      Object.entries(profileData)
        .filter(([key, value]) => value !== undefined && key !== 'topArtists')
    );
    console.log("cleanedData:", cleanedData)
    // Handle image upload if present
    if (imageFile) {
      console.log('Processing image upload:', imageFile.name);
      // Delete old image if exists
      const currentProfile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { imageUrl: true }
      });

      if (currentProfile?.imageUrl) {
        const oldImagePath = currentProfile.imageUrl.split('/').pop();
        if (oldImagePath) {
          await supabase.storage
            .from('images')
            .remove([`profiles/${oldImagePath}`]);
        }
      }

      // Upload new image
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile, {
          contentType: imageFile.type,
          upsert: true,
          duplex: 'half',
          metadata: {
            owner_id: user.id
          }
        });

      console.log('Upload result:', uploadError || uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Add image URL to profile data
      cleanedData = {
        ...cleanedData,
        imageUrl: publicUrl
      };
    }

    const interestsUpdate = interests.length > 0 ? {
      deleteMany: {},
      create: interests.map((interestId: string) => ({
        id: crypto.randomUUID(),
        interest: {
          connect: { id: interestId }
        }
      }))
    } : undefined;

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


    // Update profile with all data
    const updatedProfile = await prisma.profile.update({
      where: { id: userId },
      data: {
        ...cleanedData,
        interests: interestsUpdate
      },
      include: {
        artists: {
          include: {
            artist: {
              include: {
                genres: true
              }
            }
          }
        },
        interests: {
          include: {
            interest: true
          }
        }
      }
    });

    // Transform the response to match expected format
    const transformedProfile = {
      ...updatedProfile,
      topArtists: updatedProfile.artists.map(userArtist => ({
        ...userArtist.artist,
        hidden: userArtist.hidden
      }))
    };

    return NextResponse.json(transformedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 