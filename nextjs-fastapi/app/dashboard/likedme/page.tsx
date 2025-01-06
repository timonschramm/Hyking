'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ProfileWithArtistsAndInterests } from '@/app/types/profile';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Check, X, Music, MapPin } from 'lucide-react';
import UserArtistDisplay from '@/app/components/UserArtistDisplay';

interface ReceivedLike {
  sender: ProfileWithArtistsAndInterests;
  timestamp: string;
}

export default function LikedMe() {
  const [receivedLikes, setReceivedLikes] = useState<ReceivedLike[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReceivedLikes = async () => {
      try {
        const response = await fetch('/api/users/likes/received');
        if (!response.ok) throw new Error('Failed to fetch received likes');
        const data = await response.json();
        setReceivedLikes(data);
      } catch (error) {
        console.error('Failed to fetch received likes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceivedLikes();
  }, []);

  const handleAction = async (userId: string, action: 'like' | 'dislike') => {
    try {
      const response = await fetch('/api/users/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: userId,
          action,
        }),
      });

      if (!response.ok) throw new Error('Failed to record swipe');

      const result = await response.json();
      if (result.match) {
        console.log('It\'s a match!', result.match);
      }

      setReceivedLikes(prev => prev.filter(like => like.sender.id !== userId));
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[3/4]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-4 md:px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{receivedLikes.length} like{receivedLikes.length === 1 ? "" : "s"} </h1>
        <div className="flex gap-2">
          {/* Add your filter/sort buttons here if needed */}
        </div>
      </div>
      
      {receivedLikes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-primary-medium dark:text-primary-white/70">
            When someone likes your profile, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
          {receivedLikes.map((like) => (
            <Dialog key={like.sender.id}>
              <DialogTrigger asChild>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer">
                  <Image
                    src={like.sender.imageUrl || '/default-avatar.png'}
                    alt={`${like.sender.email}'s profile`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-2">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-white text-sm font-medium leading-tight">
                          {like.sender.email.split('@')[0]}
                        </h3>
                        <p className="text-white/90 text-xs">
                          {like.sender.age} years
                        </p>
                      </div>
                      {like.sender.location && (
                        <div className="flex items-center text-white/90">
                          <MapPin className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                  {like.sender.spotifyConnected && (
                    <div className="absolute top-2 right-2">
                      <Music className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </DialogTrigger>

              <DialogContent className="p-0 border-none !rounded-2xl overflow-hidden max-w-[95vw] md:max-w-[400px]">
                <div className="no-scrollbar max-h-[85vh] overflow-y-auto rounded-2xl">
                  <div className="relative h-[40vh] md:h-[50vh]">
                    <Image
                      src={like.sender.imageUrl || '/default-avatar.png'}
                      fill
                      alt={`${like.sender.email}'s profile`}
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-4 p-6 bg-background-white dark:bg-primary">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-semibold">{like.sender.email.split('@')[0]}</h2>
                      <span className="text-lg">{like.sender.age || '?'} years</span>
                    </div>

                    {like.sender.bio && (
                      <p className="text-primary-medium dark:text-primary-white">
                        {like.sender.bio}
                      </p>
                    )}

                    {like.sender.interests.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {like.sender.interests.map((userInterest) => (
                            <span
                              key={userInterest.interestId}
                              className="rounded-full bg-secondary-sage dark:bg-primary-white/10 px-3 py-1 text-xs"
                            >
                              {userInterest.interest.displayName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {like.sender.artists.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Top Artists</h3>
                        <UserArtistDisplay artists={like.sender.artists} />
                      </div>
                    )}

                    <div className="flex justify-center gap-4 pt-4">
                      <button
                        onClick={() => handleAction(like.sender.id, 'dislike')}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/80 text-white transition-transform hover:scale-110"
                      >
                        <X className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleAction(like.sender.id, 'like')}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/80 text-white transition-transform hover:scale-110"
                      >
                        <Check className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
} 