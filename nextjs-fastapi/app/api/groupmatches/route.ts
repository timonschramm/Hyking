import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { groupMatchListView } from '@/types/groupMatch'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupMatches = await prisma.groupMatch.findMany({
      where: {
        profiles: {
          some: {
            profileId: user.id
          }
        }
      },
      select: groupMatchListView,
    })

    // Add currentUserId to each group match
    const groupMatchesWithCurrentUser = groupMatches.map(match => ({
      ...match,
      currentUserId: user.id
    }))

    return NextResponse.json(groupMatchesWithCurrentUser)
  } catch (error) {
    console.error('Error fetching group matches:', error)
    return NextResponse.json({ error: 'Failed to fetch group matches' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 