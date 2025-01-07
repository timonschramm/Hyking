'use client';
import { useEffect, useState } from 'react';
import { Prisma } from '@prisma/client';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from '@/utils/supabase/client';
import ChatList from '@/app/components/chat/ChatList';
import ChatWindow from '@/app/components/chat/ChatWindow';
import { MatchWithDetails, RealtimeMessage } from '@/types/chat';

export default function ChatsPage() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchMatches();
    setupRealtimeSubscription();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches');
      const data = await response.json();
      setMatches(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('Setting up realtime subscription...');
    
    const channel = supabase
      .channel('messages')
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('Received realtime message:', payload);
        const newMessage = payload.payload as RealtimeMessage;
        
        setMatches(currentMatches => 
          currentMatches.map(match => {
            if (match.chatRoom?.id === newMessage.chatRoomId) {
              const existingMessageIds = new Set(match.chatRoom.messages.map(m => m.id));
              if (existingMessageIds.has(newMessage.id) || existingMessageIds.has(`temp-${newMessage.id}`)) {
                return match;
              }

              return {
                ...match,
                chatRoom: {
                  ...match.chatRoom,
                  messages: [...match.chatRoom.messages, newMessage]
                }
              } satisfies MatchWithDetails;
            }
            return match;
          })
        );

        setSelectedMatch(current => {
          if (current?.chatRoom?.id === newMessage.chatRoomId) {
            const existingMessageIds = new Set(current.chatRoom.messages.map(m => m.id));
            if (existingMessageIds.has(newMessage.id) || existingMessageIds.has(`temp-${newMessage.id}`)) {
              return current;
            }

            return {
              ...current,
              chatRoom: {
                ...current.chatRoom,
                messages: [...current.chatRoom.messages, newMessage]
              }
            } satisfies MatchWithDetails;
          }
          return current;
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  return (
    <div className="container mx-auto h-[calc(100vh-5rem)] p-4">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
        <div className="border rounded-lg overflow-hidden">
          <ChatList
            matches={matches}
            selectedMatch={selectedMatch}
            onSelectMatch={setSelectedMatch}
            isLoading={isLoading}
          />
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          {selectedMatch ? (
            <ChatWindow match={selectedMatch} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 