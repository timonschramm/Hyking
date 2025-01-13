"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeSlashIcon, TrashIcon, ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { Artist as PrismaArtist, Genre, UserArtist, Prisma } from '@prisma/client';

// Define type for Artist with relations using Prisma's utility types
type ArtistWithRelations = Prisma.ArtistGetPayload<{
  include: {
    genres: true;
    profiles: {
      include: {
        profile: true;
      }
    }
  }
}>;

type ProfileWithArtistsAndInterests = Prisma.ProfileGetPayload<{
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
        interests: {
          include: {
            interest: true
          }
        }
      }
}>;

// Simplified props interface
interface SpotifyArtistsDisplayProps {
    isConnected: boolean;
    onDisconnect?: () => void;
    isEditable?: boolean;
    profile: ProfileWithArtistsAndInterests;
}

export const SpotifyArtistsDisplaySkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square relative">
              <Skeleton className="absolute inset-0 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SpotifyArtistsDisplay({
  isConnected,
  onDisconnect,
  isEditable = false,
  profile,
}: SpotifyArtistsDisplayProps) {
  // Update state to use profile.artists directly
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // If connected but no artists, fetch them automatically
    if (isConnected && profile.artists.length === 0 && !isRefreshing) {
      refreshArtists();
    }
  }, [isConnected]);

  const onConnect = async () => {
    try {
      const params = new URLSearchParams({
        isProfile: isEditable ? '1' : '0'
      });
      
      console.log("Params:", params.toString());
      const response = await fetch(`/api/spotify/authorize?${params}`);

      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const data = await response.json();
      alert(data.url);
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast.error('Failed to connect to Spotify');
    }
  };

  const fetchSpotifyArtists = async (token: string): Promise<ArtistWithRelations[]> => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=3', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshResponse = await fetch('/api/spotify/refresh-token', {
            method: 'POST'
          });

          if (!refreshResponse.ok) {
            if (refreshResponse.status === 400) {
              // No refresh token, need to reconnect
              await onConnect();
              return [];
            }
            throw new Error('Failed to refresh token');
          }

          const { access_token } = await refreshResponse.json();
          console.log("new token:", access_token)
          return fetchSpotifyArtists(access_token);
        }
        throw new Error('Failed to fetch artists');
      }
      
      const data = await response.json();
      
      return data.items.map((artist: any) => ({
        id: '', // Will be assigned by database
        spotifyId: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        genres: artist.genres.map((genreName: string) => ({
          id: '', // Will be assigned by database
          name: genreName
        })),
        profiles: [] // This will be populated by the database
      }));
    } catch (error) {
      console.error('Error fetching artists:', error);
      throw error;
    }
  };

  const refreshArtists = async () => {
    setIsRefreshing(true);
    try {
      const token = await refreshSpotifyToken();
      if (!token) return;

      const newArtists = await fetchSpotifyArtists(token);
      if (!newArtists) return;

      // Upload to database
      console.log("newArtists:", newArtists)
      const response = await fetch('/api/profile/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artists: newArtists }),
      });

      if (!response.ok) throw new Error('Failed to update artists in database');
      
      // No need to manage local state - let the page refresh handle updates
      toast.success('Artists refreshed successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing artists:', error);
      toast.error('Failed to refresh artists');
    } finally {
      setIsRefreshing(false);
    }
  };

  const deleteArtist = async (spotifyId: string) => {
    try {
      const response = await fetch(`/api/profile/artists?artistId=${spotifyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete artist');
      
      // Show success message
      toast.success('Artist removed successfully');
      
      // Trigger a page refresh to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error deleting artist:', error);
      toast.error('Failed to remove artist');
    }
  };

  const toggleArtistVisibility = async (spotifyId: string) => {
    try {
      const artistToUpdate = profile.artists.find(a => a.artist.spotifyId === spotifyId);
      if (!artistToUpdate) return;

      const response = await fetch(`/api/profile/artists?artistId=${artistToUpdate.artistId}&hidden=${!artistToUpdate.hidden}`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to update artist visibility');
      
      // Show success message
      toast.success('Artist visibility updated');
      
      // Trigger a page refresh to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error toggling artist visibility:', error);
      toast.error('Failed to update artist visibility');
    }
  };

  const refreshSpotifyToken = async () => {
    try {
      // First try to refresh the token
      const response = await fetch('/api/spotify/refresh-token', {
        method: 'POST',
      });

      if (response.status === 400) {
        // If no refresh token, initiate new connection
        await onConnect();
        return null;
      }

      if (!response.ok) throw new Error('Failed to refresh token');
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast.error('Failed to refresh Spotify connection');
      throw error;
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <Button 
          onClick={onConnect}
          className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
        >
          Connect to Spotdifyy
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Top Artists</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshArtists}
            disabled={isRefreshing}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Artists
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {profile.artists.map(({ artist, hidden }) => (
          <div 
            key={artist.spotifyId}
            className={`relative group ${hidden ? 'opacity-50' : ''}`}
          >
            <div className="aspect-square relative rounded-lg overflow-hidden">
              <Image
                src={artist.imageUrl || ''}
                alt={artist.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover"
              />
                <div 
                  className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 
                  opacity-0 group-hover:opacity-100 md:transition-opacity
                  touch:opacity-100 touch:bg-black/30"
                >
                  <button
                    onClick={() => toggleArtistVisibility(artist.spotifyId)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 
                    transition-colors active:scale-95 transform"
                    aria-label={hidden ? "Show artist" : "Hide artist"}
                  >
                    {hidden ? (
                      <EyeIcon className="w-5 h-5 text-white" />
                    ) : (
                      <EyeSlashIcon className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteArtist(artist.id)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 
                    transition-colors active:scale-95 transform"
                    aria-label="Delete artist"
                  >
                    <TrashIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              
            </div>
            <h3 className="mt-2 font-semibold">{artist.name}</h3>
            <p className="text-sm text-gray-500">
              {artist.genres.slice(0, 2).map(genre => genre.name).join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 