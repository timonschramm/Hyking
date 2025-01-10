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

    // Update the user's acceptance status
    const groupMatch = await prisma.profileOnGroupSuggestion.update({
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

    // Check if all users have accepted
    const allAccepted = await prisma.profileOnGroupSuggestion.findMany({
      where: {
        groupMatchId: params.id
      }
    })

    const everyoneAccepted = allAccepted.every(match => match.hasAccepted)

    if (everyoneAccepted) {
      // Create a match record with explicit connections through UsersOnMatch
      const match = await prisma.match.create({
        data: {
          users: {
            create: allAccepted.map(match => ({
              userId: match.profileId
            }))
          }
        }
      })

      // Create a chat room for the group
      const chatRoom = await prisma.chatRoom.create({
        data: {
          matchId: match.id,
          groupMatchId: params.id,
          participants: {
            create: allAccepted.map(match => ({
              profileId: match.profileId
            }))
          }
        }
      })

      // Update the group match with the chat room
      await prisma.groupMatch.update({
        where: { id: params.id },
        data: { chatRoomId: chatRoom.id }
      })

      return NextResponse.json({ chatRoomId: chatRoom.id })
    }

    return NextResponse.json({ message: 'Acceptance recorded' })
  } catch (error) {
    console.error('Error accepting group match:', error)
    return NextResponse.json({ error: 'Failed to accept group match' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 