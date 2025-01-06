'use client';
import { AnimatePresence } from 'framer-motion';
import { Profile } from '@prisma/client';
import { useEffect, useState } from 'react';
import { UserCard, UserCardSkeleton} from '@/app/components/UserCard'
import { createClient } from '@/utils/supabase/client';


export default function Match() {
  const supabase = createClient();

  const [userRecs, setUserRecs] = useState<Profile[]>([]);
  const [rightSwipe, setRightSwipe] = useState(0);
  const [leftSwipe, setLeftSwipe] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRecommendations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const response = await fetch(`/api/userRecs/${user.id}`);
        const userData = await response.json();
        console.log(userData);
        setUserRecs(userData);

      } catch (error) {
        console.error('Failed to fetch user recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRecommendations();
  }, []);

  const activeIndex = userRecs.length - 1;
  
  const removeCard = (id: string, action: 'right' | 'left') => {
    setUserRecs((prev) => prev.filter((user) => user.id !== id));
    if (action === 'right') {
      setRightSwipe((prev) => prev + 1);
    } else {
      setLeftSwipe((prev) => prev + 1);
    }
  };
return (<div> <p> dummy</p></div>);
  /*return (
    <div className="relative flex h-[calc(100vh-5rem)] w-full items-center justify-center overflow-hidden bg-background dark:bg-primary text-primary dark:text-primary-white">
      <h1>Matching</h1>
      {isLoading ? (
        <UserCardSkeleton />
      ) : (
        <AnimatePresence>
          {userRecs.length ? (
            userRecs.map((user) => (
              <UserCard
                key={user.id}
                data={user}
                active={user.id === userRecs[activeIndex]?.id}
                removeCard={removeCard}
              />
            ))
          ) : (
            <h2 className="absolute z-10 text-center text-2xl font-bold text-primary dark:text-primary-white">
              No more activities available!
              <br />
              Come back later for more
            </h2>
          )}
        </AnimatePresence>
      )}
    </div>
  )*/
}