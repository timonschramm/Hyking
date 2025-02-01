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

    const { matchId } = await request.json();

    // Create or get chat room
    const chatRoom = await prisma.chatRoom.upsert({
      where: { matchId },
      create: {
        matchId,
        participants: {
          create: {
            profileId: user.id,
          }
        }
      },
      update: {},
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        participants: true,
      }
    });

    return NextResponse.json(chatRoom);
  } catch (error) {
    console.error('Error with chat room:', error);
    return NextResponse.json({ error: 'Failed to handle chat room' }, { status: 500 });
  }
} 