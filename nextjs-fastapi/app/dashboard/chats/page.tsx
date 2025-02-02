'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatList from '@/app/components/chat/ChatList';
import ChatWindow from '@/app/components/chat/ChatWindow';
import { ChatRoomWithDetails, RealtimeMessage, Message, MessageMetadata } from '@/types/chat';

// Create a custom event for chat window state
const CHAT_WINDOW_STATE_EVENT = 'chatWindowStateChange';

export default function ChatsPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoomWithDetails[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoomWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Function to notify parent layout about chat window state
  const notifyLayoutAboutChatWindow = (isOpen: boolean) => {
    const event = new CustomEvent(CHAT_WINDOW_STATE_EVENT, { detail: { isOpen } });
    window.dispatchEvent(event);
  };

  // Update layout when chat selection changes
  useEffect(() => {
    notifyLayoutAboutChatWindow(!!selectedChat);
    return () => notifyLayoutAboutChatWindow(false);
  }, [selectedChat]);

  useEffect(() => {
    fetchChats();
    setupRealtimeSubscription();
  }, []);

  const fetchChats = async () => {
  try {
    const response = await fetch('/apinextjs/chats');
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

      setChatRooms(currentRooms =>
        currentRooms.map(room => {
          if (room.id === formattedMessage.chatRoomId) {
            const existingMessageIds = new Set(room.messages.map(m => m.id));
            if (existingMessageIds.has(formattedMessage.id)) {
              return room;
            }

            return {
              ...room,
              messages: [...room.messages, formattedMessage],
              lastMessage: formattedMessage.createdAt
            };
          }
          return room;
        })
      );

      setSelectedChat(current => {
        if (current?.id === formattedMessage.chatRoomId) {
          const existingMessageIds = new Set(current.messages.map(m => m.id));
          if (existingMessageIds.has(formattedMessage.id)) {
            return current;
          }

          return {
            ...current,
            messages: [...current.messages, formattedMessage],
            lastMessage: formattedMessage.createdAt
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
      {/* Chat List - Always visible on desktop, hidden on mobile when chat is selected */}
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
            onSelectChat={(chat) => {
              console.log('Selecting chat:', chat.id); // Debug log
              setSelectedChat(chat);
            }}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Chat Window - Hidden on mobile when no chat is selected */}
      <div className={`border rounded-lg overflow-hidden ${selectedChat ? 'block' : 'hidden md:block'}`}>
        {selectedChat ? (
          <ChatWindow
            key={selectedChat.id} // Add key to force re-render
            chatRoom={selectedChat}
            onBack={() => {
              console.log('Back button clicked'); // Debug log
              setSelectedChat(null);
            }}
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