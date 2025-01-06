import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get refresh token from database
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { spotifyRefreshToken: true }
    });
    if (!profile?.spotifyRefreshToken) {
      return NextResponse.json({ error: 'No refresh token found' }, { status: 400 });
    }
    console.log("old refresh token:", profile.spotifyRefreshToken)


    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: profile.spotifyRefreshToken
      }).toString()
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    console.log("new token:", data.access_token)
    // Update tokens in database
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        spotifyAccessToken: data.access_token,
        spotifyTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        ...(data.refresh_token && { spotifyRefreshToken: data.refresh_token })
      }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
} 