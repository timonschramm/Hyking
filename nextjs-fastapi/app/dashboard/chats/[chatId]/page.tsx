'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatWindow from '@/app/components/chat/ChatWindow';
import { ChatRoomWithDetails, RealtimeMessage, Message, MessageMetadata } from '@/types/chat';
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
      const response = await fetch(`/apinextjs/chats/${params.chatId}`);
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
      // console.log('Received new message:', payload);
        const newMessage = payload.payload as RealtimeMessage;
        
        if (newMessage.chatRoomId === params.chatId) {
          setChatRoom(current => {
            if (!current) return null;
            
            // Check if message already exists
            const existingMessageIds = new Set(current.messages.map(m => m.id));
            if (existingMessageIds.has(newMessage.id)) {
              return current;
            }

            // Convert RealtimeMessage to Message format
            const formattedMessage: Message = {
              id: newMessage.id,
              content: newMessage.content,
              createdAt: new Date(newMessage.createdAt),
              chatRoomId: newMessage.chatRoomId,
              senderId: newMessage.senderId,
              isAI: newMessage.isAI,
              metadata: newMessage.metadata as MessageMetadata | null,
              sender: newMessage.sender ? {
                email: newMessage.sender.email,
                imageUrl: newMessage.sender.imageUrl || undefined,
                displayName: newMessage.sender.displayName || undefined
              } : undefined
            };

            // Add new message
            return {
              ...current,
              messages: [...current.messages, formattedMessage],
              lastMessage: new Date(newMessage.createdAt)
            };
          });
        }
      })
      .subscribe((status) => {
      // console.log('Subscription status:', status);
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