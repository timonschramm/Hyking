'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Artist {
  id: number;
  artistId: string;
  name: string;
  imageUrl: string;
  genres: { name: string }[];
  hidden: boolean;
}

export default function ArtistsList({ artists }: { artists: Artist[] }) {
  const [localArtists, setLocalArtists] = useState(artists);

  const toggleArtistVisibility = async (artistId: string) => {
    try {
      const artist = localArtists.find(a => a.artistId === artistId);
      if (!artist) return;

      const response = await fetch(`/api/profile/artists/${artistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: !artist.hidden })
      });

      if (response.ok) {
        setLocalArtists(prev => prev.map(a => 
          a.artistId === artistId ? { ...a, hidden: !a.hidden } : a
        ));
      }
    } catch (error) {
      console.error('Error toggling artist visibility:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {localArtists.map((artist) => (
        <div 
          key={artist.artistId}
          className={`relative group ${artist.hidden ? 'opacity-50' : ''}`}
          onClick={() => toggleArtistVisibility(artist.artistId)}
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
            {artist.genres.map(g => g.name).join(', ')}
          </p>
        </div>
      ))}
    </div>
  );
} 