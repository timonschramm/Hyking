import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isProfile = searchParams.get('isProfile') === 'true';
    
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const callbackUrl = isProfile 
    
      ? `${process.env.SPOTIFY_REDIRECT_URI}/onboarding`
      : `${process.env.SPOTIFY_REDIRECT_URI}/profile`;
    
    console.log('process.env.SPOTIFY_CALLBACK_URL', process.env.SPOTIFY_CALLBACK_URL);

    console.log('callbackUrl', callbackUrl);
    if (!clientId) {
      console.error('Spotify client ID not configured');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=user-top-read`;

    return NextResponse.json({ url: spotifyAuthUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 