'use client';

import { useEffect, useState } from 'react';
import OnboardingFlow from '../components/OnboardingFlow';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { ProfileWithArtistsAndInterestsAndSkills } from '@/types/profiles';


export default function OnboardingPage() {
  const [initialData, setInitialData] = useState<ProfileWithArtistsAndInterestsAndSkills  | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/profile?userId=${user.id}`);
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Profile fetch error:', response.status, response.body, errorData);
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }
        
        const data = await response.json();
        
        // if (data.onboardingCompleted) {
        //   router.push('/dashboard');
        //   return;
        // }

        setInitialData(data);
      // console.log('initialDatafromonboarding:', data);
      } catch (error) {
        console.error("Error loading profile data:", error);
        setError(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [supabase.auth, router]);



  if (error) {
    return <div>Error: {error}</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading your profile... This may take a few seconds</p>
      </div>
    );
  }

  if (!initialData) return null;

  return <OnboardingFlow initialData={initialData} />;
} 