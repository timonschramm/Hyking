'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
// import SpotifyConnect from '@/app/components/SpotifyConnect';
import ArtistsList from '@/app/components/ArtistsList';
import { v4 as uuidv4 } from 'uuid';

interface ProfileData {
  age?: number;
  gender?: string;
  location?: string;
  experienceLevel?: number;
  preferredPace?: number;
  preferredDistance?: number;
  hobbies?: string[];
  dogFriendly?: boolean;
  transportation?: number;
  spotifyConnected?: boolean;
  topArtists: {
    id: number;
    name: string;
    imageUrl: string;
    genres: { name: string }[];
  }[];
  imageUrl?: string;
}

// Helper functions to convert database values to display values
const experienceLevelMap = {
  0: 'Beginner (0-1)',
  1: 'Intermediate (1-2)',
  2: 'Advanced (2-3)',
  3: 'Expert (3)'
};

const paceMap = {
  0: 'Leisurely',
  1: 'Moderate',
  2: 'Fast',
  3: 'Very Fast'
};

const distanceMap = {
  0: '1-5 km',
  1: '5-10 km',
  2: '10-20 km',
  3: '20+ km'
};

const transportationMap = {
  0: 'Car',
  1: 'Public Transport',
  2: 'Both'
};

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const supabase = createClient();

  const loadProfileData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`/api/profile/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch profile data');
      
      const data = await response.json();
      setProfileData(data);
      setAvatarUrl(data.avatarUrl);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(profileData);
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const formData = new FormData();
      
      // Add profile data
      formData.append('profileData', JSON.stringify(editedData));
      
      // Add image if there's a new one
      if (newImageFile) { // You'll need to track the new image file in state
        formData.append('image', newImageFile);
      }

      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      const updatedProfile = await response.json();
      setProfileData(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSpotifyConnect = async () => {
    // Redirect to Spotify auth
    window.location.href = '/api/auth/spotify';
  };

  const handleSpotifyUpdate = async () => {
    try {
      const response = await fetch('/api/connectToSpotify?from=profile');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Error updating Spotify connection:', error);
    }
  };

  const handleSpotifyDisconnect = async () => {
    try {
      const response = await fetch('/api/spotify/disconnect', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to disconnect Spotify');
      
      // Refresh profile data
      loadProfileData();
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    console.log('Selected file:', file.name);
    
    // Create temporary URL for immediate preview
    const objectUrl = URL.createObjectURL(file);
    setProfileData(prev => prev ? { ...prev, imageUrl: objectUrl } : null);
    
    setNewImageFile(file);
  };

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (profileData?.imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(profileData.imageUrl);
      }
    };
  }, [profileData?.imageUrl]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        {/* Profile Header */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg">
          <div className="absolute -bottom-16 left-6">
            <div className="relative w-32 h-32 rounded-full border-4 border-white overflow-hidden">
              <Image
                src={profileData?.imageUrl || '/dummy-profile.jpg'}
                alt="Profile"
                fill
                className="object-cover"
              />
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="text-white text-sm">Change Photo</span>
                </label>
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full"
                >
                  <CheckIcon className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="pt-20 px-6 pb-6">
          {profileData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Age</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedData?.age || ''}
                    onChange={(e) => setEditedData({ ...editedData!, age: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                ) : (
                  <p className="text-lg">{profileData.age}</p>
                )}
              </div>

              {/* Gender Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Gender</label>
                {isEditing ? (
                  <select
                    value={editedData?.gender || ''}
                    onChange={(e) => setEditedData({ ...editedData!, gender: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-lg">{profileData.gender}</p>
                )}
              </div>

              {/* Location Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData?.location || ''}
                    onChange={(e) => setEditedData({ ...editedData!, location: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                ) : (
                  <p className="text-lg">{profileData.location}</p>
                )}
              </div>

              {/* Experience Level Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Experience Level</label>
                {isEditing ? (
                  <select
                    value={editedData?.experienceLevel}
                    onChange={(e) => setEditedData({ ...editedData!, experienceLevel: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {Object.entries(experienceLevelMap).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg">
                    {experienceLevelMap[profileData.experienceLevel as keyof typeof experienceLevelMap]}
                  </p>
                )}
              </div>

              {/* Preferred Pace Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Preferred Pace</label>
                {isEditing ? (
                  <select
                    value={editedData?.preferredPace}
                    onChange={(e) => setEditedData({ ...editedData!, preferredPace: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {Object.entries(paceMap).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg">
                    {paceMap[profileData.preferredPace as keyof typeof paceMap]}
                  </p>
                )}
              </div>

              {/* Preferred Distance Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Preferred Distance</label>
                {isEditing ? (
                  <select
                    value={editedData?.preferredDistance}
                    onChange={(e) => setEditedData({ ...editedData!, preferredDistance: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {Object.entries(distanceMap).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg">
                    {distanceMap[profileData.preferredDistance as keyof typeof distanceMap]}
                  </p>
                )}
              </div>

              {/* Hobbies Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Hobbies</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData?.hobbies?.join(', ') || ''}
                    onChange={(e) => setEditedData({ 
                      ...editedData!, 
                      hobbies: e.target.value.split(',').map(hobby => hobby.trim())
                    })}
                    placeholder="Enter hobbies separated by commas"
                    className="w-full p-2 border rounded-lg"
                  />
                ) : (
                  <p className="text-lg">{profileData.hobbies?.join(', ')}</p>
                )}
              </div>

              {/* Dog Friendly Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Dog Friendly</label>
                {isEditing ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedData?.dogFriendly || false}
                      onChange={(e) => setEditedData({ ...editedData!, dogFriendly: e.target.checked })}
                      className="w-4 h-4 mr-2"
                    />
                    <span>Yes, I&apos;m dog friendly</span>
                  </div>
                ) : (
                  <p className="text-lg">{profileData.dogFriendly ? 'Yes' : 'No'}</p>
                )}
              </div>

              {/* Transportation Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Transportation</label>
                {isEditing ? (
                  <select
                    value={editedData?.transportation}
                    onChange={(e) => setEditedData({ ...editedData!, transportation: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {Object.entries(transportationMap).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg">
                    {transportationMap[profileData.transportation as keyof typeof transportationMap]}
                  </p>
                )}
              </div>

              {/* Spotify Connected Field */}
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Spotify Connected</label>
                {isEditing ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedData?.spotifyConnected || false}
                      onChange={(e) => setEditedData({ ...editedData!, spotifyConnected: e.target.checked })}
                      className="w-4 h-4 mr-2"
                    />
                    <span>Connect to Spotify</span>
                  </div>
                ) : (
                  <p className="text-lg">{profileData.spotifyConnected ? 'Connected' : 'Not Connected'}</p>
                )}
              </div>

              <div className="col-span-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Spotify Integration</h2>
                    {/* <SpotifyConnect
                      isConnected={profileData?.spotifyConnected || false}
                      hasArtists={profileData?.topArtists?.length > 0}
                      onConnect={handleSpotifyConnect}
                      onUpdate={handleSpotifyUpdate}
                      onDisconnect={handleSpotifyDisconnect}
                    /> */}
                  </div>
                  {profileData?.spotifyConnected && (
                    <ArtistsList artists={profileData.topArtists || []} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p>No profile data found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
