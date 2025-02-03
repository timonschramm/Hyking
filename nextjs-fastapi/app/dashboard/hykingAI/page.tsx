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
  const [isTyping, setIsTyping] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true); // Add state for showing prompts
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add example prompts
  const examplePrompts = [
    "How's the weather in Munich?",
    "Recommend me a hike with waterfalls.",
    "Give me some tips for my next hike.",
  ];

  // Add handler for example prompt clicks
  const handleExamplePromptClick = (prompt: string) => {
    setMessage("Hey HykingAI " + prompt);
  };

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
      const response = await fetch(`/api/py/chat`, {
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
              <div className="whitespace-pre-wrap break-words">
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className="mb-1 last:mb-0">
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        // Remove the ** markers and wrap in bold
                        return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={j}>{part}</span>;
                    })}
                  </p>
                ))}
              </div>
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
              {msg.weather && <WeatherWidget weather={msg.weather} />}
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

      {/* Add the chatbot prompt and example bubbles */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:relative p-4 bg-white border-t shadow-lg sm:shadow-none">
        {showPrompts && (
          <div className="mb-4 relative">
            <button 
              onClick={() => setShowPrompts(false)}
              className="absolute right-0 top-0 text-gray-500 hover:text-gray-700 p-1"
              aria-label="Close prompts"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <p className="text-sm text-gray-600 text-center">
              Ask our chatbot by typing{" "}
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
        )}
        {!showPrompts && (
          <button
            onClick={() => setShowPrompts(true)}
            className="mb-4 text-sm text-green-600 hover:text-green-700 flex items-center justify-center w-full"
          >
            <span>Show example prompts</span>
          </button>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-white">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border !bg-white px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-500"
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