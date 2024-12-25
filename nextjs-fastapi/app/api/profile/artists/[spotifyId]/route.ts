import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { spotifyId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hidden } = await request.json();

    const updatedArtist = await prisma.artist.update({
      where: {
        spotifyId: params.spotifyId,
      },
      data: {
        hidden,
      },
      include: {
        genres: true
      }
    });

    return NextResponse.json(updatedArtist);
  } catch (error) {
    console.error('Error updating artist:', error);
    return NextResponse.json({ error: 'Failed to update artist' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { spotifyId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Disconnect the artist from the user's profile instead of deleting it
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        artists: {
          disconnect: {
            spotifyId: params.spotifyId
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing artist:', error);
    return NextResponse.json({ error: 'Failed to remove artist' }, { status: 500 });
  }
} 