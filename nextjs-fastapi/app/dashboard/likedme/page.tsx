'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ProfileWithArtistsAndInterestsAndSkills } from '@/types/profiles';
import { UserCard } from '@/app/components/UserCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Heart, Loader2, SendHorizontal, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProfileDetailsDialog } from "@/app/components/ProfileDetailsDialog";

interface MinimalProfile {
  id: string;
  imageUrl: string | null;
  displayName: string | null;
  location: string | null;
  email: string | null;
}

interface Like {
  id: string;
  timestamp: Date;
  sender?: MinimalProfile;
  receiver?: MinimalProfile;
}

export default function LikedMe() {
  const [receivedLikes, setReceivedLikes] = useState<Like[]>([]);
  const [sentLikes, setSentLikes] = useState<Like[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        // Fetch both received and sent likes in parallel
        const [receivedData, sentData] = await Promise.all([
          fetch('/api/users/likes/received').then(res => res.json()),
          fetch('/api/users/likes/sent').then(res => res.json())
        ]);
        
        setReceivedLikes(receivedData);
        setSentLikes(sentData);
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

  const ProfileCard = ({ profile }: { profile: MinimalProfile }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-card rounded-xl">
          <div className="relative w-full h-[280px]">
            <Image
              src={profile.imageUrl || '/default-avatar.jpg'}
              alt={profile.displayName || 'User'}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-xl font-semibold text-white mb-1">
                {profile.displayName || profile.email?.split('@')[0] || 'Anonymous'}
              </h3>
              {profile.location && (
                <div className="flex items-center gap-1.5 text-white/90">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{profile.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="p-0 border-none !rounded-2xl overflow-hidden max-w-[95vw] md:max-w-[400px]">
        <ProfileDetailsDialog 
          profileId={profile.id}
          initialData={{
            imageUrl: profile.imageUrl,
            displayName: profile.displayName
          }}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary">Your Likes</h1>
        <p className="text-muted-foreground mt-1">Manage your connections and see who&apos;s interested in you</p>
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
              {receivedLikes.map((like) => (
                <ProfileCard key={like.id} profile={like.sender!} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-0">
          {sentLikes.length === 0 ? (
            <EmptyState type="sent" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {sentLikes.map((like) => (
                <ProfileCard key={like.id} profile={like.receiver!} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 