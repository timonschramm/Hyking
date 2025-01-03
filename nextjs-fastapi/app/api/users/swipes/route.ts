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

    // Check if there's a match (other user has already liked current user)
    if (action === 'like') {
      const otherUserSwipe = await prisma.userSwipe.findFirst({
        where: {
          senderId: receiverId,
          receiverId: user.id,
          action: 'like'
        }
      });

      if (otherUserSwipe) {
        // Create a match
        const match = await prisma.match.create({
          data: {
            users: {
              connect: [
                { id: user.id },
                { id: receiverId }
              ]
            }
          }
        });

        return NextResponse.json({ swipe, match });
      }
    }

    return NextResponse.json({ swipe });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json({ error: 'Failed to record swipe' }, { status: 500 });
  }
} 