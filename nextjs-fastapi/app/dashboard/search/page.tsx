'use client';
import Card from '@/app/components/Card';
import { AnimatePresence } from 'framer-motion';
import { Activity } from '@prisma/client';
import { useEffect, useState } from 'react';

export default function Search() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rightSwipe, setRightSwipe] = useState(0);
  const [leftSwipe, setLeftSwipe] = useState(0);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/hikes');
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
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
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-bgBlack text-textGrey">
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
          <h2 className="absolute z-10 text-center text-2xl font-bold text-textGrey">
            No more activities available!
            <br />
            Come back later for more
          </h2>
        )}
      </AnimatePresence>
    </div>
  );
}