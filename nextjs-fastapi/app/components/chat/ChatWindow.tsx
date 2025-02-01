'use client';
import { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { Send, ChevronLeft, Users } from 'lucide-react';
import Image from 'next/image';
import { ChatWindowProps } from '@/types/chat';
import { ChatBubble } from './ChatBubble';
import { cn } from '@/lib/utils';
import HikeCard from '@/app/components/HikeCard'; // Import HikeCard
import WeatherWidget from '@/app/components/WeatherWidget'; // Import WeatherWidget

function formatMessageDate(date: Date | string) {
  const messageDate = new Date(date);
  if (isToday(messageDate)) {
    return 'Today';
  }
  if (isYesterday(messageDate)) {
    return 'Yesterday';
  }
  if (isThisWeek(messageDate)) {
    return format(messageDate, 'EEEE'); // Monday, Tuesday, etc.
  }
  return format(messageDate, 'MMMM d, yyyy');
}

function shouldShowDateSeparator(currentMsg: any, prevMsg: any) {
  if (!prevMsg) return true; // Always show for first message

  const currentDate = new Date(currentMsg.createdAt);
  const prevDate = new Date(prevMsg.createdAt);

  return (
    currentDate.getDate() !== prevDate.getDate() ||
    currentDate.getMonth() !== prevDate.getMonth() ||
    currentDate.getFullYear() !== prevDate.getFullYear()
  );
}

export default function ChatWindow({ chatRoom, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false); // Typing indicator for chatbot
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Default sender object for the chatbot
  const hykingAISender = {
    id: 'hykingAI',
    age: null,
    imageUrl: '/path/to/bot/avatar.jpg', // Add a default avatar for the bot
    gender: null,
    location: null,
    dogFriendly: null,
    spotifyConnected: false,
    email: 'hykingAI@example.com',
    displayName: 'Hyking AI',
    onboardingCompleted: true, // Add missing properties
    spotifyAccessToken: null,
    spotifyTokenExpiry: null,
    spotifyRefreshToken: null,
    bio: null,
  };

  // Example prompts for the chatbot
  const examplePrompts = [
    "How's the weather in Munich?",
    "Recommend me a hike with waterfalls.",
    "Give me some tips for my next hike.",
  ];

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

    // Create a user message with the sender property
    const userMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: message.trim(),
      createdAt: new Date(), // Use Date object instead of string
      chatRoomId: chatRoom.id, // Add chatRoomId
      sender: {
        id: currentUserId,
        age: null, // Add actual user data if available
        imageUrl: '/path/to/user/avatar.jpg', // Add actual user data if available
        gender: null,
        location: null,
        dogFriendly: null,
        spotifyConnected: false,
        email: 'user@example.com', // Add actual user data if available
        displayName: 'User', // Add actual user data if available
        onboardingCompleted: true, // Add missing properties
        spotifyAccessToken: null,
        spotifyTokenExpiry: null,
        spotifyRefreshToken: null,
        bio: null,
      },
    };

    // Add user message to the chat
    const updatedMessages = [...chatRoom.messages, userMessage];
    chatRoom.messages = updatedMessages; // Update the chatRoom object directly
    setMessage('');

    if (message.trim().toLowerCase().startsWith('hey hykingai')) {
      setIsTyping(true);

      try {
        const response = await fetch(`/api/py/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUserId, user_input: message.trim() }),
        });

        if (!response.ok) throw new Error('Failed to fetch response from backend');

        const data = await response.json();
        const hikes = data.hikes || [];
        const weather = data.weather || null;

        // Transform the chatbot response into the chat system's format
        const botResponse = {
          id: (Date.now() + 1).toString(),
          senderId: 'hykingAI',
          content: data.response || 'Here are some hikes you might like:',
          createdAt: new Date(), // Use Date object instead of string
          chatRoomId: chatRoom.id, // Add chatRoomId
          sender: hykingAISender, // Use the default sender for the bot
          hikes: hikes,
          weather: weather,
        };

        setTimeout(() => {
          chatRoom.messages = [...updatedMessages, botResponse]; // Add bot response to the chat
          setIsTyping(false);
        }, 1000); // Simulate typing delay
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = {
          id: (Date.now() + 2).toString(),
          senderId: 'hykingAI',
          content: 'Something went wrong. Please try again.',
          createdAt: new Date(), // Use Date object instead of string
          chatRoomId: chatRoom.id, // Add chatRoomId
          sender: hykingAISender, // Use the default sender for the bot
        };
        chatRoom.messages = [...updatedMessages, errorMessage]; // Add error message to the chat
        setIsTyping(false);
      }
    } else {
      // Handle normal chat message
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
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  // Handle hike card clicks
  const handleHikeClick = (hike: any) => {
    console.log('Hike clicked:', hike);
    // Add logic to handle hike clicks (e.g., open a modal)
  };

  // Handle example prompt clicks
  const handleExamplePromptClick = (prompt: string) => {
    setMessage("Hey HykingAI "+prompt); // Set the prompt as the message
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
      chatImage = otherUser.imageUrl || '/default-avatar.jpg';
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
            sizes="(max-width: 768px) 2.5rem, 2.5rem"
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
          {chatRoom.messages.map((msg, index) => {
            const isSender = msg.senderId === currentUserId;
            const senderProfile = msg.sender ? {
              imageUrl: msg.sender.imageUrl || '/default-avatar.jpg',
              email: msg.sender.email
            } : null;
            const prevMsg = index > 0 ? chatRoom.messages[index - 1] : null;
            const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);

            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-neutral-200 text-neutral-600 text-xs px-3 py-1 rounded-full">
                      {formatMessageDate(msg.createdAt)}
                    </div>
                  </div>
                )}

                <ChatBubble
                  content={msg.content}
                  timestamp={new Date(msg.createdAt)}
                  isOwn={isSender}
                  status="sent"
                  isGroupChat={!!chatRoom.groupMatch}
                  senderProfile={senderProfile}
                />

                {/* Render hikes if they exist */}
                {(msg as any).hikes && (msg as any).hikes.length > 0 && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(msg as any).hikes.map((hike: any) => (
                      <div
                        key={hike.id}
                        className="cursor-pointer"
                        onClick={() => handleHikeClick(hike)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details of ${hike.title}`}
                      >
                        <HikeCard hike={hike} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Render weather if it exists */}
                {(msg as any).weather && <WeatherWidget weather={(msg as any).weather} />}
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[75%] p-3 rounded-lg bg-white text-gray-800 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chatbot prompt and example bubbles */}
      <div className="p-4 bg-white border-t">
        <div className="mb-4">
          <p className="text-sm text-gray-600 text-center">
            Ask our chatbot anything in this chat by typing{" "}
            <span className="font-semibold text-green-600">"Hey HykingAI"</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleExamplePromptClick(prompt)}
                className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-full hover:bg-green-100 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border bg-primary-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}