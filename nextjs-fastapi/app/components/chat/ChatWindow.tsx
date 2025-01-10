'use client';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { MatchWithDetails, MessageWithSender } from '@/types/chat';
import { createClient } from '@/utils/supabase/client';
import { ChatBubble } from './ChatBubble';
import { cn } from "@/lib/utils";

type ChatWindowProps = {
  match: MatchWithDetails;
  onNewMessage?: (message: MessageWithSender) => void;
  onBack?: () => void;
};

const formatDateGroup = (date: Date) => {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE'); // Monday, Tuesday, etc.
  }
  if (isThisYear(date)) {
    return format(date, 'MMMM d'); // January 15
  }
  return format(date, 'MMMM d, yyyy'); // January 15, 2023
};

const groupMessagesByDate = (messages: MessageWithSender[]) => {
  const groups: { [key: string]: MessageWithSender[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt);
    const groupKey = formatDateGroup(date);
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(message);
  });
  
  return groups;
};

export default function ChatWindow({ match, onNewMessage, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const otherUserMatch = match.users.find(userMatch => userMatch.user);
  const otherUser = otherUserMatch?.user;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (match.chatRoom?.messages) {
      scrollToBottom();
    }
  }, [match.chatRoom?.messages]);

  useEffect(() => {
    if (!match.chatRoom?.id) return;

    const channel = supabase
      .channel(`chat_${match.chatRoom.id}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        if (onNewMessage && payload.message) {
          onNewMessage(payload.message as MessageWithSender);
        }
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.chatRoom?.id, onNewMessage]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const messageContent = message;
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          chatRoomId: match.chatRoom?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const newMessage = await response.json();
      if (onNewMessage) {
        onNewMessage(newMessage);
      }
      scrollToBottom();

    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  if (!otherUser) {
    return <div>Loading chat...</div>;
  }

  const groupedMessages = groupMessagesByDate(match.chatRoom?.messages || []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background">
        <div className="flex items-center space-x-4 p-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.imageUrl || undefined} />
            <AvatarFallback>
              {otherUser.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">
              {otherUser.displayName || otherUser.email?.split('@')[0]}
            </h2>
            {otherUser.location && (
              <p className="text-xs text-muted-foreground truncate">
                {otherUser.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#E4DDD6] p-4">
        <div className="space-y-4">
          {Object.entries(groupedMessages).map(([date, messages]) => (
            <div key={date} className="space-y-2">
              <div className="flex justify-center">
                <div className="bg-white rounded-lg px-3 py-1 text-xs text-neutral-500 shadow-sm">
                  {date}
                </div>
              </div>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  content={msg.content}
                  timestamp={new Date(msg.createdAt)}
                  isOwn={msg.senderId === currentUserId}
                  status="read"
                />
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={sendMessage} className="border-t p-2 bg-background">
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="rounded-full"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={isSending}
            className="rounded-full h-10 w-10 shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
} 