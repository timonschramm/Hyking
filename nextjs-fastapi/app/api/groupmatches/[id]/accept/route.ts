import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the group match with its chat room
    const groupMatch = await prisma.groupMatch.findUnique({
      where: { id: params.id },
      include: { chatRoom: true }
    })

    if (!groupMatch) {
      return NextResponse.json({ error: 'Group match not found' }, { status: 404 })
    }

    // Update the user's acceptance status
    await prisma.profileOnGroupSuggestion.update({
      where: {
        profileId_groupMatchId: {
          profileId: user.id,
          groupMatchId: params.id
        }
      },
      data: {
        hasAccepted: true
      }
    })

    // Return the chat room ID if it exists
    if (groupMatch.chatRoom) {
      return NextResponse.json({ chatRoomId: groupMatch.chatRoom.id })
    }

    return NextResponse.json({ message: 'Acceptance recorded' })
  } catch (error) {
    console.error('Error accepting group match:', error)
    return NextResponse.json({ error: 'Failed to accept group match' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 