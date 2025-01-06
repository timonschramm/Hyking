'use client';
export const dynamic = 'force-dynamic';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);

  const fetchAndUploadArtists = async (token: string) => {
    console.log('fetchAndUploadArtists: Starting with token:', token);
    try {
      console.log('Fetching artists from Spotify with the bearer token...');
      const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=3', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Spotify API error 2:', errorText);
        throw new Error('Failed to fetch artists from Spotify');
      }

      const data = await response.json();
      console.log('Spotify responded with: ', data.items);

      if (!data.items?.length) {
        throw new Error('No artists received from Spotify');
      }

      const artists = data.items.map((artist: any) => ({
        spotifyId: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url,
        genres: artist.genres || [],
        hidden: false
      }));

      console.log('Preparing to POST artists to /api/profile/artists:', artists);
      const uploadResponse = await fetch('/api/profile/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artists }),
      });

      const responseText = await uploadResponse.text();
      console.log('artists uploadResponse status:', uploadResponse.status, '| response text:', responseText);

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload artists: ${responseText}`);
      }

      console.log('Successfully uploaded artists to DB.');
      return JSON.parse(responseText);

    } catch (error) {
      console.error('Error in artist flow:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!searchParams) return;
    const code = searchParams.get('code');
    const from = searchParams.get('from') || 'onboarding';
    console.log('Starting Spotify callback. "from" param is:', from);
    console.log('Received query param code:', code);

    const processCallback = async () => {
      try {
        if (!code) {
          throw new Error('No code parameter in callback URL');
        }
        console.log('Exchanging code for a token now...');

        const tokenResponse = await fetch(`/api/auth/spotify/callback?code=${code}`);

        console.log("Token exchange response:", tokenResponse);
        if (!tokenResponse.ok) {
          throw new Error('Token exchange failed');
        }

        const data = await tokenResponse.json();
        console.log('Token exchange response data in callback:', data);

        if (!data.access_token) {
          throw new Error('No access token received');
        }

        setSpotifyToken(data.access_token);

        console.log('Attempting auto-upload of artists...');
        await fetchAndUploadArtists(data.access_token);

        console.log('Setting user as spotifyConnected = true');
        await fetch('/api/profile/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ spotifyConnected: true }),
        });

        const isFromOnboarding = (from === 'onboarding');
        const redirectPath = isFromOnboarding ? '/onboarding' : '/dashboard/profile';
        console.log(`Redirecting user to ${redirectPath}`);
        router.push(redirectPath);

      } catch (error) {
        console.error('Error in callback process:', error);
        const errorPath = true
          ? '/onboarding?error=spotify_connection_failed'
          : '/dashboard/profile?error=spotify_connection_failed';
        router.push(errorPath);
      }
    };

    processCallback();
  }, [searchParams, router]);

  const handleManualUpload = async () => {
    if (!spotifyToken) {
      console.error('No Spotify token available for manual upload!');
      return;
    }
    console.log('Manual uploading artists with token:', spotifyToken);
    try {
      await fetchAndUploadArtists(spotifyToken);
      console.log('Manual upload completed successfully.');
    } catch (err) {
      console.error('Manual upload failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connecting to Spotify...</h1>
        <p>Please wait while we set up your music preferences. Check the console logs for details.</p>

        {spotifyToken && (
          <button
            onClick={handleManualUpload}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Upload Artists to DB (Manual)
          </button>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
} 