'use client';

import { useEffect, useState } from 'react';
import OnboardingFlow from '../components/OnboardingFlow';
import { createClient } from '@/utils/supabase/client';

export default function OnboardingPage() {
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const response = await fetch(`/api/profile/${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch profile data");
        
        const data = await response.json();
        setInitialData(data);
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
  }, [supabase.auth]);

  if (isLoading) return <div>Loading...</div>;

  return <OnboardingFlow initialData={initialData} />;
} 