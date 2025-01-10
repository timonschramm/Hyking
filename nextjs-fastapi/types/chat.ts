import { ChatRoom, Message, Participant, Prisma, Profile } from '@prisma/client';

export type MessageWithSender = Prisma.MessageGetPayload<{
  include: { sender: true }
}>;

export type ChatRoomWithMessagesAndParticipants = Prisma.ChatRoomGetPayload<{
  include: {
    messages: {
      include: {
        sender: true
      }
    };
    participants: {
      include: {
        profile: true
      }
    }
  }
}>;

type UsersOnMatch = {
  user: Profile;
  userId: string;
  matchId: string;
};

export type MatchWithDetails = {
  id: string;
  users: UsersOnMatch[];
  chatRoom?: ChatRoomWithMessagesAndParticipants;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
};

// Type for realtime message payload
export type RealtimeMessage = MessageWithSender;

// Helper function to ensure type consistency when updating messages
export const updateMatchWithNewMessage = (
  currentMatch: MatchWithDetails,
  newMessage: RealtimeMessage
): MatchWithDetails => {
  if (!currentMatch.chatRoom) return currentMatch;

  return {
    ...currentMatch,
    chatRoom: {
      ...currentMatch.chatRoom,
      messages: [...currentMatch.chatRoom.messages, newMessage],
      lastMessage: new Date()
    }
  };
}; 