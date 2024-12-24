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
    
    if (code) {
      fetch(`/api/auth/spotify/callback?code=${code}`, {
        method: 'GET',
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.access_token) {
          localStorage.setItem('spotify_token', data.access_token);
          router.push(data.redirectTo);
        } else {
          throw new Error('No access token received');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        router.push('/onboarding?error=spotify_connection_failed');
      });
    } else {
      router.push('/onboarding?error=no_code');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connecting to Spotify...</h1>
        <p>Please wait while we complete the connection.</p>
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