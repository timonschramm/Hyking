import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { spotifyId: string } }
) {
  try {
    const { hidden } = await request.json();
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    const artist = await prisma.artist.findUnique({
      where: { spotifyId: params.spotifyId },
    });

    if (!artist) {
      return new Response('Artist not found', { status: 404 });
    }

    const updatedUserArtist = await prisma.userArtist.update({
      where: {
        profileId_artistId: {
          profileId: user!.id,
          artistId: artist.id
        }
      },
      data: { hidden }
    });

    return Response.json(updatedUserArtist);
  } catch (error) {
    console.error('Error updating artist:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { spotifyId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    const artist = await prisma.artist.findUnique({
      where: { spotifyId: params.spotifyId },
    });

    if (!artist) {
      return new Response('Artist not found', { status: 404 });
    }

    // Disconnect the artist from the user's profile instead of deleting it
    await prisma.userArtist.delete({
      where: {
        profileId_artistId: {
          profileId: user!.id,
          artistId: artist.id
        }
      }
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error removing artist:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 