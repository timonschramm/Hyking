'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from '@prisma/client';
import { createClient } from '@/utils/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto bg-background-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="bg-background-white rounded-lg shadow-md overflow-hidden border-secondary-gray">
            {/* Image skeleton */}
            <div className="h-48">
              <Skeleton className="w-full h-full bg-gray-200" />
            </div>
            
            {/* Content skeleton */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <Skeleton className="h-7 w-3/4 bg-gray-200" />
              
              {/* Stats */}
              <div className="flex gap-4">
                <Skeleton className="h-5 w-24 bg-gray-200" />
                <Skeleton className="h-5 w-32 bg-gray-200" />
              </div>
              
              {/* Elevation */}
              <Skeleton className="h-5 w-40 bg-gray-200" />
              
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-gray-200" />
                <Skeleton className="h-4 w-5/6 bg-gray-200" />
                <Skeleton className="h-4 w-4/6 bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [hikes, setHikes] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/login');
        return;
      }

      setUser({ email: user.email || '' });
    };

    const fetchHikes = async () => {
      try {
        const response = await fetch('/api/hikes');
        const data = await response.json();
        setHikes(data);
      } catch (error) {
        console.error('Failed to fetch hikes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
    fetchHikes();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-background-white">
      {/* <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary">
          Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded bg-secondary-sage text-primary-white hover:bg-secondary-gray transition-colors"
        >
          Logout
        </button>
      </div> */}
  


      {/* Hiking Trails Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hikes.map((trail, index) => (
          <div key={index} 
               className="bg-background-white rounded-lg shadow-md overflow-hidden border-secondary-gray">
            <div className="h-48 bg-background-light">
              {trail.primaryImageId && (
                <img 
                  src={`https://img.oastatic.com/img2/${trail.primaryImageId}/default/variant.jpg`} 
                  alt={trail.title} 
                  className="w-full h-full object-cover rounded-2xl" 
                />
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">
                {trail.title}
              </h3>
              <div className="flex gap-4 mb-3">
                <span className="text-sm text-primary">
                  <span className="font-medium">Difficulty:</span> {trail.difficulty}
                </span>
                <span className="text-sm text-primary">
                  <span className="font-medium">Length:</span> {trail.length} miles
                </span>
              </div>
              <p className="text-sm mb-2 text-primary">
                <span className="font-medium">Elevation gain:</span> {trail.ascent} ft
              </p>
              <p className="text-primary">{trail.teaserText}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 