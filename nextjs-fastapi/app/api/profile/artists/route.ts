import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      console.error('[POST /api/profile/artists] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { artists } = await request.json();
    console.log('[POST /api/profile/artists] Received artists for upload:', artists);

    // Validate the incoming data
    if (!Array.isArray(artists) || artists.some(a => !a.spotifyId)) {
      console.error('[POST /api/profile/artists] Invalid artist data received');
      return NextResponse.json({ 
        error: 'Invalid artist data', 
        details: 'Each artist must have a spotifyId' 
      }, { status: 400 });
    }

    const results = await Promise.all(
      artists.map(async (artist: any) => {
        console.log(`[POST /api/profile/artists] Processing artist: ${artist.name} (spotifyId=${artist.spotifyId})`);
        try {
          // Ensure all required fields have default values
          const sanitizedArtist = {
            spotifyId: artist.spotifyId,
            name: artist.name || 'Unknown Artist',
            imageUrl: artist.imageUrl || '',
            hidden: artist.hidden || false,
            genres: Array.isArray(artist.genres) ? artist.genres : []
          };

          const result = await prisma.artist.upsert({
            where: {
              spotifyId: sanitizedArtist.spotifyId
            },
            create: {
              spotifyId: sanitizedArtist.spotifyId,
              name: sanitizedArtist.name,
              imageUrl: sanitizedArtist.imageUrl,
              hidden: sanitizedArtist.hidden,
              profiles: {
                connect: { id: user.id }
              },
              genres: {
                create: sanitizedArtist.genres.map((genre: string) => ({
                  name: genre
                }))
              }
            },
            update: {
              name: sanitizedArtist.name,
              imageUrl: sanitizedArtist.imageUrl,
              hidden: sanitizedArtist.hidden,
              profiles: {
                connect: { id: user.id }
              },
              genres: {
                deleteMany: {},
                create: sanitizedArtist.genres.map((genre: string) => ({
                  name: genre
                }))
              }
            },
            include: {
              genres: true,
              profiles: true
            }
          });
          console.log(`[POST /api/profile/artists] Successfully processed artist ${sanitizedArtist.name}`);
          return result;
        } catch (error) {
          console.error(`[POST /api/profile/artists] Error processing artist ${artist.name}:`, error);
          throw error;
        }
      })
    );

    console.log('[POST /api/profile/artists] Successfully uploaded all artists');
    return NextResponse.json(results);

  } catch (error) {
    console.error('[POST /api/profile/artists] Error in artist upload:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artists = await prisma.artist.findMany({
      where: {
        profiles: {
          some: {
            id: user.id
          }
        }
      },
      include: {
        genres: true,
        profiles: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('[GET /api/profile/artists] Raw artists from DB:', JSON.stringify(artists, null, 2));

    // Transform the data to match the expected format
    const transformedArtists = artists.map(artist => ({
      spotifyId: artist.spotifyId,
      name: artist.name,
      imageUrl: artist.imageUrl,
      genres: artist.genres,
      hidden: artist.hidden
    }));

    console.log('[GET /api/profile/artists] Transformed artists:', JSON.stringify(transformedArtists, null, 2));
    return NextResponse.json(transformedArtists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 