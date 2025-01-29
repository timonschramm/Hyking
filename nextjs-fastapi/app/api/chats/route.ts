import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all chat rooms where the user is a participant
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
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
      },
      orderBy: {
        lastMessage: {
          sort: 'desc',
          nulls: 'last'
        }
      }
    })

    return NextResponse.json(chatRooms)
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 