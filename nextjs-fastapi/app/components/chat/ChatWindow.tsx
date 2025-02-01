import { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { Send, ChevronLeft, Users, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { ChatWindowProps, HikeData } from '@/types/chat';
import { ChatBubble } from './ChatBubble';
import { cn } from '@/lib/utils';
import HikeCard from '@/app/components/HikeCard';
import WeatherWidget from '@/app/components/WeatherWidget';
import Modal from '@/app/components/Modal';
import { Hike } from '@/app/components/chatBot/types';

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

export default function ChatWindow({ chatRoom: initialChatRoom, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false); // Typing indicator for chatbot
  const [selectedHike, setSelectedHike] = useState<HikeData | null>(null); // Selected hike for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [chatRoom, setChatRoom] = useState(initialChatRoom); // Local state for chatRoom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Default sender object for the chatbot
  const hykingAISender = {
    id: 'hykingAI',
    age: null,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Magic_Wand_Icon_229981_Color_Flipped.svg/1024px-Magic_Wand_Icon_229981_Color_Flipped.svg.png', // Add a default avatar for the bot
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

  // Add useEffect for Supabase realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const newMessage = payload.payload;
        
        // Only update if the message belongs to this chat room
        if (newMessage.chatRoomId === chatRoom.id) {
          // Ensure createdAt is a Date object
          if (typeof newMessage.createdAt === 'string') {
            newMessage.createdAt = new Date(newMessage.createdAt);
          }

          setChatRoom(prevChatRoom => ({
            ...prevChatRoom,
            messages: [...prevChatRoom.messages, newMessage]
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoom.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUserId) return;

    const isAIMessage = message.trim().toLowerCase().startsWith('hey hykingai');
    
    try {
      // Send user message
      const response = await fetch('/apinextjs/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          chatRoomId: chatRoom.id,
          isAI: false,
          metadata: null
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      setMessage('');

      // Handle AI response if needed
      if (isAIMessage) {
        setIsTyping(true);
        try {
          const aiResponse = await fetch(`/api/py/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, user_input: message.trim() }),
          });

          if (!aiResponse.ok) throw new Error('Failed to get AI response');
          const data = await aiResponse.json();
          console.log('AI Response:', data); // Debug log

          // Send AI message with metadata
          const aiMessageResponse = await fetch('/apinextjs/chats/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: data.response || 'Here are some hikes you might like:',
              chatRoomId: chatRoom.id,
              isAI: true,
              metadata: {
                hikes: data.hikes || [],
                weather: data.weather || null
              }
            }),
          });

          if (!aiMessageResponse.ok) {
            throw new Error('Failed to send AI message');
          }

          const aiMessageData = await aiMessageResponse.json();
          console.log('AI Message saved:', aiMessageData); // Debug log
        } catch (error) {
          console.error('AI Error:', error);
          await fetch('/apinextjs/chats/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: 'Sorry, I encountered an error. Please try again.',
              chatRoomId: chatRoom.id,
              isAI: true,
              metadata: null
            }),
          });
        } finally {
          setIsTyping(false);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle hike card clicks
  const handleHikeClick = (hike: HikeData) => {
    setSelectedHike(hike);
    setIsModalOpen(true);
  };

  // Handle changing the group's hike
  const handleChangeHike = async (hikeId: string) => {
    if (!chatRoom.groupMatch?.id) return;
    
    try {
      const response = await fetch(`/apinextjs/groupmatches/${chatRoom.groupMatch.id}/change-hike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hikeId }),
      });

      if (!response.ok) throw new Error('Failed to change hike');

      const updatedGroupMatch = await response.json();

      // Update the chatRoom state with the new hike
      setChatRoom((prevChatRoom) => ({
        ...prevChatRoom,
        groupMatch: {
          ...prevChatRoom.groupMatch!,
          hikeSuggestions: updatedGroupMatch.hikeSuggestions,
        },
      }));

      setIsModalOpen(false);
      alert('Hike changed successfully!');
    } catch (error) {
      console.error('Error changing hike:', error);
      alert('Failed to change hike. Please try again.');
    }
  };

  // Handle example prompt clicks
  const handleExamplePromptClick = (prompt: string) => {
    setMessage("Hey HykingAI " + prompt); // Set the prompt as the message
  };

  // Get chat title and image
  let chatTitle = '';
  let chatImage = '';
  let memberCount = 0;

  if (chatRoom.groupMatch) {
    const activity = chatRoom.groupMatch.hikeSuggestions[0];
    chatTitle = activity.title;
    chatImage = `https://img.oastatic.com/img2/${activity.primaryImageId}/default/variant.jpg`;
    memberCount = chatRoom.groupMatch.profiles?.length || 0; // Add a fallback for undefined profiles
  } else if (chatRoom.match) {
    const otherUser = chatRoom.match.users[0]?.user;
    if (otherUser) {
      chatTitle = otherUser.email.split('@')[0];
      chatImage = otherUser.imageUrl || '/default-avatar.jpg';
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 border-b p-4 bg-white shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={onBack}
            className="rounded-full p-2 hover:bg-gray-100 flex items-center justify-center"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image
              src={chatImage || '/default-avatar.jpg'}
              alt={chatTitle}
              fill
              className="object-cover"
              onError={(e: any) => {
                e.target.src = '/default-avatar.jpg'
              }}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{chatTitle}</h2>
            {chatRoom.groupMatch && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{memberCount} members</span>
              </div>
            )}
          </div>
          {chatRoom.groupMatch && (
            <button
              onClick={() => window.open(`https://www.outdooractive.com/en/route/${chatRoom.groupMatch?.hikeSuggestions[0].id}`, '_blank')}
              className="ml-auto sm:ml-0 flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View on OutdoorActive</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-neutral-50 p-4">
        <div className="space-y-4 pb-[120px]">
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

                {/* Render metadata content if exists */}
                {msg.metadata && (
                  <>
                    {msg.metadata.hikes && msg.metadata.hikes.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.metadata.hikes.map((hike) => (
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
                    {msg.metadata.weather && (
                      <WeatherWidget weather={msg.metadata.weather} />
                    )}
                  </>
                )}
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
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:relative p-4 bg-white border-t shadow-lg sm:shadow-none">
        <div className="mb-4 max-h-[60px] overflow-y-auto">
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

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-white">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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

      {/* Modal for hike details */}
      {isModalOpen && selectedHike && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <HikeCard hike={selectedHike} detailed />
          {chatRoom.groupMatch && (
            <button
              onClick={() => handleChangeHike(selectedHike.id)}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Change to This Hike
            </button>
          )}
        </Modal>
      )}
    </div>
  );
}