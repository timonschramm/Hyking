import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: params.userId },
      include: {
        artists: {
          include: {
            genres: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('[GET /api/profile/[userId]] Profile with artists:', JSON.stringify(profile, null, 2));
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data instead of JSON
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const profileData = formData.get('profileData') ? JSON.parse(formData.get('profileData') as string) : {};

    let cleanedData = Object.fromEntries(
      Object.entries(profileData)
        .filter(([key, value]) => value !== undefined && key !== 'topArtists')
    );

    // Handle image upload if present
    if (imageFile) {
      console.log('Processing image upload:', imageFile.name);
      // Delete old image if exists
      const currentProfile = await prisma.profile.findUnique({
        where: { id: params.userId },
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

    // Handle topArtists if present
    if ('topArtists' in profileData) {
      // Handle hiding/showing artists
      const artistUpdates = profileData.topArtists.map((artist: any) => ({
        where: { spotifyId: artist.spotifyId },
        create: {
          spotifyId: artist.spotifyId,
          name: artist.name,
          imageUrl: artist.imageUrl,
          hidden: artist.hidden || false,
          genres: {
            create: artist.genres.map((genre: string) => ({
              name: genre
            }))
          }
        },
        update: {
          hidden: artist.hidden
        }
      }));

      await Promise.all(
        artistUpdates.map((update: any) =>
          prisma.artist.upsert(update)
        )
      );
    }

    // Handle artists if present
    if ('artists' in profileData) {
      const artistUpdates = profileData.artists.map((artist: any) => ({
        where: { 
          artistId_profileId: {
            artistId: artist.artistId,
            profileId: params.userId
          }
        },
        create: {
          artistId: artist.artistId,
          name: artist.name,
          imageUrl: artist.imageUrl,
          hidden: artist.hidden || false,
          genres: {
            connectOrCreate: artist.genres.map((genre: string) => ({
              where: { name: genre },
              create: { name: genre }
            }))
          }
        },
        update: {
          hidden: artist.hidden
        }
      }));

      await Promise.all(
        artistUpdates.map((update: any) =>
          prisma.artist.upsert(update)
        )
      );
    }

    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { id: params.userId },
      data: cleanedData,
      include: {
        artists: true
      }
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 