'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatWindow from '@/app/components/chat/ChatWindow';
import { ChatRoomWithDetails, RealtimeMessage } from '@/types/chat';
import { useRouter } from 'next/navigation';

export default function SingleChatPage({
  params,
}: {
  params: { chatId: string };
}) {
  const [chatRoom, setChatRoom] = useState<ChatRoomWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchChat();
    const channel = setupRealtimeSubscription();
    return () => {
      channel.unsubscribe();
    };
  }, [params.chatId]);

  const fetchChat = async () => {
    try {
      const response = await fetch(`/api/chats/${params.chatId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat');
      }
      const data = await response.json();
      setChatRoom(data);
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase.channel('messages')
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('Received new message:', payload);
        const newMessage = payload.payload as RealtimeMessage;
        
        if (newMessage.chatRoomId === params.chatId) {
          setChatRoom(current => {
            if (!current) return null;
            
            // Check if message already exists
            const existingMessageIds = new Set(current.messages.map(m => m.id));
            if (existingMessageIds.has(newMessage.id)) {
              return current;
            }

            // Add new message
            return {
              ...current,
              messages: [...current.messages, newMessage],
              lastMessage: newMessage.createdAt
            };
          });
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return channel;
  };

  const handleBack = () => {
    // Check if we came from group matches
    if (document.referrer.includes('/dashboard/groupmatches')) {
      router.push('/dashboard/groupmatches');
    } else {
      router.push('/dashboard/chats');
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  if (!chatRoom) {
    return <div className="flex h-full items-center justify-center">Chat not found</div>;
  }

  return (
    <div className="h-full border rounded-lg overflow-hidden">
      <ChatWindow chatRoom={chatRoom} onBack={handleBack} />
    </div>
  );
} 