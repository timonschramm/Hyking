'use client';
import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MatchWithDetails } from '@/types/chat';
import { createClient } from '@/utils/supabase/client';

type ChatWindowProps = {
  match: MatchWithDetails;
};

export default function ChatWindow({ match }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const otherUser = match.users[0];
  const supabase = createClient();

  useEffect(() => {
    scrollToBottom();
  }, [match.chatRoom?.messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const messageContent = message;
    const timestamp = new Date();
    setMessage(''); // Clear input immediately

    try {
      // Get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Optimistically add message locally
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        createdAt: timestamp,
        senderId: user.id,
        chatRoomId: match.chatRoom?.id as string,
      };

      // Update UI immediately
      if (match.chatRoom) {
        match.chatRoom.messages = [...match.chatRoom.messages, optimisticMessage];
      }

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
      console.log('Message sent successfully:', newMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageContent); // Restore message if failed
      
      // Remove optimistic message on error
      if (match.chatRoom) {
        match.chatRoom.messages = match.chatRoom.messages.filter(
          msg => msg.id !== `temp-${Date.now()}`
        );
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={otherUser.imageUrl || undefined} />
            <AvatarFallback>
              {otherUser.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">
              {otherUser.displayName || otherUser.email?.split('@')[0]}
            </h2>
            {otherUser.location && (
              <p className="text-sm text-muted-foreground">
                {otherUser.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {match.chatRoom?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === otherUser.id ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[70%] ${
                  msg.senderId === otherUser.id
                    ? 'bg-secondary text-foreground'
                    : 'bg-primary/10 text-foreground'
                }`}
              >
                <p>{msg.content}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(msg
                    .createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
} 