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

    // Get users who have liked the current user
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
      include: {
        sender: {
          // TODO Include less as well
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

    return NextResponse.json(receivedLikes);
  } catch (error) {
    console.error('Error fetching received likes:', error);
    return NextResponse.json({ error: 'Failed to fetch received likes' }, { status: 500 });
  }
} 