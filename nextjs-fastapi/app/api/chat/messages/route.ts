import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, chatRoomId } = await request.json();
    console.log('Received message request:', { content, chatRoomId, userId: user.id });

    if (!chatRoomId) {
      return NextResponse.json({ error: 'ChatRoom ID is required' }, { status: 400 });
    }

    // Use a transaction to ensure both operations succeed or fail together
    const { message, chatRoom } = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content,
          chatRoomId,
          senderId: user.id,
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

    // Broadcast through Supabase Realtime
    const resp = (await (await supabase).channel('messages')
      .send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          id: message.id,
          content: message.content,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
          sender: message.sender,
          createdAt: message.createdAt
        }
      }));

    if (resp === 'error') {
      console.error('Error broadcasting to Supabase:');
    } else if (resp === 'ok') {
      console.log('Successfully broadcast message');
    } else {
      console.error('Unknown response from Supabase:', resp);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error handling message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 