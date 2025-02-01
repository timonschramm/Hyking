import { format } from 'date-fns';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { ChatListProps } from '@/types/chat';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { isToday, isYesterday, isThisWeek } from 'date-fns';

function formatMessageDate(date: Date | string) {
  const messageDate = new Date(date);
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  }
  if (isYesterday(messageDate)) {
    return 'Yesterday';
  }
  if (isThisWeek(messageDate)) {
    return format(messageDate, 'EEEE'); // Monday, Tuesday, etc.
  }
  return format(messageDate, 'dd/MM/yyyy');
}

function ChatListItem({ chat, isSelected, currentUserId, onClick }: {
  chat: ChatListProps['chatRooms'][0],
  isSelected: boolean,
  currentUserId: string | null,
  onClick: () => void
}) {
  const lastMessage = chat.messages[chat.messages.length - 1];
  const messagePreview = lastMessage ? `${lastMessage.sender?.email?.split('@')[0] ?? 'Unknown'}: ${lastMessage.content}` : 'No messages yet';
  const messageTime = lastMessage ? formatMessageDate(lastMessage.createdAt) : '';

  // For group chats
  if (chat.groupMatch) {
    const activity = chat.groupMatch.hikeSuggestions[0];
    const acceptedCount = chat.groupMatch.profiles.filter(p => p.hasAccepted).length;
    const totalCount = chat.groupMatch.profiles.length;

    return (
      <button
        onClick={onClick}
        className={`w-full p-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors ${
          isSelected ? 'bg-neutral-100' : ''
        }`}
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={`https://img.oastatic.com/img2/${activity.primaryImageId}/default/variant.jpg`}
            alt={activity.title}
            fill
            sizes="(max-width: 768px) 3rem, 3rem"
            className="object-cover"
          />
          {/* <div className="absolute top-0 right-0 bg-black/50 text-white text-xs px-1 rounded-bl">
            <Users className="w-3 h-3 inline-block mr-1" />
            {acceptedCount}/{totalCount}
          </div> */}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-medium truncate">{activity.title}</h3>
            {messageTime && (
              <span className="text-xs text-neutral-500 flex-shrink-0">
                {messageTime}
              </span>
            )}
          </div>
          <p className="text-left text-sm text-neutral-500 truncate">
            {messagePreview}
          </p>
        </div>
      </button>
    );
  }

  // For single chats
  if (chat.match) {
    const otherUser = chat.match.users[0]?.user;
    if (!otherUser) return null;

    return (
      <button
        onClick={onClick}
        className={`w-full p-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors ${
          isSelected ? 'bg-neutral-100' : ''
        }`}
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={otherUser.imageUrl || '/default-avatar.jpg'}
            alt="user picture"
            fill
            sizes="(max-width: 768px) 3rem, 3rem"
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-medium truncate">{otherUser.email.split('@')[0]}</h3>
            {messageTime && (
              <span className="text-xs text-neutral-500 flex-shrink-0">
                {messageTime}
              </span>
            )}
          </div>
          <p className=" text-left text-sm text-neutral-500 truncate">
            {messagePreview}
          </p>
        </div>
      </button>
    );
  }

  return null;
}

export default function ChatList({ chatRooms, selectedChat, onSelectChat, isLoading }: ChatListProps) {
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

  // Sort chats by last message date
  const sortedChats = [...chatRooms].sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime();
  });

  return (
    <div className="h-full border-r border-neutral-200">
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex flex-col">
          {sortedChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChat?.id === chat.id}
              currentUserId={currentUserId}
              onClick={() => onSelectChat(chat)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 