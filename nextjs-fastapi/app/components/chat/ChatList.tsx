import { Prisma } from '@prisma/client';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { MatchWithDetails } from '@/types/chat';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

type ChatListProps = {
  matches: MatchWithDetails[];
  selectedMatch: MatchWithDetails | null;
  onSelectMatch: (match: MatchWithDetails) => void;
  isLoading: boolean;
};

const formatMessageDate = (date: Date) => {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE'); // Monday, Tuesday, etc.
  }
  if (isThisYear(date)) {
    return format(date, 'd MMM'); // 15 Jan
  }
  return format(date, 'd MMM yyyy'); // 15 Jan 2023
};

const groupMatchesByDate = (matches: MatchWithDetails[]) => {
  const groups: { [key: string]: MatchWithDetails[] } = {};
  
  matches.forEach(match => {
    const lastMessage = match.chatRoom?.messages[match.chatRoom.messages.length - 1];
    if (!lastMessage) {
      if (!groups['No messages']) {
        groups['No messages'] = [];
      }
      groups['No messages'].push(match);
      return;
    }

    const date = new Date(lastMessage.createdAt);
    let groupKey: string;

    if (isToday(date)) {
      groupKey = 'Today';
    } else if (isYesterday(date)) {
      groupKey = 'Yesterday';
    } else if (isThisWeek(date)) {
      groupKey = 'This Week';
    } else if (isThisYear(date)) {
      groupKey = format(date, 'MMMM yyyy');
    } else {
      groupKey = format(date, 'yyyy');
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(match);
  });

  // Sort matches within each group by last message date
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => {
      const dateA = a.chatRoom?.messages[a.chatRoom.messages.length - 1]?.createdAt || '';
      const dateB = b.chatRoom?.messages[b.chatRoom.messages.length - 1]?.createdAt || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  });

  return groups;
};

const ChatListItem = ({ 
  match, 
  isSelected, 
  currentUserId, 
  onClick 
}: { 
  match: MatchWithDetails; 
  isSelected: boolean; 
  currentUserId: string | null;
  onClick: () => void;
}) => {
  const otherUserMatch = match.users.find(u => u.userId !== currentUserId);
  const otherUser = otherUserMatch?.user;
  const lastMessage = match.chatRoom?.messages[match.chatRoom.messages.length - 1];

  if (!otherUser) return null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-md px-3 py-3 hover:bg-neutral-50 active:bg-neutral-100",
        isSelected && "bg-brand-100 hover:bg-brand-100 active:bg-brand-50"
      )}
    >
      <div className="relative h-12 w-12 flex-shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-full">
          {otherUser.imageUrl ? (
            <img
              src={otherUser.imageUrl}
              alt={otherUser.displayName || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-200 text-neutral-600">
              {otherUser.email?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="flex grow flex-col items-start min-w-0">
        <div className="flex w-full items-center gap-2 justify-between">
          <span className="text-sm font-semibold text-neutral-900 truncate">
            {otherUser.displayName || otherUser.email?.split('@')[0]}
          </span>
          {lastMessage && (
            <span className="text-xs text-neutral-500 whitespace-nowrap">
              {formatMessageDate(new Date(lastMessage.createdAt))}
            </span>
          )}
        </div>
        
        {lastMessage && (
          <div className="flex w-full items-center gap-2">
            <span className="text-sm text-neutral-500 truncate">
              {lastMessage.content}
            </span>
          </div>
        )}
      </div>
    </div>
  );
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
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-md bg-neutral-50 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-neutral-200" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-neutral-200 rounded" />
              <div className="h-3 w-32 bg-neutral-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const groupedMatches = groupMatchesByDate(matches);

  return (
    <div className="h-full border-r border-neutral-200">
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex flex-col gap-1">
          {Object.entries(groupedMatches).map(([date, dateMatches]) => (
            <div key={date} className="flex flex-col">
              <div className="sticky top-0 bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-500">
                {date}
              </div>
              <div className="p-2">
                {dateMatches.map((match) => (
                  <ChatListItem
                    key={match.id}
                    match={match}
                    isSelected={selectedMatch?.id === match.id}
                    currentUserId={currentUserId}
                    onClick={() => onSelectMatch(match)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 