import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { Genre, Prisma } from '@prisma/client';

// Type for incoming artist data
interface SpotifyArtistData {
  spotifyId: string;
  name: string;
  imageUrl?: string | null;
  genres: Genre[]; // Array of genre names as strings
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { artists } = await request.json();
    // console.log("artists in api:", artists)
    if (!Array.isArray(artists) || artists.some(a => !a.spotifyId)) {
      return NextResponse.json({ 
        error: 'Invalid artist data', 
        details: 'Each artist must have a spotifyId' 
      }, { status: 400 });
    }

    const results = await Promise.all(
      artists.map((artist: SpotifyArtistData) => processArtist(artist, user.id))
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('[POST /apinextjs/profile/artists] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function processArtist(artistData: SpotifyArtistData, userId: string) {
  try {
    // First upsert the artist
    const result = await prisma.artist.upsert({
      where: { 
        spotifyId: artistData.spotifyId 
      },
      create: {
        spotifyId: artistData.spotifyId,
        name: artistData.name,
        imageUrl: artistData.imageUrl || '',
        genres: {
          connectOrCreate: artistData.genres.map(genreName => ({
            where: { name: genreName.name },
            create: { name: genreName.name }
          }))
        }
      },
      update: {
        name: artistData.name,
        imageUrl: artistData.imageUrl || '',
        genres: {
          set: [], // Clear existing genres
          connectOrCreate: artistData.genres.map(genreName => ({
            where: { name: genreName.name },
            create: { name: genreName.name }
          }))
        }
      },
      include: {
        genres: true
      }
    });

    // Then try to create the profile connection, ignore if it already exists
    await prisma.userArtist.upsert({
      where: {
        profileId_artistId: {
          profileId: userId,
          artistId: result.id
        }
      },
      create: {
        profileId: userId,
        artistId: result.id
      },
      update: {} // No updates needed if it exists
    });

  
    return {
      ...result,
      profiles: [{ profileId: userId }]
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Handle unique constraint violation
        console.error(`Relationship already exists for artist ${artistData.name}`);
        // Continue execution
        return null;
      }
    }
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
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
   
    return NextResponse.json(profile.artists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add PATCH endpoint for toggling visibility
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse parameters from URL query
    const url = new URL(request.url);
    const artistId = url.searchParams.get('artistId');
    const hidden = url.searchParams.get('hidden') === 'true';

    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
    }

    const updatedUserArtist = await prisma.userArtist.update({
      where: {
        profileId_artistId: {
          profileId: user.id,
          artistId
        }
      },
      data: { hidden },
      include: {
        artist: {
          include: {
            genres: true
          }
        }
      }
    });
   // console.log("updatedUserArtist:", updatedUserArtist)

    return NextResponse.json(updatedUserArtist);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
      }
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add DELETE endpoint for removing artist association
export async function DELETE(request: Request) {
// console.log("DELETE request received");
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse artistId from URL query parameters
    const url = new URL(request.url);
    const artistId = url.searchParams.get('artistId');
    
    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
    }

  // console.log("artistId in delete:", artistId)
    await prisma.userArtist.delete({
      where: {
        profileId_artistId: {
          profileId: user.id,
          artistId: artistId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
  // console.log("error in delete:", error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
      // console.log("artist not found in delete")
        return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
      }
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 