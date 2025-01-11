'use client';
import { AnimatePresence } from 'framer-motion';
import { Profile } from '@prisma/client';
import { useEffect, useState } from 'react';
import { UserCard, UserCardSkeleton } from '@/app/components/UserCard';
import { ProfileWithArtistsAndInterestsAndSkills } from '@/types/profiles';
import { createClient } from '@/utils/supabase/client';


export default function Match() {
  const [profiles, setProfiles] = useState<ProfileWithArtistsAndInterestsAndSkills[]>([]);
  const [rightSwipe, setRightSwipe] = useState(0);
  const [leftSwipe, setLeftSwipe] = useState(0);
  const [isLoading, setIsLoading] = useState(true);


  const fetchProfiles = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const response = await fetch(`/api/userRecs/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const data = await response.json();

 
      setProfiles(prev => [...prev, ...data]);
   
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setIsLoading(false);
      console.log("fetchProfiles called");
    }
  };



  useEffect(() => {
      fetchProfiles();

  }, []);


  const activeIndex = profiles.length - 1;
  console.log("activeIndex:", activeIndex);

  
  const removeCard = (id: string, action: 'right' | 'left') => {
    setProfiles((prev) => prev.filter((profile) => profile.id !== id));
    if (action === 'right') {
      setRightSwipe((prev) => prev + 1);
    } else {
      setLeftSwipe((prev) => prev + 1);
    }
  };
  return (//( <div className="flex flex-col gap-4"> {JSON.stringify(profiles)}</div>)

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
                    displayMode="stack"
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
