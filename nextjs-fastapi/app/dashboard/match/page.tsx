'use client';
import { AnimatePresence } from 'framer-motion';
import { Profile } from '@prisma/client';
import { useEffect, useState } from 'react';
import { UserCard, UserCardSkeleton } from '@/app/components/UserCard';
import { ProfileWithArtistsAndInterests } from '@/app/types/profile';
export default function Match() {
  const [profiles, setProfiles] = useState<ProfileWithArtistsAndInterests[]>([]);
  const [rightSwipe, setRightSwipe] = useState(0);
  const [leftSwipe, setLeftSwipe] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch('/api/userRecs');
        if (!response.ok) {
          throw new Error('Failed to fetch profiles');
        }
        const data = await response.json();
        setProfiles(data);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const activeIndex = profiles.length - 1;
  
  const removeCard = (id: string, action: 'right' | 'left') => {
    setProfiles((prev) => prev.filter((profile) => profile.id !== id));
    if (action === 'right') {
      setRightSwipe((prev) => prev + 1);
    } else {
      setLeftSwipe((prev) => prev + 1);
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-5rem)] w-full items-center justify-center overflow-hidden bg-background dark:bg-primary text-primary dark:text-primary-white">
      <div className="absolute inset-0 flex items-center justify-center">
        {isLoading ? (
          <UserCardSkeleton />
        ) : (
          <AnimatePresence mode="popLayout">
            {profiles.length ? (
              profiles.map((profile, index) => (
                index === activeIndex && (
                  <UserCard
                    key={profile.id}
                    data={profile}
                    active={true}
                    removeCard={removeCard}
                  />
                )
              ))
            ) : (
              <h2 className="text-center text-2xl font-bold text-primary dark:text-primary-white">
                No more profiles available!
                <br />
                Come back later for more
              </h2>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}