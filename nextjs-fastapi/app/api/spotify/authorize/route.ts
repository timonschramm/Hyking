import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawIsProfile = searchParams.get('isProfile');
    console.log("Raw isProfile param:", rawIsProfile);
    
    const isProfile = rawIsProfile === '1' || rawIsProfile === 'true';
    console.log("Parsed isProfile:", isProfile);
    
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const baseRedirectUri = process.env.SPOTIFY_REDIRECT_URI;
    
    const path = isProfile ? '/profile' : '/onboarding';
    const callbackUrl = `${baseRedirectUri}${path}`;
    
    console.log("Final callbackUrl:", callbackUrl);

    if (!clientId) {
      console.error('Spotify client ID not configured');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const authParams = [
      `client_id=${clientId}`,
      'response_type=code',
      `redirect_uri=${encodeURIComponent(callbackUrl)}`,
      'scope=user-top-read'
    ];

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${authParams.join('&')}`;
    const response = NextResponse.json({ url: spotifyAuthUrl });
    console.log("Response:", response);
    return response;
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 