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

    const { receiverId, action } = await request.json();

    if (!receiverId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Record the swipe
    const swipe = await prisma.userSwipe.create({
      data: {
        senderId: user.id,
        receiverId,
        action,
      },
    });

    // Check if there's a match
    if (action === 'like') {
      const otherUserSwipe = await prisma.userSwipe.findFirst({
        where: {
          senderId: receiverId,
          receiverId: user.id,
          action: 'like'
        }
      });

      if (otherUserSwipe) {
        // Create a match and a chat room in a transaction
        const { match, chatRoom } = await prisma.$transaction(async (tx) => {
          const match = await tx.match.create({
            data: {
              users: {
                connect: [
                  { id: user.id },
                  { id: receiverId }
                ]
              }
            }
          });

          // Create chat room for the match
          const chatRoom = await tx.chatRoom.create({
            data: {
              matchId: match.id,
              participants: {
                create: [
                  { profileId: user.id },
                  { profileId: receiverId }
                ]
              }
            }
          });

          return { match, chatRoom };
        });

        return NextResponse.json({ swipe, match, chatRoom });
      }
    }

    return NextResponse.json({ swipe });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json({ error: 'Failed to record swipe' }, { status: 500 });
  }
} 