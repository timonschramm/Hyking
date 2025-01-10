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

    // Get users that the current user has liked
    const sentLikes = await prisma.userSwipe.findMany({
      where: {
        senderId: user.id,
        action: 'like',
      },
      include: {
        receiver: {
          include: {
            artists: {
              include: {
                artist: {
                  include: {
                    genres: true
                  }
                }
              }
            },
            interests: {
              include: {
                interest: true
              }
            },
            skills: {
              include: {
                skill: true,
                skillLevel: true
              }
            }
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