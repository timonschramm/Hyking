'use client';
import { useRef, useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Hike } from '../../components/chatBot/types';
import HikeCard from '../../components/HikeCard';
import WeatherWidget from '../../components/WeatherWidget'; // Import the new WeatherWidget
import Modal from '../../components/Modal';

// Utility function to get or create a unique user ID
const getUserId = () => {
  return `user_${Date.now()}`; // Generates a new ID every time
};

// Update the Message type to include weather data
type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  hikes?: Hike[];
  weather?: {
    name: string;
    weather: { description: string }[];
    main: { temp: number };
  }; // Add weather data type
};

export default function HykingAIPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'hykingAI',
      text: 'Hi! How can I assist you today?',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [message, setMessage] = useState('');
  const [allHikes, setAllHikes] = useState<Hike[]>([]);
  const [selectedHike, setSelectedHike] = useState<Hike | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // Typing indicator
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newUserId = getUserId();
    setUserId(newUserId);

    const fetchHikes = async () => {
      try {
        const response = await fetch('/apinextjs/hikes');
        const data = await response.json();
        setAllHikes(data);
      } catch (error) {
        console.error('Error fetching hikes:', error);
      }
    };

    fetchHikes();
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the chat when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !userId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      text: message.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      const response = await fetch(`/apinextjs/py/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_input: message.trim() }),
      });

      if (!response.ok) throw new Error('Failed to fetch response from backend');

      const data = await response.json();
      const hikes = data.hikes || [];
      const weather = data.weather || null; // Extract weather data from the response

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'hykingAI',
        text: data.response || 'Here are some hikes you might like:',
        createdAt: new Date().toISOString(),
        hikes: hikes,
        weather: weather, // Include weather data in the message
      };
      setTimeout(() => {
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1000); // Simulate typing delay
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          senderId: 'hykingAI',
          text: 'Something went wrong. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
    }
  };

  const handleHikeClick = (hike: Hike) => {
    setSelectedHike(hike);
    setIsModalOpen(true);
  };

 const handleCreateGroup = async (hikeId: string) => {
  try {
    const response = await fetch('/apinextjs/groupmatches/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hikeId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create group: ${response.statusText}`);
    }

    const newGroupMatch = await response.json();

    // Ensure the response contains the chatRoomId
    if (!newGroupMatch.chatRoomId) {
      throw new Error('Chat room ID not found in the response');
    }

    // Redirect to the new group match chat
    console.log('New Group Match:', newGroupMatch);
if (!newGroupMatch.chatRoomId) {
  throw new Error('Chat room ID not found in the response');
}

setTimeout(() => {
  window.location.href = `/dashboard/chats/${newGroupMatch.chatRoomId}`;
}, 500); // Small delay for database sync


  } catch (error) {
    console.error('Error creating group:', error);
    alert('Failed to create group. Please try again.');
  }
};

  const closeModal = () => {
    setSelectedHike(null);
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <div className="p-4 border-b bg-white shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">Hyking AI</h1>
        <p className="text-sm text-gray-500">Your personal hiking assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] p-3 rounded-lg text-sm shadow-md ${
                msg.senderId === 'user' ? 'bg-green-600 text-white' : 'bg-white text-gray-800'
              } transition-transform transform hover:scale-105`}
            >
              {msg.text}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {msg.hikes && msg.hikes.length > 0 && (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {msg.hikes.map((hike) => (
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
              {msg.weather && <WeatherWidget weather={msg.weather} />} {/* Render weather widget */}
            </div>
          </div>
        ))}
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

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            aria-label="Type your message"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>

      {/* Modal for hike details */}
      {isModalOpen && selectedHike && (
        <Modal onClose={closeModal}>
          <HikeCard hike={selectedHike} detailed />
          <button
            onClick={() => handleCreateGroup(selectedHike.id)}
            className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create New Group for This Hike
          </button>
        </Modal>
      )}
    </div>
  );
}