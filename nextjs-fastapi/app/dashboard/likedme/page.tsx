'use client';
import { useEffect, useState } from 'react';
import { ProfileWithArtistsAndInterestsAndSkills } from '@/app/types/profile';
import { UserCard } from '@/app/components/UserCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";

export default function LikedMe() {
  const [receivedLikes, setReceivedLikes] = useState<ProfileWithArtistsAndInterestsAndSkills[]>([]);
  const [sentLikes, setSentLikes] = useState<ProfileWithArtistsAndInterestsAndSkills[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        // Fetch received likes
        const receivedResponse = await fetch('/api/users/likes/received');
        const receivedData = await receivedResponse.json();
        setReceivedLikes(receivedData.map((like: any) => like.sender));

        // Fetch sent likes
        const sentResponse = await fetch('/api/users/likes/sent');
        const sentData = await sentResponse.json();
        setSentLikes(sentData.map((like: any) => like.receiver));
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikes();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="received">
            Likes Received ({receivedLikes.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Likes Sent ({sentLikes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            {receivedLikes.map((profile) => (
              <UserCard
                key={profile.id}
                data={profile}
                active={true}
                removeCard={() => {}}
                disableActions={false}
                displayMode="grid"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            {sentLikes.map((profile) => (
              <UserCard
                key={profile.id}
                data={profile}
                active={true}
                removeCard={() => {}}
                disableActions={true}
                displayMode="grid"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 