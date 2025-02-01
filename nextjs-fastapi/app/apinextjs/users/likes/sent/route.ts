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

    // Get users that the current user has liked with minimal data
    const sentLikes = await prisma.userSwipe.findMany({
      where: {
        senderId: user.id,
        action: 'like',
      },
      select: {
        id: true,
        timestamp: true,
        receiver: {
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

    return NextResponse.json(sentLikes);
  } catch (error) {
    console.error('Error fetching sent likes:', error);
    return NextResponse.json({ error: 'Failed to fetch sent likes' }, { status: 500 });
  }
} 