'use client';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { Send, ChevronLeft, Users } from 'lucide-react';
import Image from 'next/image';
import { ChatWindowProps } from '@/types/chat';
import { ChatBubble } from './ChatBubble';
import { cn } from '@/lib/utils';

export default function ChatWindow({ chatRoom, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatRoom.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUserId) return;

    try {
      const response = await fetch('/api/chats/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          chatRoomId: chatRoom.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      // Clear the message input after successful send
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Get chat title and image
  let chatTitle = '';
  let chatImage = '';
  let memberCount = 0;

  if (chatRoom.groupMatch) {
    const activity = chatRoom.groupMatch.hikeSuggestions[0];
    chatTitle = activity.title;
    chatImage = `https://img.oastatic.com/img2/${activity.primaryImageId}/default/variant.jpg`;
    memberCount = chatRoom.groupMatch.profiles.length;
  } else if (chatRoom.match) {
    const otherUser = chatRoom.match.users[0]?.user;
    if (otherUser) {
      chatTitle = otherUser.email.split('@')[0];
      chatImage = otherUser.imageUrl || '/default-avatar.png';
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b p-3">
        <button onClick={onBack} className="md:hidden">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image
            src={chatImage}
            alt={chatTitle}
            fill
            className={`object-cover ${chatRoom.groupMatch ? 'rounded-lg' : 'rounded-full'}`}
          />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{chatTitle}</h2>
          {chatRoom.groupMatch && (
            <div className="flex items-center gap-1 text-sm text-neutral-500">
              <Users className="h-4 w-4" />
              <span>{memberCount} members</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50">
        <div className="space-y-4">
          {chatRoom.messages.map((msg) => {
            const isSender = msg.senderId === currentUserId;
            const senderProfile = chatRoom.participants.find(p => p.profileId === msg.senderId)?.profile;
            
            return (
              <div key={msg.id}>
                <ChatBubble
                  content={msg.content}
                  timestamp={new Date(msg.createdAt)}
                  isOwn={isSender}
                  status="sent"
                  isGroupChat={!!chatRoom.groupMatch}
                  senderProfile={senderProfile}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border bg-neutral-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 