'use client';
import { useEffect, useState } from 'react';
import { ProfileWithArtistsAndInterestsAndSkills } from '@/types/profiles';
import { UserCard } from '@/app/components/UserCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Heart, Loader2, SendHorizontal } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  const EmptyState = ({ type }: { type: 'received' | 'sent' }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-primary/5 p-4 mb-4">
        {type === 'received' ? (
          <Heart className="h-8 w-8 text-primary/60" />
        ) : (
          <SendHorizontal className="h-8 w-8 text-primary/60" />
        )}
      </div>
      <h3 className="text-lg font-medium text-primary">
        {type === 'received' ? 'No likes received yet' : 'No likes sent yet'}
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
        {type === 'received' 
          ? 'When someone likes your profile, they will appear here'
          : 'When you like someone, they will appear here'}
      </p>
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary">Your Likes</h1>
        <p className="text-muted-foreground mt-1">Manage your connections and see who's interested in you</p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground mb-6">
          <TabsTrigger 
            value="received"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Received ({receivedLikes.length})
          </TabsTrigger>
          <TabsTrigger 
            value="sent"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Sent ({sentLikes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-0">
          {receivedLikes.length === 0 ? (
            <EmptyState type="received" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-0">
          {sentLikes.length === 0 ? (
            <EmptyState type="sent" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 