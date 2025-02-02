import { Prisma } from '@prisma/client'
import { Hike } from '@/app/components/chatBot/types'

// Define Prisma select types
export const messageWithSender = {
  id: true,
  content: true,
  createdAt: true,
  chatRoomId: true,
  senderId: true,
  isAI: true,
  metadata: true,
  sender: {
    select: {
      imageUrl: true,
      email: true,
      displayName: true,
    }
  }
} as const;

export type MessageWithSender = Prisma.MessageGetPayload<{
  select: typeof messageWithSender
}>

export interface RealtimeMessage extends MessageWithSender {
  chatRoomId: string
}

export interface ChatListProps {
  chatRooms: ChatRoomWithDetails[]
  selectedChat: ChatRoomWithDetails | null
  onSelectChat: (chat: ChatRoomWithDetails) => void
  isLoading: boolean
}

export interface ChatWindowProps {
  chatRoom: ChatRoomWithDetails
  onBack: () => void
}

// Define the metadata types
export interface WeatherData {
  name: string;
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
}

// Extend the Hike type for our needs
export interface HikeData extends Hike {
  primaryRegion?: string;
  category?: {
    name: string;
  };
}

export interface MessageMetadata {
  hikes?: HikeData[];
  weather?: WeatherData;
}

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  chatRoomId: string;
  senderId: string;
  isAI: boolean;
  metadata: MessageMetadata | null;
  sender?: {
    imageUrl?: string;
    email: string;
    displayName?: string;
  };
}

// Define GroupMatch related types
export interface GroupMatchProfile {
  profileId: string;
  hasAccepted: boolean;
  profile: {
    id: string;
    imageUrl?: string;
    displayName?: string;
  };
}

export interface ChatRoomWithDetails {
  id: string;
  messages: Message[];
  lastMessage?: Date;
  match?: {
    users: Array<{
      user: {
        email: string;
        imageUrl?: string;
        displayName?: string;
      };
    }>;
  };
  groupMatch?: {
    id: string;
    profiles: GroupMatchProfile[];
    hikeSuggestions: HikeData[];
    description: string;
    chatRoom?: {
      id: string;
      lastMessage?: Date;
    };
  };
} 