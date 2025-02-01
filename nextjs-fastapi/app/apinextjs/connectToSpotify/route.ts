

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    const scopes = 'user-top-read';

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri || '')}`;

    return NextResponse.json({ url: spotifyAuthUrl });
  } catch (error) {
    console.error('Error generating Spotify auth URL:', error);
    return NextResponse.error();
  }
} 