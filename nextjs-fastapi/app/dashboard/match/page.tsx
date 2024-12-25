'use client';
import { Card, CardSkeleton } from '@/app/components/Card';
import { AnimatePresence } from 'framer-motion';
import { Activity } from '@prisma/client';
import { useEffect, useState } from 'react';

export default function Match() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rightSwipe, setRightSwipe] = useState(0);
  const [leftSwipe, setLeftSwipe] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/hikes');
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const activeIndex = activities.length - 1;
  
  const removeCard = (id: number, action: 'right' | 'left') => {
    setActivities((prev) => prev.filter((activity) => activity.id !== id));
    if (action === 'right') {
      setRightSwipe((prev) => prev + 1);
    } else {
      setLeftSwipe((prev) => prev + 1);
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-5rem)] w-full items-center justify-center overflow-hidden bg-background dark:bg-primary text-primary dark:text-primary-white">
      <h1>Matching</h1>
      {isLoading ? (
        <CardSkeleton />
      ) : (
        <AnimatePresence>
          {activities.length ? (
            activities.map((activity) => (
              <Card
                key={activity.id}
                data={activity}
                active={activity.id === activities[activeIndex]?.id}
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
  );
}