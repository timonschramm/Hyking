'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from '@prisma/client';

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [hikes, setHikes] = useState<Activity[]>([]);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode the JWT token to get the email
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setEmail(payload.sub);
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
    }

    // Fetch hikes
    const fetchHikes = async () => {
      try {
        const response = await fetch('/api/hikes');
        const data = await response.json();
        // console.log("data:", JSON.stringify(data, null, 2));
        setHikes(data);
      } catch (error) {
        console.error('Failed to fetch hikes:', error);
      }
    };

    fetchHikes();
  }, [router]);

  if (!email) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('spotify_token');
              router.push('/login');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <p className="text-gray-700">Welcome, {email}!</p>
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
    </div>
  );
} 