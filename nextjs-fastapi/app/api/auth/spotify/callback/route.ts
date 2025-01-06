import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 25;

export async function GET(request: Request) {
  console.log('=== Starting Spotify API Callback Handler ===');
  
  try {
    // Log incoming request details
    const url = new URL(request.url);
    console.log('Incoming request URL:', url.toString());
    console.log('Query parameters:', Object.fromEntries(url.searchParams));

    // Initialize Supabase and get user
    console.log('Initializing Supabase client...');
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Supabase auth error:', userError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    console.log('Authenticated user ID:', user?.id);

    // Get user profile
    console.log('Fetching user profile...');
    const profile = await prisma.profile.findUnique({
      where: { id: user?.id }
    });
    console.log('Profile found:', {
      id: profile?.id,
      onboardingCompleted: profile?.onboardingCompleted
    });

    // Parse request parameters
    const onboardingCompleted = profile?.onboardingCompleted;
    const rawIsProfile = url.searchParams.get('isProfile');
    const isProfile = rawIsProfile === '1' || rawIsProfile === 'true';
    const code = url.searchParams.get('code');
    const path = onboardingCompleted ? '/profile' : '/onboarding';
    
    console.log('Request parameters:', {
      onboardingCompleted,
      isProfile,
      path,
      codePresent: !!code
    });

    if (!code) {
      console.error('No authorization code provided');
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    if (!user) {
      console.error('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prepare Spotify API request
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/callback${path}`;
    
    console.log('Spotify API configuration:', {
      clientIdPresent: !!clientId,
      clientSecretPresent: !!clientSecret,
      redirectUri
    });

    // Exchange code for token
    console.log('Initiating token exchange with Spotify...');
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

    console.log('Token exchange response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Spotify token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorData
      });
      return NextResponse.json({ 
        error: 'Failed to exchange code for token',
        details: errorData
      }, { status: tokenResponse.status });
    }

    const data = await tokenResponse.json();
    console.log('Token exchange successful:', {
      access_token: data.access_token ? '✓ Present' : '✗ Missing',
      refresh_token: data.refresh_token ? '✓ Present' : '✗ Missing',
      expires_in: data.expires_in
    });

    // Fetch top artists
    console.log('Fetching top artists from Spotify...');
    const topArtistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=3&time_range=long_term', {
      headers: {
        'Authorization': `Bearer ${data.access_token}`
      }
    });

    if (!topArtistsResponse.ok) {
      console.error('Top artists fetch failed:', {
        status: topArtistsResponse.status,
        statusText: topArtistsResponse.statusText
      });
    } else {
      const topArtistsData = await topArtistsResponse.json();
      console.log(`Processing ${topArtistsData.items.length} top artists...`);

      for (const artistData of topArtistsData.items) {
        console.log(`Processing artist: ${artistData.name}`);
        
        try {
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
          console.log(`Artist ${artist.name} upserted successfully`);

          // Process genres
          console.log(`Processing ${artistData.genres.length} genres for ${artist.name}`);
          const existingGenres = await prisma.genre.findMany({
            where: {
              name: { in: artistData.genres }
            }
          });

          const existingGenreNames = new Set(existingGenres.map(g => g.name));
          const genresToCreate = artistData.genres.filter((name: string) => !existingGenreNames.has(name));
          
          if (genresToCreate.length > 0) {
            console.log(`Creating ${genresToCreate.length} new genres`);
            await prisma.genre.createMany({
              data: genresToCreate.map((name: string) => ({ name })),
              skipDuplicates: true,
            });
          }

          // Connect genres to artist
          const allGenres = await prisma.genre.findMany({
            where: {
              name: { in: artistData.genres }
            }
          });
          
          await prisma.artist.update({
            where: { id: artist.id },
            data: {
              genres: {
                connect: allGenres.map(genre => ({ id: genre.id }))
              }
            }
          });
          console.log(`Connected ${allGenres.length} genres to ${artist.name}`);

          // Create UserArtist connection
          await prisma.userArtist.upsert({
            where: {
              profileId_artistId: {
                profileId: user.id,
                artistId: artist.id
              }
            },
            update: {},
            create: {
              profileId: user.id,
              artistId: artist.id,
            },
          });
          console.log(`User-Artist connection created for ${artist.name}`);
        } catch (artistError) {
          console.error(`Error processing artist ${artistData.name}:`, artistError);
        }
      }
    }

    // Update profile with tokens
    console.log('Updating profile with Spotify tokens...');
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        spotifyAccessToken: data.access_token,
        spotifyRefreshToken: data.refresh_token,
        spotifyTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        spotifyConnected: true
      }
    });
    console.log('Profile updated successfully');

    console.log('=== Spotify Callback Completed Successfully ===');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('=== Spotify Callback Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('===============================');
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 