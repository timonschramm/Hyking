import { Prisma } from '@prisma/client'

export type ChatRoomWithDetails = Prisma.ChatRoomGetPayload<{
  include: {
    match: {
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    }
    groupMatch: {
      include: {
        profiles: {
          include: {
            profile: true
          }
        }
        hikeSuggestions: true
      }
    }
    messages: {
      include: {
        sender: true
      }
    }
    participants: {
      include: {
        profile: true
      }
    }
  }
}>

export type MessageWithSender = Prisma.MessageGetPayload<{
  include: {
    sender: true
  }
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