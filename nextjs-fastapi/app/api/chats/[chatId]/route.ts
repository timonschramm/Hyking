import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the chat room with all necessary details
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: params.chatId,
        participants: {
          some: {
            profileId: user.id
          }
        }
      },
      include: {
        match: {
          include: {
            users: {
              include: {
                user: true
              },
              where: {
                userId: {
                  not: user.id
                }
              }
            }
          }
        },
        groupMatch: {
          include: {
            profiles: {
              include: {
                profile: true
              }
            },
            hikeSuggestions: true
          }
        },
        messages: {
          include: {
            sender: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        participants: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chatRoom);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 