'use client';

import { useEffect, useState } from 'react';
import OnboardingFlow from '../components/OnboardingFlow';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Prisma } from '@prisma/client';

type ProfileWithArtists = Prisma.ProfileGetPayload<{
  include: {
    artists: {
      include: {
        artist: {
          include: {
            genres: true
          }
        }
      }
    }
  }
}>;

export default function OnboardingPage() {
  const [initialData, setInitialData] = useState<ProfileWithArtists | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/profile/${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch profile data");
        
        const data = await response.json();
        
        if (data.onboardingCompleted) {
          router.push('/dashboard');
          return;
        }

        setInitialData(data);
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    }

    loadProfileData();
  }, [supabase.auth, router]);

  if (!initialData) return null;

  return <OnboardingFlow initialData={initialData} />;
} 