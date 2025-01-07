import { Prisma } from '@prisma/client';

export type MessageWithSender = Prisma.MessageGetPayload<{
  include: { sender: true }
}>;

export type ChatRoomWithMessages = Prisma.ChatRoomGetPayload<{
  include: {
    messages: true;
  }
}>;

export type MatchWithDetails = Prisma.MatchGetPayload<{
  include: {
    users: true;
    chatRoom: {
      include: {
        messages: true;
      }
    }
  }
}>;

// Type for realtime message payload
export type RealtimeMessage = Pick<
  Prisma.MessageGetPayload<{}>, 
  'id' | 'content' | 'chatRoomId' | 'senderId' | 'createdAt'
>; 