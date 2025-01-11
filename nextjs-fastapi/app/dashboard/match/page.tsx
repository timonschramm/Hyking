'use client';
import { AnimatePresence } from 'framer-motion';
import { Profile } from '@prisma/client';
import { useEffect, useState } from 'react';
import { UserCard, UserCardSkeleton } from '@/app/components/UserCard';
import { ProfileWithArtistsAndInterestsAndSkills } from '@/types/profiles';
import { createClient } from '@/utils/supabase/client';
import { set } from 'react-hook-form';


export default function Match() {
  const [profiles, setProfiles] = useState<ProfileWithArtistsAndInterestsAndSkills[]>([]);
  const [rightSwipe, setRightSwipe] = useState(0);
  const [leftSwipe, setLeftSwipe] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [noMoreProfiles, setNoMoreProfiles] = useState(false);


  const fetchProfiles = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const response = await fetch(`/api/userRecs/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const data = await response.json();

      if (data.status == 404) {
        setNoMoreProfiles(true);
      }
      else {
        setProfiles(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setIsLoading(false);
      console.log("fetchProfiles called");
    }

  };

  useEffect(() => {
    if (profiles.length == 0 && !noMoreProfiles) {
    fetchProfiles();}
    setProfiles((prev) => prev.slice(0, prev.length/2))
}, []);



  const activeIndex = 0;
 

  
  const removeCard = (id: string, action: 'right' | 'left') => {
    //setProfiles((prev) => prev.filter((profile) => profile.id !== id));
     setProfiles((prev) => {
      const uniqueProfiles = prev.filter((profile, index, self) =>
        index === self.findIndex((p) => p.id === profile.id)
      );
    const filteredProfiles = uniqueProfiles.filter((profile) => profile.id !== id);
    return filteredProfiles;
  });
    if (action === 'right') {
      setRightSwipe((prev) => prev + 1);
    } else {
      setLeftSwipe((prev) => prev + 1);
    }
    if (profiles.length < 2 && !noMoreProfiles){
      fetchProfiles();
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
