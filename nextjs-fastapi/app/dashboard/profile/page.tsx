'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
// import SpotifyConnect from '@/app/components/SpotifyConnect';
import SpotifyArtists from '@/app/components/SpotifyArtists';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from 'next/navigation';
import SpotifyArtistsDisplay from '@/app/components/SpotifyArtistsDisplay';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
  topArtists?: {
    spotifyId: string;
    name: string;
    imageUrl: string;
    genres: { name: string }[];
    hidden: boolean;
  }[];
  imageUrl?: string;
  email?: string;
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

const ProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        {/* Profile Header */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg">
          <div className="absolute -bottom-16 left-6">
            <Skeleton className="w-32 h-32 rounded-full bg-gray-200" />
          </div>
          {/* Real edit button instead of skeleton */}
          <div className="absolute top-4 right-4">
            <button
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full"
              disabled
            >
              <PencilIcon className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="pt-20 px-6 pb-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Age Field - Static Label with Skeleton Value */}
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Age</label>
              <Skeleton className="h-10 w-full max-w-[200px] bg-gray-200" />
            </div>

            {/* Gender Field - Static Label with Skeleton Value */}
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Gender</label>
              <Skeleton className="h-10 w-full max-w-[200px] bg-gray-200" />
            </div>

            {/* Location Field - Static Label with Skeleton Value */}
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Location</label>
              <Skeleton className="h-10 w-full max-w-[300px] bg-gray-200" />
            </div>

            {/* Experience Level Field - Static Label with Skeleton Value */}
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Experience Level</label>
              <Skeleton className="h-10 w-full max-w-[250px] bg-gray-200" />
            </div>

            {/* Preferred Pace Field - Static Label with Skeleton Value */}
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Preferred Pace</label>
              <Skeleton className="h-10 w-full max-w-[250px] bg-gray-200" />
            </div>

            {/* Preferred Distance Field - Static Label with Skeleton Value */}
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Preferred Distance</label>
              <Skeleton className="h-10 w-full max-w-[250px] bg-gray-200" />
            </div>

            {/* Hobbies Field - Static Label with Skeleton Value */}
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Hobbies</label>
              <Skeleton className="h-10 w-full bg-gray-200" />
            </div>

            {/* Dog Friendly Field - Static Label with Skeleton Value */}
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Dog Friendly</label>
              <div className="flex items-center">
                <Skeleton className="h-6 w-6 rounded-md bg-gray-200 mr-2" />
                <Skeleton className="h-4 w-32 bg-gray-200" />
              </div>
            </div>

            {/* Transportation Field - Static Label with Skeleton Value */}
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Transportation</label>
              <Skeleton className="h-10 w-full max-w-[250px] bg-gray-200" />
            </div>

            {/* Spotify Section - Static Title with Skeleton Content */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Spotify Integration</h2>
                <Skeleton className="h-10 w-32 bg-gray-200 rounded-full" />
              </div>
              
              {/* Artists Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg bg-gray-200" />
                    <Skeleton className="h-4 w-3/4 bg-gray-200" />
                    <Skeleton className="h-4 w-1/2 bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>({
    topArtists: [],
    // ... other default values as needed
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ProfileData | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadProfileData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile data including artists
      const response = await fetch(`/api/profile/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch profile data');
      
      const profileData = await response.json();
      console.log('[Profile] Initial profile data:', profileData);

      // Fetch artists separately
      const artistsResponse = await fetch('/api/profile/artists');
      if (artistsResponse.ok) {
        const artists = await artistsResponse.json();
        console.log('[Profile] Artists from /api/profile/artists:', artists);
        
        profileData.topArtists = artists.map((artist: any) => ({
          spotifyId: artist.spotifyId,
          name: artist.name,
          imageUrl: artist.imageUrl,
          genres: artist.genres,
          hidden: artist.hidden
        }));
        
        console.log('[Profile] Final profile data with artists:', profileData);
      }

      setProfileData(profileData);
    } catch (error) {
      console.error('[Profile] Error loading profile data:', error);
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
    try {
      const response = await fetch('/api/connectToSpotify?from=profile');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
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

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const supabase = createClient();
      
      // Delete user on the client side
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error deleting account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        {/* Profile Header */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg">
          <div className="absolute -bottom-16 left-6">
            <div className="relative w-32 h-32">
              <Avatar className="w-32 h-32 border-4 border-white">
                <AvatarImage 
                  src={profileData?.imageUrl || ''} 
                  alt="Profile picture" 
                />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {profileData?.email?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer rounded-full">
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
            <div className="grid grid-cols-1 gap-6">
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

              {/* Spotify section */}
              <SpotifyArtistsDisplay
                artists={profileData?.topArtists}
                isConnected={profileData?.spotifyConnected || false}
                onDisconnect={handleSpotifyDisconnect}
                isEditable={isEditing}
                onArtistsChange={(artists) => {
                  console.log('Artists changed:', artists);
                  setProfileData(prev => ({
                    ...prev!,
                    topArtists: artists.map(artist => ({
                      ...artist,
                      genres: artist.genres.map(genre => 
                        typeof genre === 'string' ? { name: genre } : genre
                      )
                    }))
                  }));
                }}
              />
            </div>
          ) : (
            <p>No profile data found.</p>
          )}
        </div>
      </div>

      {/* <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">Delete Account</h3>
          <p className="text-red-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </button>
          {deleteError && (
            <p className="mt-2 text-red-600">{deleteError}</p>
          )}
        </div>
      </div> */}
    </div>
  );
}
