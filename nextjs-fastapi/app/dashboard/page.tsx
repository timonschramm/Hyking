'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode the JWT token to get the email (this is a simple way - in production use proper JWT verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setEmail(payload.sub);
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!email) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
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
          <p className="text-gray-700">Welcome, {email}!</p>
        </div>
        
        {/* Hiking Trails Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              name: "Mountain Creek Trail",
              difficulty: "Moderate",
              length: "5.2 miles",
              elevation: "1,200 ft",
              description: "A beautiful creek-side trail with moderate elevation gain and scenic viewpoints."
            },
            {
              name: "Pine Forest Loop",
              difficulty: "Easy",
              length: "3.5 miles",
              elevation: "400 ft",
              description: "Family-friendly loop through a serene pine forest with well-maintained paths."
            },
            {
              name: "Eagle Peak Summit",
              difficulty: "Hard",
              length: "8.7 miles",
              elevation: "3,100 ft",
              description: "Challenging trail leading to panoramic views from Eagle Peak summit."
            },
            {
              name: "Lakeside Nature Walk",
              difficulty: "Easy",
              length: "2.8 miles",
              elevation: "150 ft",
              description: "Peaceful lakeside trail perfect for bird watching and nature photography."
            }
          ].map((trail, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{trail.name}</h3>
                <div className="flex gap-4 mb-3">
                  <span className="text-sm text-gray-600">
                    <span className="font-medium">Difficulty:</span> {trail.difficulty}
                  </span>
                  <span className="text-sm text-gray-600">
                    <span className="font-medium">Length:</span> {trail.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Elevation gain:</span> {trail.elevation}
                </p>
                <p className="text-gray-700">{trail.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 