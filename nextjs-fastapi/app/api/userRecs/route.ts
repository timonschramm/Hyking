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

    // Get users who haven't been swiped on yet
    const profiles = await prisma.profile.findMany({
      where: {
        AND: [
          { id: { not: user.id } }, // Exclude current user
          {
            NOT: {
              // Exclude users that the current user has already swiped on
              receivedSwipes: {
                some: {
                  senderId: user.id
                }
              }
            }
          }
        ]
      },
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
        }
      },
      take: 10,
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
} 