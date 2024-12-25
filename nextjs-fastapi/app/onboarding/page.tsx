'use client';

import { useEffect, useState } from 'react';
import OnboardingFlow from '../components/OnboardingFlow';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [initialData, setInitialData] = useState(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // If no user is found, redirect to login
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/profile/${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch profile data");
        
        const data = await response.json();
        setInitialData(data);
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    }

    loadProfileData();
  }, [supabase.auth, router]);

  // Show nothing while checking authentication
  if (!initialData) return null;

  return <OnboardingFlow initialData={initialData} />;
} 