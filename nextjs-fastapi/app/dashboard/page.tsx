'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from '@prisma/client';
import { createClient } from '@/utils/supabase/client';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [hikes, setHikes] = useState<Activity[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Check authentication status using Supabase
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/login');
        return;
      }

      setUser({ email: user.email || '' });
    };

    // Fetch hikes
    const fetchHikes = async () => {
      try {
        const response = await fetch('/api/hikes');
        const data = await response.json();
        setHikes(data);
      } catch (error) {
        console.error('Failed to fetch hikes:', error);
      }
    };

    checkUser();
    fetchHikes();

    // Set up auth state listener
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
    router.push('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <p className="text-gray-700">Welcome, {user.email}!</p>
        </div>
        
        {/* Hiking Trails Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hikes.map((trail, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200">
                {trail.primaryImageId && (
                  <img 
                    src={`https://img.oastatic.com/img2/${trail.primaryImageId}/default/variant.jpg`} 
                    alt={trail.title} 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{trail.title}</h3>
                <div className="flex gap-4 mb-3">
                  <span className="text-sm text-gray-600">
                    <span className="font-medium">Difficulty:</span> {trail.difficulty}
                  </span>
                  <span className="text-sm text-gray-600">
                    <span className="font-medium">Length:</span> {trail.length} miles
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Elevation gain:</span> {trail.ascent} ft
                </p>
                <p className="text-gray-700">{trail.teaserText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
} 