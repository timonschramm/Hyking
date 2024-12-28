import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {

  try {
    const url = new URL(request.url);
    const rawIsProfile = url.searchParams.get('isProfile');
    const isProfile = rawIsProfile === '1' || rawIsProfile === 'true';
    console.log("Parsed isProfile:", isProfile);

    const code = url.searchParams.get('code');
    const path = isProfile ? '/profile' : '/onboarding';
    console.log("Path:", path);
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Get user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/callback${path}`;
    // Exchange the code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Spotify API error here:', errorData);
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: tokenResponse.status });
    }

    const data = await tokenResponse.json();
    console.log("Datahere:", data);

    // Fetch top artists before updating profile
    const topArtistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=3&time_range=long_term', {
      headers: {
        'Authorization': `Bearer ${data.access_token}`
      }
    });

    if (!topArtistsResponse.ok) {
      console.error('Failed to fetch top artists');
      // console.log('Top artists response:', await topArtistsResponse.json());
    } else {
      const topArtistsData = await topArtistsResponse.json();
      
      // Process each artist
      for (const artistData of topArtistsData.items) {
        // Create or update artist
        const artist = await prisma.artist.upsert({
          where: { spotifyId: artistData.id },
          update: {
            name: artistData.name,
            imageUrl: artistData.images[0]?.url || null,
          },
          create: {
            spotifyId: artistData.id,
            name: artistData.name,
            imageUrl: artistData.images[0]?.url || null,
          },
        });

        // Handle genres - first find existing genres
        const existingGenres = await prisma.genre.findMany({
          where: {
            name: {
              in: artistData.genres
            }
          }
        });

        const existingGenreNames = new Set(existingGenres.map(g => g.name));

        // Create any new genres that don't exist yet
        const genresToCreate = artistData.genres.filter((name: string) => !existingGenreNames.has(name));
        
        if (genresToCreate.length > 0) {
          await prisma.genre.createMany({
            data: genresToCreate.map((name: string) => ({ name })),
            skipDuplicates: true,
          });
        }

        // Get all genres (both existing and newly created)
        const allGenres = await prisma.genre.findMany({
          where: {
            name: {
              in: artistData.genres
            }
          }
        });

        // Connect genres to artist
        await prisma.artist.update({
          where: { id: artist.id },
          data: {
            genres: {
              connect: allGenres.map(genre => ({ id: genre.id }))
            }
          }
        });

        // Create UserArtist connection
        await prisma.userArtist.upsert({
          where: {
            profileId_artistId: {
              profileId: user.id,
              artistId: artist.id
            }
          },
          update: {}, // No updates needed if it exists
          create: {
            profileId: user.id,
            artistId: artist.id,
          },
        });
      }
    }

    // Store tokens in the database
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        spotifyAccessToken: data.access_token,
        spotifyRefreshToken: data.refresh_token,
        spotifyTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        spotifyConnected: true
      }
    });

    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 