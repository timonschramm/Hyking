import Image from 'next/image';
import { Prisma } from '@prisma/client';

type ArtistWithDetails = Prisma.ArtistGetPayload<{
  include: {
    genres: true;
  }
}>;

type UserArtistWithArtistandGenres = Prisma.UserArtistGetPayload<{
  include: {
    artist: {
      include: {
        genres: true;
      }
    }
  }
}>;

interface UserArtistDisplayProps {
  artists: UserArtistWithArtistandGenres[];
}

export default function UserArtistDisplay({ artists }: UserArtistDisplayProps) {
  const visibleArtists = artists.filter(ua => !ua.hidden);

  return (
    <div className="grid grid-cols-3 gap-2">
      {visibleArtists.slice(0, 3).map(({ artist }) => (
        <div key={artist.spotifyId} className="space-y-1">
          <div className="aspect-square relative rounded-lg overflow-hidden">
            <Image
              src={artist.imageUrl || ''}
              alt={artist.name}
              fill
              sizes="(max-width: 768px) 33vw, 25vw"
              className="object-cover"
            />
          </div>
          <div className="text-xs">
            <p className="font-medium truncate">{artist.name}</p>
            {artist.genres && artist.genres.length > 0 && (
              <p className="text-gray-500 truncate">
                {artist.genres.slice(0, 1).map(genre => genre.name).join(', ')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 