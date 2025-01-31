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
  // console.log('=== Starting Spotify Callback Flow (Onboarding) ===');
  // console.log('Received code:', code);
  // console.log('Full URL:', window.location.href);

    const processCallback = async () => {
      try {
        if (!code) {
          console.error('No code found in URL parameters');
          throw new Error('No code parameter in callback URL');
        }

      // console.log('Making token exchange request...');
        const tokenResponse = await fetch(`/api/auth/spotify/callback?code=${code}&path=/onboarding`);
        
      // console.log('Token Response Status:', tokenResponse.status);
      // console.log('Token Response Headers:', Object.fromEntries(tokenResponse.headers.entries()));
        
        // Clone the response for logging
        const responseClone = tokenResponse.clone();
        const rawResponseText = await responseClone.text();
      // console.log('Raw Response Body:', rawResponseText);

        if (!tokenResponse.ok) {
          console.error('Token exchange failed with status:', tokenResponse.status);
          console.error('Error response body:', rawResponseText);
          throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }

        let data;
        try {
          data = JSON.parse(rawResponseText);
        // console.log('Parsed token data:', {
          //   access_token: data.access_token ? '✓ Present' : '✗ Missing',
          //   token_type: data.token_type,
          //   expires_in: data.expires_in,
          //   refresh_token: data.refresh_token ? '✓ Present' : '✗ Missing'
          // });
        } catch (parseError) {
          console.error('Failed to parse token response:', parseError);
          throw new Error('Invalid JSON in token response');
        }

        if (!data.access_token) {
          console.error('No access token in response data:', data);
          throw new Error('No access token received');
        }

      // console.log('Successfully received access token, redirecting...');
        router.push('/onboarding');

      } catch (error: any) {
        console.error('=== Callback Error Details ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('========================');
        
        router.push('/onboarding?error=spotify_connection_failed');
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connecting to Spotify...</h1>
        <h2>This can take around half a minute.</h2>

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