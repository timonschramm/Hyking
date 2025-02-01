'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatList from '@/app/components/chat/ChatList';
import ChatWindow from '@/app/components/chat/ChatWindow';
import { ChatRoomWithDetails, RealtimeMessage } from '@/types/chat';

export default function ChatsPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoomWithDetails[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoomWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchChats();
    setupRealtimeSubscription();
  }, []);

  const fetchChats = async () => {
  try {
    const response = await fetch('/api/chats');
    const data = await response.json();

    // Parse createdAt strings into Date objects
    const updatedChatRooms = data.map((room: ChatRoomWithDetails) => ({
      ...room,
      messages: room.messages.map((msg) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      })),
      lastMessage: room.lastMessage ? new Date(room.lastMessage) : new Date(), // Fallback to current date if null
    }));

    setChatRooms(updatedChatRooms);
    setIsLoading(false);
  } catch (error) {
    console.error('Error fetching chats:', error);
    setIsLoading(false);
  }
};

  const setupRealtimeSubscription = () => {
  const channel = supabase
    .channel('messages')
    .on('broadcast', { event: 'new_message' }, (payload) => {
      const newMessage = payload.payload as RealtimeMessage;

      // Ensure createdAt is a Date object
      if (typeof newMessage.createdAt === 'string') {
        newMessage.createdAt = new Date(newMessage.createdAt);
      }

      setChatRooms(currentRooms =>
        currentRooms.map(room => {
          if (room.id === newMessage.chatRoomId) {
            const existingMessageIds = new Set(room.messages.map(m => m.id));
            if (existingMessageIds.has(newMessage.id)) {
              return room;
            }

            return {
              ...room,
              messages: [...room.messages, newMessage],
              lastMessage: newMessage.createdAt || new Date(), // Fallback to current date if null
            };
          }
          return room;
        })
      );

      setSelectedChat(current => {
        if (current?.id === newMessage.chatRoomId) {
          const existingMessageIds = new Set(current.messages.map(m => m.id));
          if (existingMessageIds.has(newMessage.id)) {
            return current;
          }

          return {
            ...current,
            messages: [...current.messages, newMessage],
            lastMessage: newMessage.createdAt || new Date(), // Fallback to current date if null
          };
        }
        return current;
      });
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
};

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
      <div className={`border rounded-lg overflow-hidden ${selectedChat ? 'hidden md:block' : 'block'}`}>
        {chatRooms.length === 0 && !isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">
              You need some matches to start chatting
            </p>
          </div>
        ) : (
          <ChatList
            chatRooms={chatRooms}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
            isLoading={isLoading}
          />
        )}
      </div>

      <div className={`border rounded-lg overflow-hidden ${selectedChat ? 'block' : 'hidden md:block'}`}>
        {selectedChat ? (
          <ChatWindow
            chatRoom={selectedChat}
            onBack={() => setSelectedChat(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {chatRooms.length === 0 && !isLoading
              ? "You need some matches to start chatting"
              : "Select a conversation to start chatting"}
          </div>
        )}
      </div>
    </div>
  );
}