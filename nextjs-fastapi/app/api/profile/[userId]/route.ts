import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

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
            artist: {
              include: {
                genres: true
              }
            }
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
          profileId: params.userId,
          hidden: userArtist.hidden
        }]
      }))
    };

    console.log('Raw profile data:', profile);
    console.log('Transformed profile data:', transformedProfile);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
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

    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const profileData = formData.get('profileData') ? JSON.parse(formData.get('profileData') as string) : {};

    let cleanedData = Object.fromEntries(
      Object.entries(profileData)
        .filter(([key, value]) => value !== undefined && key !== 'topArtists' && key !== 'artists')
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

    // Update profile with basic data first
    const updatedProfile = await prisma.profile.update({
      where: { id: params.userId },
      data: cleanedData,
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