import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matches = await prisma.match.findMany({
      where: {
        users: {
          some: {
            userId: user.id
          }
        },
        isActive: true
      },
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
        },
        chatRoom: {
          include: {
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
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
} 