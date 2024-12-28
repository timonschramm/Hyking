'use client';
export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;
    const code = searchParams.get('code');
    console.log('Starting Spotify callback for onboarding');
    console.log('Received query param code:', code);

    const processCallback = async () => {
      try {
        if (!code) {
          throw new Error('No code parameter in callback URL');
        }
        const tokenResponse = await fetch(`/api/auth/spotify/callback?code=${code}&path=/onboarding`);
        console.log('Token exchange response status:', tokenResponse.status);

        console.log("Token exchange response status onbo:", tokenResponse);
        console.log("Token exchange response status onbo:", tokenResponse.body);
        if (!tokenResponse.ok) {
          throw new Error('Token exchange failed');
        }

        const data = await tokenResponse.json();
        console.log('Token exchange response data:', data);

        if (!data.access_token) {
          throw new Error('No access token received');
        }

        // Redirect back to onboarding
        router.push('/onboarding');

      } catch (error) {
        console.error('Error in callback process:', error);
        router.push('/onboarding?error=spotify_connection_failed');
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connecting to Spotify...</h1>
        <p>Please wait while we set up your music preferences.</p>
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