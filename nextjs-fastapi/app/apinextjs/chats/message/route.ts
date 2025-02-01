import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, chatRoomId, isAI, metadata } = await request.json();
    console.log('Received message request:', { content, chatRoomId, userId: user.id, metadata });

    if (!chatRoomId) {
      return NextResponse.json({ error: 'ChatRoom ID is required' }, { status: 400 });
    }

    // Use HykingAI profile ID for AI messages
    const senderId = isAI ? '09c8872c-b243-4605-8d7d-44b548f9c2f4' : user.id;

    // Use a transaction to ensure both operations succeed or fail together
    const { message, chatRoom } = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content,
          chatRoomId,
          senderId,
          isAI,
          metadata: metadata || null, // Add metadata to the message
        },
        include: {
          sender: true,
        }
      });

      const chatRoom = await tx.chatRoom.update({
        where: { id: chatRoomId },
        data: { lastMessage: new Date() },
        include: {
          messages: true,
          participants: true,
        }
      });

      return { message, chatRoom };
    });

    console.log('Created message in database:', message);

    // Broadcast through Supabase Realtime with metadata
    const channel = supabaseClient.channel('messages');
    const resp = await channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: {
        id: message.id,
        content: message.content,
        chatRoomId: message.chatRoomId,
        senderId: message.senderId,
        sender: message.sender,
        createdAt: message.createdAt,
        isAI: message.isAI,
        metadata: message.metadata // Include metadata in the broadcast
      }
    });

    if (resp === 'error') {
      console.error('Error broadcasting message');
    } else {
      console.log('Successfully broadcast message with metadata');
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error handling message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 