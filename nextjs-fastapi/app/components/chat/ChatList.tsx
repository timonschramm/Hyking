import { Prisma } from '@prisma/client';
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchWithDetails } from '@/types/chat';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

type ChatListProps = {
  matches: MatchWithDetails[];
  selectedMatch: MatchWithDetails | null;
  onSelectMatch: (match: MatchWithDetails) => void;
  isLoading: boolean;
};

export default function ChatList({ matches, selectedMatch, onSelectMatch, isLoading }: ChatListProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {matches.map((match) => {
          // Find the other user in the match (not the current user)
          const otherUserMatch = match.users.find(u => u.userId !== currentUserId);
          const otherUser = otherUserMatch?.user;
          const lastMessage = match.chatRoom?.messages[match.chatRoom.messages.length - 1];

          if (!otherUser) return null;

          return (
            <button
              key={match.id}
              onClick={() => onSelectMatch(match)}
              className={`w-full flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                selectedMatch?.id === match.id
                  ? 'bg-secondary'
                  : 'hover:bg-secondary/50'
              }`}
            >
              <Avatar>
                <AvatarImage src={otherUser.imageUrl || undefined} />
                <AvatarFallback>
                  {otherUser.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-left">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {otherUser.displayName || otherUser.email?.split('@')[0]}
                  </span>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                
                {lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {lastMessage.content}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
} 