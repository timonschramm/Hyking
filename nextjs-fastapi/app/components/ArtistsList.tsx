'use client';

interface Artist {
  id: number;
  name: string;
  imageUrl: string;
  genres: { name: string }[];
}

interface ArtistsListProps {
  artists: Artist[];
}

export default function ArtistsList({ artists }: ArtistsListProps) {
  if (!artists.length) {
    return <p className="text-gray-500">No artists found</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {artists.map((artist) => (
        <div key={artist.id} className="bg-white rounded-lg shadow overflow-hidden">
          <img src={artist.imageUrl} alt={artist.name} className="w-full h-48 object-cover" />
          <div className="p-4">
            <h3 className="font-semibold text-lg">{artist.name}</h3>
            <div className="flex flex-wrap gap-1 mt-2">
              {artist.genres.slice(0, 3).map((genre) => (
                <span key={genre.name} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 