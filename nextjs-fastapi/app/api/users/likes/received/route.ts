import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users who have liked the current user with minimal data
    const receivedLikes = await prisma.userSwipe.findMany({
      where: {
        receiverId: user.id,
        action: 'like',
        // Only get likes where we haven't swiped back yet
        NOT: {
          sender: {
            receivedSwipes: {
              some: {
                senderId: user.id
              }
            }
          }
        }
      },
      select: {
        id: true,
        timestamp: true,
        sender: {
          select: {
            id: true,
            imageUrl: true,
            displayName: true,
            location: true,
            email: true,
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return NextResponse.json(receivedLikes);
  } catch (error) {
    console.error('Error fetching received likes:', error);
    return NextResponse.json({ error: 'Failed to fetch received likes' }, { status: 500 });
  }
} 