"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Artist {
  spotifyId: string;
  name: string;
  imageUrl: string;
  genres: string[];
  hidden: boolean;
}

interface SpotifyArtistsProps {
  initialArtists?: Artist[];
  onArtistsChange?: (artists: Artist[]) => void;
  isEditable?: boolean;
}

export default function SpotifyArtists({ 
  initialArtists = [], 
  onArtistsChange,
  isEditable = true 
}: SpotifyArtistsProps) {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);

  useEffect(() => {
    console.log('SpotifyArtists received initialArtists:', initialArtists);
    setArtists(initialArtists);
  }, [initialArtists]);

  const toggleArtistVisibility = (spotifyId: string) => {
    if (!isEditable) return;

    const updatedArtists = artists.map(artist => 
      artist.spotifyId === spotifyId 
        ? { ...artist, hidden: !artist.hidden }
        : artist
    );
    setArtists(updatedArtists);
    onArtistsChange?.(updatedArtists);
  };

  if (!artists || artists.length === 0) {
    return <p className="text-gray-500 italic">No artists found</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {artists.map((artist) => (
        <div 
          key={artist.spotifyId}
          className={`relative group ${artist.hidden ? 'opacity-50' : ''} ${isEditable ? 'cursor-pointer' : ''}`}
          onClick={() => isEditable && toggleArtistVisibility(artist.spotifyId)}
        >
          <div className="aspect-square relative rounded-lg overflow-hidden">
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
          </div>
          <h3 className="mt-2 font-semibold">{artist.name}</h3>
          <p className="text-sm text-gray-500">
            {artist.genres.join(', ')}
          </p>
          {isEditable && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {artist.hidden ? 'Show' : 'Hide'}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 