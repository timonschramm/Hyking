'use client';
import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MatchWithDetails, MessageWithSender } from '@/types/chat';
import { createClient } from '@/utils/supabase/client';

type ChatWindowProps = {
  match: MatchWithDetails;
  onNewMessage?: (message: MessageWithSender) => void;
};

export default function ChatWindow({ match, onNewMessage }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const otherUserMatch = match.users.find(userMatch => userMatch.user);
  const otherUser = otherUserMatch?.user;
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (match.chatRoom?.messages) {
      scrollToBottom();
    }
  }, [match.chatRoom?.messages]);

  // Listen for real-time messages
  useEffect(() => {
    if (!match.chatRoom?.id) return;

    const channel = supabase
      .channel(`chat_${match.chatRoom.id}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        // Handle new message
        if (onNewMessage && payload.message) {
          onNewMessage(payload.message as MessageWithSender);
        }
        // Scroll to bottom when receiving new message
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
    setMessage(''); // Clear input immediately

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
      // Scroll to bottom after sending
      scrollToBottom();

    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageContent); // Restore message if failed
    } finally {
      setIsSending(false);
    }
  };

  if (!otherUser) {
    return <div>Loading chat...</div>;
  }

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

      <div className="flex-1 overflow-y-auto p-4">
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
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Scroll anchor */}
        </div>
      </div>

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